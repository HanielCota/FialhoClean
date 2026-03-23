use crate::errors::AppError;
use crate::models::optimizer::{
    HibernateSettings, NetworkSettings, PowerPlan, ScheduledTask, ServiceAction, ServiceInfo,
    ServiceSafety, ServiceStatus, StartType, StartupItem, StartupSource, TaskState,
};
use crate::services::process_runner::ProcessRunner;
use crate::services::registry::{hkcu, hklm, RegistryExt};
use std::time::Duration;
use winreg::enums::*;
use winreg::RegKey;

const REG_RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const ULTIMATE_PERF_GUID: &str = "e9a42b02-d5df-448d-aa00-03f14749eb61";
const HIGH_PERF_GUID: &str = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";
const REG_STARTUP_APPROVED_KEY: &str =
    r"Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run";
const REG_VISUAL_EFFECTS_KEY: &str =
    r"Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects";
const REG_POWER_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Power";
const REG_SESSION_POWER_KEY: &str = r"SYSTEM\CurrentControlSet\Control\Session Manager\Power";
const REG_MULTIMEDIA_PROFILE_KEY: &str =
    r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile";
const REG_GAME_BAR_KEY: &str = r"Software\Microsoft\GameBar";

/// Shared runner for all optimizer subprocesses (30s timeout).
const RUNNER: ProcessRunner = ProcessRunner::new("optimizer", Duration::from_secs(30));

const SAFE_TO_DISABLE_SERVICES: &[&str] = &[
    "SysMain",            // Superfetch
    "DiagTrack",          // Connected User Experiences and Telemetry
    "WSearch",            // Windows Search
    "Fax",                // Fax service
    "PrintNotify",        // Printer extensions
    "TabletInputService", // Tablet PC input
    "WMPNetworkSvc",      // Windows Media Player sharing
    "XblAuthManager",     // Xbox Live Auth Manager
    "XblGameSave",        // Xbox Live Game Save
    "XboxNetApiSvc",      // Xbox Live Networking
    "MapsBroker",         // Downloaded Maps Manager
    "RetailDemo",         // Retail Demo Service
    "lfsvc",              // Geolocation Service
    "PhoneSvc",           // Phone Service
    "wisvc",              // Windows Insider Service
    "RemoteRegistry",     // Remote Registry (security risk)
    "TrkWks",             // Distributed Link Tracking Client
    "dmwappushservice",   // WAP Push Message Routing (telemetry)
];

const CAUTION_SERVICES: &[&str] = &[
    "Spooler",  // Print Spooler
    "BITS",     // Background Intelligent Transfer
    "wuauserv", // Windows Update
    "ndu",      // Network Data Usage
    "WerSvc",   // Windows Error Reporting Service
];

/// Static descriptions for all managed services.
fn service_description(name: &str) -> &'static str {
    match name {
        "SysMain" => "Prefetches frequently used apps into RAM to speed up launches. Disabling frees memory but may slow first app open after reboot.",
        "DiagTrack" => "Sends diagnostic and usage data to Microsoft servers. Disabling improves privacy and reduces background network activity.",
        "WSearch" => "Indexes your files for fast search in Explorer and Start Menu. Disabling frees CPU/disk I/O but makes search noticeably slower.",
        "Fax" => "Allows sending and receiving faxes through a modem or network fax server. Safe to disable if you don't own a fax machine.",
        "PrintNotify" => "Handles printer status pop-ups and notifications. Safe to disable if you don't use a printer.",
        "TabletInputService" => "Powers the touch keyboard, pen input, and handwriting recognition panel. Safe to disable on non-touch desktop PCs.",
        "WMPNetworkSvc" => "Shares your Windows Media Player library over your local network. Safe to disable if you don't use media sharing.",
        "XblAuthManager" => "Manages sign-in to Xbox Live and authenticates Xbox app features. Safe to disable if you don't use Xbox on this PC.",
        "XblGameSave" => "Syncs Xbox game save data to the cloud. Safe to disable if you don't play Xbox games.",
        "XboxNetApiSvc" => "Provides networking support for Xbox Live multiplayer features. Safe to disable if you don't game on Xbox.",
        "MapsBroker" => "Downloads and updates offline map data for the Windows Maps app. Safe to disable if you don't use offline maps.",
        "RetailDemo" => "Enables retail store demo mode (kiosk loop). Always safe to disable on personal PCs.",
        "lfsvc" => "Provides location data to apps that request your geographic position. Disable to improve privacy and reduce background activity.",
        "PhoneSvc" => "Manages state for telephony and Wi-Fi calling features. Safe to disable if you don't link a phone to this PC.",
        "wisvc" => "Enables Windows Insider Preview features and telemetry for beta builds. Safe to disable on stable Windows releases.",
        "RemoteRegistry" => "Allows remote users to read or modify this PC's registry over the network. Disabling improves security on home PCs.",
        "TrkWks" => "Tracks moved NTFS files and shortcuts across drives and network shares. Safe to disable on standalone home PCs.",
        "dmwappushservice" => "Routes WAP push messages used by some Microsoft telemetry pipelines. Disabling reduces background data collection.",
        "Spooler" => "Manages the print queue and communicates with printers. Disabling prevents all printing — only disable if no printer is ever used.",
        "BITS" => "Downloads Windows updates and other files in the background at low priority. Disabling may pause Windows Update downloads.",
        "wuauserv" => "Checks for, downloads, and installs Windows security and feature updates. Disabling prevents security patches — use with caution.",
        "ndu" => "Monitors network data usage per application. Disabling saves a small amount of RAM with no user-facing impact.",
        "WerSvc" => "Collects crash reports and sends them to Microsoft. Disabling stops automatic error reporting but does not affect stability.",
        _ => "",
    }
}

/// Returns true if `s` is a valid lowercase or uppercase GUID in the form
/// `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
fn is_valid_guid(s: &str) -> bool {
    if s.len() != 36 {
        return false;
    }
    s.chars().enumerate().all(|(i, c)| {
        if [8, 13, 18, 23].contains(&i) {
            c == '-'
        } else {
            c.is_ascii_hexdigit()
        }
    })
}

fn extract_guid(text: &str) -> Option<String> {
    let chars: Vec<char> = text.chars().collect();
    if chars.len() < 36 {
        return None;
    }

    for start in 0..=chars.len() - 36 {
        let candidate: String = chars[start..start + 36].iter().collect();
        if is_valid_guid(&candidate) {
            return Some(candidate);
        }
    }

    None
}

fn parse_power_plan_line(line: &str) -> Option<PowerPlan> {
    let guid = extract_guid(line)?;
    let name = line
        .find('(')
        .and_then(|start| line.rfind(')').map(|end| (start, end)))
        .filter(|(start, end)| start < end)
        .and_then(|(start, end)| line.get(start + 1..end).map(|s| s.trim().to_string()))
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "Unknown".to_string());

    Some(PowerPlan {
        guid,
        name,
        is_active: line.trim_end().ends_with('*'),
    })
}

fn startup_enabled_from_approved(root: &RegKey, name: &str) -> bool {
    root.open_subkey(REG_STARTUP_APPROVED_KEY)
        .ok()
        .and_then(|k| k.get_raw_value(name).ok())
        .and_then(|value| value.bytes.first().copied())
        .map(|b| b == 2)
        .unwrap_or(true)
}

fn startup_root_from_key_path(key_path: &str) -> Result<RegKey, AppError> {
    if key_path.starts_with("HKEY_CURRENT_USER\\") {
        Ok(RegKey::predef(HKEY_CURRENT_USER))
    } else if key_path.starts_with("HKEY_LOCAL_MACHINE\\") {
        Ok(RegKey::predef(HKEY_LOCAL_MACHINE))
    } else {
        Err(AppError::Custom(format!(
            "unsupported startup key path: {}",
            key_path
        )))
    }
}

pub async fn get_startup_items() -> Result<Vec<StartupItem>, AppError> {
    let sources = [
        (
            HKEY_CURRENT_USER,
            "HKEY_CURRENT_USER",
            StartupSource::HkeyCurrentUser,
        ),
        (
            HKEY_LOCAL_MACHINE,
            "HKEY_LOCAL_MACHINE",
            StartupSource::HkeyLocalMachine,
        ),
    ];

    let mut items = Vec::new();
    for (hkey, prefix, source) in sources {
        let root = RegKey::predef(hkey);
        let key_path = format!("{}\\{}", prefix, REG_RUN_KEY);
        if let Ok(run_key) = root.open_subkey(REG_RUN_KEY) {
            for (name, _) in run_key.enum_values().flatten() {
                let command: String = run_key.get_value(&name).unwrap_or_default();
                items.push(StartupItem {
                    name: name.clone(),
                    command,
                    key_path: key_path.clone(),
                    enabled: startup_enabled_from_approved(&root, &name),
                    source: source.clone(),
                });
            }
        }
    }

    Ok(items)
}

pub async fn set_startup_enabled(
    name: String,
    key_path: String,
    enabled: bool,
) -> Result<(), AppError> {
    tracing::info!(item = %name, enabled, "toggling startup item");
    // Verify the startup item actually exists in the exact registry hive the
    // frontend requested before writing to StartupApproved.
    let root = startup_root_from_key_path(&key_path)?;
    let exists = root
        .open_subkey(REG_RUN_KEY)
        .map(|k| k.get_value::<String, _>(&name).is_ok())
        .unwrap_or(false);

    if !exists {
        return Err(AppError::Custom(format!(
            "startup item not found in registry: {}",
            name
        )));
    }

    let (approved_key, _) = root
        .create_subkey(REG_STARTUP_APPROVED_KEY)
        .map_err(|e| AppError::Registry(e.to_string()))?;

    // Value bytes: [02, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 00] = enabled
    //              [03, 00, 00, 00, ...] = disabled
    let first_byte: u8 = if enabled { 2 } else { 3 };
    let value_bytes: Vec<u8> = std::iter::once(first_byte)
        .chain(std::iter::repeat(0).take(11))
        .collect();

    approved_key
        .set_raw_value(
            &name,
            &winreg::RegValue {
                bytes: value_bytes.into(),
                vtype: winreg::enums::RegType::REG_BINARY,
            },
        )
        .map_err(|e| AppError::Registry(format!("{}: {}", key_path, e)))?;

    Ok(())
}

pub async fn get_services() -> Result<Vec<ServiceInfo>, AppError> {
    let out = RUNNER
        .powershell(
            "Get-Service | Select-Object Name, DisplayName, Status, StartType | ConvertTo-Json",
        )
        .await?;

    let raw: Vec<serde_json::Value> =
        serde_json::from_str(&out.stdout).map_err(|e| AppError::Parse(e.to_string()))?;

    let services = raw.into_iter().filter_map(parse_service_entry).collect();

    Ok(services)
}

fn parse_service_entry(entry: serde_json::Value) -> Option<ServiceInfo> {
    let name = entry["Name"].as_str()?.to_string();
    let display_name = entry["DisplayName"].as_str().unwrap_or(&name).to_string();

    let status = match entry["Status"].as_u64().unwrap_or(0) {
        4 => ServiceStatus::Running,
        1 => ServiceStatus::Stopped,
        7 => ServiceStatus::Paused,
        _ => ServiceStatus::Unknown,
    };

    let start_type = match entry["StartType"].as_u64().unwrap_or(99) {
        2 => StartType::Automatic,
        3 => StartType::Manual,
        4 => StartType::Disabled,
        _ => StartType::Unknown,
    };

    let safety_level = if SAFE_TO_DISABLE_SERVICES.contains(&name.as_str()) {
        ServiceSafety::Safe
    } else if CAUTION_SERVICES.contains(&name.as_str()) {
        ServiceSafety::Caution
    } else {
        ServiceSafety::NotRecommended
    };

    // Only include services that are safe or caution
    let is_relevant = matches!(safety_level, ServiceSafety::Safe | ServiceSafety::Caution);
    if !is_relevant {
        return None;
    }

    let description = service_description(&name).to_string();

    Some(ServiceInfo {
        name,
        display_name,
        status,
        start_type,
        safety_level,
        description,
    })
}

pub async fn set_service_status(name: String, action: ServiceAction) -> Result<(), AppError> {
    // Only allow modifying services in the curated whitelist. This prevents a
    // manipulated frontend from targeting arbitrary services (e.g. WinDefend).
    let is_managed = SAFE_TO_DISABLE_SERVICES.contains(&name.as_str())
        || CAUTION_SERVICES.contains(&name.as_str());

    if !is_managed {
        return Err(AppError::Custom(format!(
            "service '{}' is not in the managed services list",
            name
        )));
    }

    let mut cmd = tokio::process::Command::new("sc.exe");
    match action {
        ServiceAction::Enable => {
            cmd.args(["config", &name, "start=", "auto"]);
        }
        ServiceAction::Disable => {
            cmd.args(["config", &name, "start=", "disabled"]);
        }
        ServiceAction::Start => {
            cmd.args(["start", &name]);
        }
        ServiceAction::Stop => {
            cmd.args(["stop", &name]);
        }
    }

    RUNNER.run(cmd).await?;
    tracing::info!(service = %name, action = ?action, "service status changed");
    Ok(())
}

pub async fn get_power_plans() -> Result<Vec<PowerPlan>, AppError> {
    let mut cmd = tokio::process::Command::new("powercfg");
    cmd.args(["/list"]);
    let out = RUNNER.run(cmd).await?;
    let text = out.stdout;
    Ok(text.lines().filter_map(parse_power_plan_line).collect())
}

pub async fn set_power_plan(plan_guid: String) -> Result<(), AppError> {
    tracing::info!(guid = %plan_guid, "switching power plan");
    // Validate GUID format before passing to powercfg to prevent unexpected
    // argument injection even though .args() already provides OS-level quoting.
    if !is_valid_guid(&plan_guid) {
        return Err(AppError::Custom(format!(
            "invalid power plan GUID: {}",
            plan_guid
        )));
    }

    let mut cmd = tokio::process::Command::new("powercfg");
    cmd.args(["/setactive", &plan_guid]);
    RUNNER.run(cmd).await?;
    Ok(())
}

/// Activates the Ultimate Performance power plan.
///
/// Strategy (three-step):
///   1. Try `powercfg /setactive <ultimate-guid>` directly — succeeds if the plan
///      was already unlocked in a previous session.
///   2. If that fails, run `powercfg -duplicatescheme <ultimate-guid>` to create a
///      local copy, parse the new GUID from stdout, then activate it.
///   3. If the edition doesn't support Ultimate Performance (e.g. Windows Home),
///      fall back silently to High Performance.
pub async fn apply_ultimate_performance() -> Result<(), AppError> {
    tracing::info!("applying ultimate performance power plan");
    // Step 1: activate if already available
    let mut cmd1 = tokio::process::Command::new("powercfg");
    cmd1.args(["/setactive", ULTIMATE_PERF_GUID]);
    if RUNNER.run(cmd1).await.is_ok() {
        return Ok(());
    }

    // Step 2: unlock by duplicating the built-in scheme
    let mut cmd2 = tokio::process::Command::new("powercfg");
    cmd2.args(["-duplicatescheme", ULTIMATE_PERF_GUID]);
    if let Some(stdout) = RUNNER.run_best_effort(cmd2).await {
        let new_guid = stdout.lines().find_map(extract_guid);
        if let Some(guid) = new_guid {
            let mut cmd3 = tokio::process::Command::new("powercfg");
            cmd3.args(["/setactive", &guid]);
            let _ = RUNNER.run(cmd3).await;
            return Ok(());
        }
    }

    // Step 3: fallback to High Performance
    let mut cmd4 = tokio::process::Command::new("powercfg");
    cmd4.args(["/setactive", HIGH_PERF_GUID]);
    let _ = RUNNER.run(cmd4).await;

    Ok(())
}

pub async fn set_visual_effects(performance_mode: bool) -> Result<(), AppError> {
    tracing::info!(performance_mode, "setting visual effects");
    let val: u32 = if performance_mode { 2 } else { 1 };
    hkcu().write_u32(REG_VISUAL_EFFECTS_KEY, "VisualFXSetting", val)
}

// ─── Hibernate / Fast Startup ──────────────────────────────────────────────

pub async fn get_hibernate_settings() -> Result<HibernateSettings, AppError> {
    let lm = hklm();
    Ok(HibernateSettings {
        hibernate_enabled: lm.read_bool(REG_POWER_KEY, "HibernateEnabled", true),
        fast_startup_enabled: lm.read_bool(REG_SESSION_POWER_KEY, "HiberbootEnabled", false),
    })
}

pub async fn set_hibernate(enabled: bool) -> Result<(), AppError> {
    tracing::info!(enabled, "toggling hibernate");
    let arg = if enabled { "on" } else { "off" };
    let mut cmd = tokio::process::Command::new("powercfg");
    cmd.args(["/hibernate", arg]);
    RUNNER.run(cmd).await?;
    Ok(())
}

pub async fn set_fast_startup(enabled: bool) -> Result<(), AppError> {
    tracing::info!(enabled, "toggling fast startup");
    let val: u32 = if enabled { 1 } else { 0 };
    hklm().write_u32(REG_SESSION_POWER_KEY, "HiberbootEnabled", val)
}

// ─── Game Mode Preset ──────────────────────────────────────────────────────

/// Applies the Game Mode preset: High Performance power plan + Windows Game Mode.
/// This is a one-shot action, not a toggle.
pub async fn apply_game_mode_preset() -> Result<(), AppError> {
    tracing::info!("applying game mode preset");
    // 1. Switch to High Performance power plan
    let mut cmd = tokio::process::Command::new("powercfg");
    cmd.args(["/setactive", HIGH_PERF_GUID]);
    let _ = RUNNER.run(cmd).await;

    // 2. Enable Windows Game Mode via registry
    let _ = hkcu().write_u32(REG_GAME_BAR_KEY, "AutoGameModeEnabled", 1);

    Ok(())
}

// ─── Network Optimizer ────────────────────────────────────────────────────

pub async fn get_network_settings() -> Result<NetworkSettings, AppError> {
    let network_throttling_disabled =
        hklm().read_u32(REG_MULTIMEDIA_PROFILE_KEY, "NetworkThrottlingIndex", 10) == 0xFFFF_FFFF;

    Ok(NetworkSettings {
        network_throttling_disabled,
    })
}

pub async fn set_network_optimized(enabled: bool) -> Result<(), AppError> {
    tracing::info!(enabled, "toggling network optimization");
    let lm = hklm();
    if enabled {
        lm.write_u32(
            REG_MULTIMEDIA_PROFILE_KEY,
            "NetworkThrottlingIndex",
            0xFFFF_FFFF,
        )?;
        lm.write_u32(REG_MULTIMEDIA_PROFILE_KEY, "SystemResponsiveness", 0)?;
    } else {
        lm.write_u32(REG_MULTIMEDIA_PROFILE_KEY, "NetworkThrottlingIndex", 10)?;
        lm.write_u32(REG_MULTIMEDIA_PROFILE_KEY, "SystemResponsiveness", 20)?;
    }
    Ok(())
}

// ─── Scheduled Tasks ─────────────────────────────────────────────────────

/// Curated list of telemetry-related scheduled tasks.
/// Each entry: (full_task_path, display_description)
const MANAGED_TASKS: &[(&str, &str)] = &[
    (
        r"\Microsoft\Windows\Customer Experience Improvement Program\Consolidator",
        "Sends aggregated usage data to Microsoft's CEIP program.",
    ),
    (
        r"\Microsoft\Windows\Customer Experience Improvement Program\KernelCeipTask",
        "Collects kernel-level diagnostics for the Customer Experience Improvement Program.",
    ),
    (
        r"\Microsoft\Windows\Customer Experience Improvement Program\UsbCeip",
        "Reports USB device usage statistics to Microsoft.",
    ),
    (
        r"\Microsoft\Windows\Application Experience\ProgramDataUpdater",
        "Sends program compatibility telemetry to Microsoft servers.",
    ),
    (
        r"\Microsoft\Windows\Application Experience\Microsoft Compatibility Appraiser",
        "Evaluates installed apps for Windows upgrade compatibility — runs in background.",
    ),
    (
        r"\Microsoft\Windows\Autochk\Proxy",
        "Forwards crash data to Microsoft as part of Windows Error Reporting.",
    ),
    (
        r"\Microsoft\Windows\DiskDiagnostic\Microsoft-Windows-DiskDiagnosticDataCollector",
        "Collects disk health data and sends reports to Microsoft diagnostics.",
    ),
];

pub async fn get_scheduled_tasks() -> Result<Vec<ScheduledTask>, AppError> {
    // Build a single PowerShell command that queries each known task.
    // We use Get-ScheduledTask with -ErrorAction SilentlyContinue so missing
    // tasks (not present on all Windows SKUs) are simply skipped.
    let ps_command = "\
        [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
        $paths = @(\
            '\\Microsoft\\Windows\\Customer Experience Improvement Program\\', \
            '\\Microsoft\\Windows\\Application Experience\\', \
            '\\Microsoft\\Windows\\Autochk\\', \
            '\\Microsoft\\Windows\\DiskDiagnostic\\' \
        ); \
        $results = foreach ($p in $paths) { \
            Get-ScheduledTask -TaskPath $p -ErrorAction SilentlyContinue \
        }; \
        $results | Select-Object TaskName, TaskPath, @{N='State';E={$_.State.ToString()}} \
            | ConvertTo-Json -Compress";

    let output = RUNNER.powershell(ps_command).await?;
    let json_str = output.stdout.trim();

    if json_str.is_empty() {
        return Ok(Vec::new());
    }

    // PowerShell returns a single object (not array) when there's only one result
    let raw: Vec<serde_json::Value> = if json_str.starts_with('[') {
        serde_json::from_str(json_str).unwrap_or_default()
    } else {
        serde_json::from_str(json_str)
            .map(|v| vec![v])
            .unwrap_or_default()
    };

    let mut tasks = Vec::new();
    for entry in raw {
        let task_name = match entry["TaskName"].as_str() {
            Some(n) => n.to_string(),
            None => continue,
        };
        let task_path_raw = entry["TaskPath"].as_str().unwrap_or("").to_string();
        let state = match entry["State"].as_str().unwrap_or("") {
            "Ready" => TaskState::Ready,
            "Running" => TaskState::Running,
            "Disabled" => TaskState::Disabled,
            "Queued" => TaskState::Queued,
            _ => TaskState::Unknown,
        };

        // Build the full path the same way we store in MANAGED_TASKS (no trailing slash on name)
        let full_path = format!("{}{}", task_path_raw.trim_end_matches('\\'), task_name);
        let full_path_norm = full_path.to_lowercase();

        // Find the description in our curated list
        let description = MANAGED_TASKS
            .iter()
            .find(|(p, _)| p.to_lowercase() == full_path_norm)
            .map(|(_, d)| *d)
            .unwrap_or("")
            .to_string();

        tasks.push(ScheduledTask {
            name: task_name,
            task_path: full_path,
            state,
            description,
        });
    }

    Ok(tasks)
}

pub async fn set_scheduled_task_enabled(task_path: String, enabled: bool) -> Result<(), AppError> {
    tracing::info!(task = %task_path, enabled, "toggling scheduled task");
    // Validate the task path against our whitelist before executing
    let is_managed = MANAGED_TASKS
        .iter()
        .any(|(p, _)| p.to_lowercase() == task_path.to_lowercase());

    if !is_managed {
        return Err(AppError::Custom(format!(
            "scheduled task '{}' is not in the managed tasks list",
            task_path
        )));
    }

    // Split into folder path and task name for PowerShell
    let (folder, name) = if let Some(pos) = task_path.rfind('\\') {
        (&task_path[..pos + 1], &task_path[pos + 1..])
    } else {
        return Err(AppError::Custom("invalid task path format".into()));
    };

    let action = if enabled { "Enable" } else { "Disable" };

    let mut cmd = tokio::process::Command::new("powershell");
    cmd.args([
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "& { $a = $env:FIALHO_ACTION; & \"${a}-ScheduledTask\" -TaskPath $env:FIALHO_FOLDER -TaskName $env:FIALHO_NAME -ErrorAction Stop }",
    ])
    .env("FIALHO_ACTION", action)
    .env("FIALHO_FOLDER", folder)
    .env("FIALHO_NAME", name);

    RUNNER.run(cmd).await?;
    Ok(())
}

// ── GPU Hardware-Accelerated GPU Scheduling (HAGS) ──────────────────────────

const REG_GRAPHICS_DRIVERS_KEY: &str = r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers";

pub async fn get_gpu_settings() -> Result<crate::models::optimizer::GpuSettings, AppError> {
    let hags_enabled = hklm().read_u32(REG_GRAPHICS_DRIVERS_KEY, "HwSchMode", 1) == 2;
    Ok(crate::models::optimizer::GpuSettings { hags_enabled })
}

pub async fn set_gpu_hags(enabled: bool) -> Result<(), AppError> {
    tracing::info!(enabled, "toggling GPU hardware-accelerated scheduling");
    let val: u32 = if enabled { 2 } else { 1 };
    hklm().write_u32(REG_GRAPHICS_DRIVERS_KEY, "HwSchMode", val)
}

// ── Privacy Settings ──────────────────────────────────────────────────────────

const REG_TELEMETRY_KEY: &str =
    r"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection";
const REG_SEARCH_KEY: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Search";
const REG_ADVERTISING_KEY: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo";
const REG_ACTIVITY_KEY: &str = r"SOFTWARE\Policies\Microsoft\Windows\System";
const REG_LOCATION_KEY: &str =
    r"SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location";

pub async fn get_privacy_settings() -> Result<crate::models::optimizer::PrivacySettings, AppError> {
    let lm = hklm();
    let cu = hkcu();

    Ok(crate::models::optimizer::PrivacySettings {
        telemetry_disabled: lm.read_u32(REG_TELEMETRY_KEY, "AllowTelemetry", 1) == 0,
        bing_search_disabled: cu.read_u32(REG_SEARCH_KEY, "BingSearchEnabled", 1) == 0,
        advertising_id_disabled: cu.read_u32(REG_ADVERTISING_KEY, "Enabled", 1) == 0,
        activity_history_disabled: lm.read_u32(REG_ACTIVITY_KEY, "EnableActivityFeed", 1) == 0,
        location_disabled: cu
            .read_string(REG_LOCATION_KEY, "Value", "Allow")
            .to_lowercase()
            == "deny",
    })
}

pub async fn set_privacy_setting(setting_key: String, disabled: bool) -> Result<(), AppError> {
    tracing::info!(setting = %setting_key, disabled, "toggling privacy setting");
    let lm = hklm();
    let cu = hkcu();
    let val: u32 = if disabled { 0 } else { 1 };

    match setting_key.as_str() {
        "telemetry" => {
            lm.write_u32(REG_TELEMETRY_KEY, "AllowTelemetry", val)?;
            // Also set in the policies key for belt-and-suspenders
            let _ = lm.write_u32(
                r"SOFTWARE\Policies\Microsoft\Windows\DataCollection",
                "AllowTelemetry",
                val,
            );
        }
        "bing_search" => {
            cu.write_u32(REG_SEARCH_KEY, "BingSearchEnabled", val)?;
        }
        "advertising_id" => {
            cu.write_u32(REG_ADVERTISING_KEY, "Enabled", val)?;
        }
        "activity_history" => {
            lm.write_u32(REG_ACTIVITY_KEY, "EnableActivityFeed", val)?;
            lm.write_u32(REG_ACTIVITY_KEY, "PublishUserActivities", val)?;
        }
        "location" => {
            let str_val = if disabled { "Deny" } else { "Allow" };
            cu.write_string(REG_LOCATION_KEY, "Value", str_val)?;
        }
        _ => {
            return Err(AppError::Custom(format!(
                "Unknown privacy setting: {}",
                setting_key
            )))
        }
    }

    Ok(())
}

// ── RAM Optimization ─────────────────────────────────────────────────────────

pub async fn optimize_ram() -> Result<crate::models::optimizer::RamOptimizationResult, AppError> {
    tracing::info!("starting RAM optimization");
    let script = r#"
$before = [long](Get-WmiObject Win32_OperatingSystem).FreePhysicalMemory * 1024
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WsUtil {
    [DllImport("psapi.dll")]
    public static extern bool EmptyWorkingSet(IntPtr handle);
}
"@ -ErrorAction SilentlyContinue
$procs = [System.Diagnostics.Process]::GetProcesses()
foreach ($p in $procs) {
    try { [void][WsUtil]::EmptyWorkingSet($p.Handle) } catch {}
}
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()
Start-Sleep -Milliseconds 800
$after = [long](Get-WmiObject Win32_OperatingSystem).FreePhysicalMemory * 1024
$freed = $after - $before
if ($freed -lt 0) { $freed = 0 }
Write-Output $freed
"#;

    let result = RUNNER.powershell(script).await;
    let freed_bytes: i64 = match result {
        Ok(output) => output.stdout.trim().parse().unwrap_or(0),
        Err(_) => 0,
    };
    Ok(crate::models::optimizer::RamOptimizationResult { freed_bytes })
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── GUID validation ─────────────────────────────────────────────────────

    #[test]
    fn valid_guid_lowercase() {
        assert!(is_valid_guid("381b4222-f694-41f0-9685-ff5bb260df2e"));
    }

    #[test]
    fn valid_guid_uppercase() {
        assert!(is_valid_guid("E9A42B02-D5DF-448D-AA00-03F14749EB61"));
    }

    #[test]
    fn valid_guid_mixed_case() {
        assert!(is_valid_guid("e9A42b02-D5df-448D-aA00-03f14749Eb61"));
    }

    #[test]
    fn rejects_short_string() {
        assert!(!is_valid_guid("381b4222-f694-41f0-9685"));
    }

    #[test]
    fn rejects_long_string() {
        assert!(!is_valid_guid("381b4222-f694-41f0-9685-ff5bb260df2e0"));
    }

    #[test]
    fn rejects_missing_hyphens() {
        assert!(!is_valid_guid("381b4222xf694x41f0x9685xff5bb260df2e"));
    }

    #[test]
    fn rejects_non_hex_characters() {
        assert!(!is_valid_guid("zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"));
    }

    #[test]
    fn rejects_empty_string() {
        assert!(!is_valid_guid(""));
    }

    // ── GUID extraction ─────────────────────────────────────────────────────

    #[test]
    fn extract_guid_from_powercfg_line() {
        let line = "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)";
        assert_eq!(
            extract_guid(line),
            Some("381b4222-f694-41f0-9685-ff5bb260df2e".to_string())
        );
    }

    #[test]
    fn extract_guid_returns_none_for_no_guid() {
        assert_eq!(extract_guid("no guid here"), None);
    }

    #[test]
    fn extract_guid_returns_none_for_short_input() {
        assert_eq!(extract_guid("abc"), None);
    }

    // ── Power plan line parsing ─────────────────────────────────────────────

    #[test]
    fn parse_active_power_plan() {
        let line = "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced) *";
        let plan = parse_power_plan_line(line).unwrap();
        assert_eq!(plan.guid, "381b4222-f694-41f0-9685-ff5bb260df2e");
        assert_eq!(plan.name, "Balanced");
        assert!(plan.is_active);
    }

    #[test]
    fn parse_inactive_power_plan() {
        let line = "Power Scheme GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  (High performance)";
        let plan = parse_power_plan_line(line).unwrap();
        assert_eq!(plan.guid, "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c");
        assert_eq!(plan.name, "High performance");
        assert!(!plan.is_active);
    }

    #[test]
    fn parse_plan_without_name_falls_back() {
        let line = "GUID: 381b4222-f694-41f0-9685-ff5bb260df2e";
        let plan = parse_power_plan_line(line).unwrap();
        assert_eq!(plan.name, "Unknown");
    }

    #[test]
    fn parse_plan_no_guid_returns_none() {
        assert!(parse_power_plan_line("no plan here").is_none());
    }

    // ── Service whitelist ───────────────────────────────────────────────────

    #[test]
    fn managed_service_is_in_whitelist() {
        assert!(SAFE_TO_DISABLE_SERVICES.contains(&"DiagTrack"));
        assert!(CAUTION_SERVICES.contains(&"wuauserv"));
    }

    #[test]
    fn critical_service_not_in_whitelist() {
        assert!(!SAFE_TO_DISABLE_SERVICES.contains(&"WinDefend"));
        assert!(!CAUTION_SERVICES.contains(&"WinDefend"));
    }

    // ── Startup key path validation ─────────────────────────────────────────

    #[test]
    fn valid_hkcu_key_path() {
        assert!(startup_root_from_key_path("HKEY_CURRENT_USER\\Software\\Test").is_ok());
    }

    #[test]
    fn valid_hklm_key_path() {
        assert!(startup_root_from_key_path("HKEY_LOCAL_MACHINE\\Software\\Test").is_ok());
    }

    #[test]
    fn invalid_key_path_rejected() {
        assert!(startup_root_from_key_path("HKEY_CLASSES_ROOT\\Software").is_err());
        assert!(startup_root_from_key_path("random_string").is_err());
        assert!(startup_root_from_key_path("").is_err());
    }
}
