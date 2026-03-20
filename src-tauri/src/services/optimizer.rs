use crate::errors::AppError;
use crate::models::optimizer::{
    HibernateSettings, NetworkSettings, PowerPlan, ScheduledTask, ServiceAction, ServiceInfo,
    ServiceSafety, ServiceStatus, StartType, StartupItem, StartupSource,
};
use std::time::Duration;
use tokio::time::timeout;
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
const REG_SESSION_POWER_KEY: &str =
    r"SYSTEM\CurrentControlSet\Control\Session Manager\Power";
const REG_MULTIMEDIA_PROFILE_KEY: &str =
    r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile";
const REG_GAME_BAR_KEY: &str = r"Software\Microsoft\GameBar";
const POWER_SCHEME_GUID_PREFIX: &str = "Power Scheme GUID:";

/// Maximum time to wait for any external process.
const PROCESS_TIMEOUT: Duration = Duration::from_secs(30);

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

pub async fn get_startup_items() -> Result<Vec<StartupItem>, AppError> {
    let mut items = Vec::new();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key_path_hkcu = format!("HKEY_CURRENT_USER\\{}", REG_RUN_KEY);

    if let Ok(run_key) = hkcu.open_subkey(REG_RUN_KEY) {
        let names: Vec<String> = run_key
            .enum_values()
            .flatten()
            .map(|(name, _)| name)
            .collect();
        for name in names {
            let command: String = run_key.get_value(&name).unwrap_or_default();
            items.push(StartupItem {
                name: name.clone(),
                command,
                key_path: key_path_hkcu.clone(),
                enabled: true,
                source: StartupSource::HkeyCurrentUser,
            });
        }
    }

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key_path_hklm = format!("HKEY_LOCAL_MACHINE\\{}", REG_RUN_KEY);

    if let Ok(run_key) = hklm.open_subkey(REG_RUN_KEY) {
        let names: Vec<String> = run_key
            .enum_values()
            .flatten()
            .map(|(name, _)| name)
            .collect();
        for name in names {
            let command: String = run_key.get_value(&name).unwrap_or_default();
            items.push(StartupItem {
                name: name.clone(),
                command,
                key_path: key_path_hklm.clone(),
                enabled: true,
                source: StartupSource::HkeyLocalMachine,
            });
        }
    }

    // Check disabled items in HKCU\...\StartupApproved\Run
    if let Ok(approved_key) = hkcu.open_subkey(REG_STARTUP_APPROVED_KEY) {
        for item in &mut items {
            if let Ok(value) = approved_key.get_raw_value(&item.name) {
                // First byte: 02 = enabled, 03 = disabled
                item.enabled = value.bytes.first().map(|&b| b == 2).unwrap_or(true);
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
    // Verify the startup item actually exists in a known Run registry location
    // before writing to StartupApproved. This prevents a manipulated frontend
    // from creating arbitrary entries in the approved key.
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    let in_hkcu = hkcu
        .open_subkey(REG_RUN_KEY)
        .map(|k| k.get_value::<String, _>(&name).is_ok())
        .unwrap_or(false);
    let in_hklm = hklm
        .open_subkey(REG_RUN_KEY)
        .map(|k| k.get_value::<String, _>(&name).is_ok())
        .unwrap_or(false);

    if !in_hkcu && !in_hklm {
        return Err(AppError::Custom(format!(
            "startup item not found in registry: {}",
            name
        )));
    }

    let (approved_key, _) = hkcu
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
    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
                 $OutputEncoding = [System.Text.Encoding]::UTF8; \
                 Get-Service | Select-Object Name, DisplayName, Status, StartType | ConvertTo-Json",
            ])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("get_services timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let raw: Vec<serde_json::Value> =
        serde_json::from_str(&json_str).map_err(|e| AppError::Parse(e.to_string()))?;

    let services = raw
        .into_iter()
        .filter_map(parse_service_entry)
        .collect();

    Ok(services)
}

fn parse_service_entry(v: serde_json::Value) -> Option<ServiceInfo> {
    let name = v["Name"].as_str()?.to_string();
    let display_name = v["DisplayName"].as_str().unwrap_or(&name).to_string();

    let status = match v["Status"].as_u64().unwrap_or(0) {
        4 => ServiceStatus::Running,
        1 => ServiceStatus::Stopped,
        7 => ServiceStatus::Paused,
        _ => ServiceStatus::Unknown,
    };

    let start_type = match v["StartType"].as_u64().unwrap_or(99) {
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

    let output = timeout(PROCESS_TIMEOUT, cmd.output())
        .await
        .map_err(|_| AppError::Custom("set_service_status timed out".into()))?
        .map_err(AppError::Io)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::PowerShell(stderr.to_string()));
    }

    Ok(())
}

pub async fn get_power_plans() -> Result<Vec<PowerPlan>, AppError> {
    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["/list"])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("get_power_plans timed out".into()))?
    .map_err(AppError::Io)?;

    let text = String::from_utf8_lossy(&output.stdout);
    let mut plans = Vec::new();

    for line in text.lines() {
        let line = line.trim();
        if !line.starts_with(POWER_SCHEME_GUID_PREFIX) {
            continue;
        }

        // Format: "Power Scheme GUID: <guid>  (<name>) *"
        let is_active = line.ends_with('*');
        let after_colon = line.trim_start_matches(POWER_SCHEME_GUID_PREFIX).trim();
        let guid_end = after_colon.find(' ').unwrap_or(after_colon.len());
        let guid = after_colon[..guid_end].to_string();

        let name = after_colon
            .find('(')
            .and_then(|start| after_colon.find(')').map(|end| &after_colon[start + 1..end]))
            .unwrap_or("Unknown")
            .to_string();

        plans.push(PowerPlan {
            guid,
            name,
            is_active,
        });
    }

    Ok(plans)
}

pub async fn set_power_plan(plan_guid: String) -> Result<(), AppError> {
    // Validate GUID format before passing to powercfg to prevent unexpected
    // argument injection even though .args() already provides OS-level quoting.
    if !is_valid_guid(&plan_guid) {
        return Err(AppError::Custom(format!(
            "invalid power plan GUID: {}",
            plan_guid
        )));
    }

    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["/setactive", &plan_guid])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("set_power_plan timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

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
    // ── Step 1: activate if already available ────────────────────────────
    let direct = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["/setactive", ULTIMATE_PERF_GUID])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("apply_ultimate_performance timed out".into()))?
    .map_err(AppError::Io)?;

    if direct.status.success() {
        return Ok(());
    }

    // ── Step 2: unlock by duplicating the built-in scheme ────────────────
    let dup = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["-duplicatescheme", ULTIMATE_PERF_GUID])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("duplicatescheme timed out".into()))?
    .map_err(AppError::Io)?;

    if dup.status.success() {
        // Output format: "Power Scheme GUID: <guid>  (Ultimate Performance)"
        let out = String::from_utf8_lossy(&dup.stdout);
        let new_guid = out.lines().find_map(|line| {
            let line = line.trim();
            if line.starts_with(POWER_SCHEME_GUID_PREFIX) {
                let after = line.trim_start_matches(POWER_SCHEME_GUID_PREFIX).trim();
                let end = after.find(' ').unwrap_or(after.len());
                let guid = &after[..end];
                if is_valid_guid(guid) {
                    Some(guid.to_string())
                } else {
                    None
                }
            } else {
                None
            }
        });

        if let Some(guid) = new_guid {
            let _ = timeout(
                PROCESS_TIMEOUT,
                tokio::process::Command::new("powercfg")
                    .args(["/setactive", &guid])
                    .output(),
            )
            .await;
            return Ok(());
        }
    }

    // ── Step 3: edition doesn't support Ultimate — use High Performance ──
    let _ = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["/setactive", HIGH_PERF_GUID])
            .output(),
    )
    .await;

    Ok(())
}

pub async fn set_visual_effects(performance_mode: bool) -> Result<(), AppError> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let (key, _) = hkcu
        .create_subkey(REG_VISUAL_EFFECTS_KEY)
        .map_err(|e| AppError::Registry(e.to_string()))?;

    let value: u32 = if performance_mode { 2 } else { 1 };
    key.set_value("VisualFXSetting", &value)
        .map_err(|e| AppError::Registry(e.to_string()))?;

    Ok(())
}

// ─── Hibernate / Fast Startup ──────────────────────────────────────────────

pub async fn get_hibernate_settings() -> Result<HibernateSettings, AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    let hibernate_enabled = hklm
        .open_subkey(REG_POWER_KEY)
        .and_then(|k| k.get_value::<u32, _>("HibernateEnabled"))
        .unwrap_or(1)
        != 0;

    let fast_startup_enabled = hklm
        .open_subkey(REG_SESSION_POWER_KEY)
        .and_then(|k| k.get_value::<u32, _>("HiberbootEnabled"))
        .unwrap_or(0)
        != 0;

    Ok(HibernateSettings {
        hibernate_enabled,
        fast_startup_enabled,
    })
}

pub async fn set_hibernate(enabled: bool) -> Result<(), AppError> {
    let arg = if enabled { "on" } else { "off" };
    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["/hibernate", arg])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("set_hibernate timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }
    Ok(())
}

pub async fn set_fast_startup(enabled: bool) -> Result<(), AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (key, _) = hklm
        .create_subkey(REG_SESSION_POWER_KEY)
        .map_err(|e| AppError::Registry(e.to_string()))?;
    let value: u32 = if enabled { 1 } else { 0 };
    key.set_value("HiberbootEnabled", &value)
        .map_err(|e| AppError::Registry(e.to_string()))?;
    Ok(())
}

// ─── Game Mode Preset ──────────────────────────────────────────────────────

/// Applies the Game Mode preset: High Performance power plan + Windows Game Mode.
/// This is a one-shot action, not a toggle.
pub async fn apply_game_mode_preset() -> Result<(), AppError> {
    // 1. Switch to High Performance power plan
    let _ = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powercfg")
            .args(["/setactive", HIGH_PERF_GUID])
            .output(),
    )
    .await;

    // 2. Enable Windows Game Mode via registry
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok((game_bar_key, _)) = hkcu.create_subkey(REG_GAME_BAR_KEY) {
        let _ = game_bar_key.set_value("AutoGameModeEnabled", &1u32);
    }

    Ok(())
}

// ─── Network Optimizer ────────────────────────────────────────────────────

pub async fn get_network_settings() -> Result<NetworkSettings, AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);

    let network_throttling_disabled = hklm
        .open_subkey(REG_MULTIMEDIA_PROFILE_KEY)
        .and_then(|k| k.get_value::<u32, _>("NetworkThrottlingIndex"))
        .map(|v| v == 0xFFFF_FFFFu32)
        .unwrap_or(false);

    Ok(NetworkSettings {
        network_throttling_disabled,
    })
}

pub async fn set_network_optimized(enabled: bool) -> Result<(), AppError> {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (key, _) = hklm
        .create_subkey(REG_MULTIMEDIA_PROFILE_KEY)
        .map_err(|e| AppError::Registry(e.to_string()))?;

    if enabled {
        // Disable network throttling and prioritize applications
        key.set_value("NetworkThrottlingIndex", &0xFFFF_FFFFu32)
            .map_err(|e| AppError::Registry(e.to_string()))?;
        key.set_value("SystemResponsiveness", &0u32)
            .map_err(|e| AppError::Registry(e.to_string()))?;
    } else {
        // Restore Windows defaults
        key.set_value("NetworkThrottlingIndex", &10u32)
            .map_err(|e| AppError::Registry(e.to_string()))?;
        key.set_value("SystemResponsiveness", &20u32)
            .map_err(|e| AppError::Registry(e.to_string()))?;
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

    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", ps_command])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("get_scheduled_tasks timed out".into()))?
    .map_err(AppError::Io)?;

    let json_str = String::from_utf8_lossy(&output.stdout);
    let json_str = json_str.trim();

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
    for v in raw {
        let task_name = match v["TaskName"].as_str() {
            Some(n) => n.to_string(),
            None => continue,
        };
        let task_path_raw = v["TaskPath"].as_str().unwrap_or("").to_string();
        let state = v["State"].as_str().unwrap_or("Unknown").to_string();

        // Build the full path the same way we store in MANAGED_TASKS (no trailing slash on name)
        let full_path = format!(
            "{}{}",
            task_path_raw.trim_end_matches('\\'),
            task_name
        );
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

pub async fn set_scheduled_task_enabled(
    task_path: String,
    enabled: bool,
) -> Result<(), AppError> {
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
    let ps_command = format!(
        "{}-ScheduledTask -TaskPath '{}' -TaskName '{}' -ErrorAction Stop",
        action, folder, name
    );

    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps_command])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("set_scheduled_task_enabled timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    Ok(())
}

// ── GPU Hardware-Accelerated GPU Scheduling (HAGS) ──────────────────────────

pub async fn get_gpu_settings() -> Result<crate::models::optimizer::GpuSettings, AppError> {
    use winreg::enums::*;
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let result = hklm.open_subkey(r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers");
    let hags_enabled = match result {
        Ok(key) => {
            let val: u32 = key.get_value("HwSchMode").unwrap_or(1);
            val == 2
        }
        Err(_) => false,
    };
    Ok(crate::models::optimizer::GpuSettings { hags_enabled })
}

pub async fn set_gpu_hags(enabled: bool) -> Result<(), AppError> {
    use winreg::enums::*;
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let key = hklm
        .open_subkey_with_flags(
            r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers",
            KEY_SET_VALUE,
        )
        .map_err(|e| AppError::Registry(e.to_string()))?;
    let val: u32 = if enabled { 2 } else { 1 };
    key.set_value("HwSchMode", &val)
        .map_err(|e| AppError::Registry(e.to_string()))
}

// ── Privacy Settings ──────────────────────────────────────────────────────────

const REG_TELEMETRY_KEY: &str =
    r"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\DataCollection";
const REG_SEARCH_KEY: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Search";
const REG_ADVERTISING_KEY: &str =
    r"SOFTWARE\Microsoft\Windows\CurrentVersion\AdvertisingInfo";
const REG_ACTIVITY_KEY: &str = r"SOFTWARE\Policies\Microsoft\Windows\System";
const REG_LOCATION_KEY: &str =
    r"SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location";

pub async fn get_privacy_settings() -> Result<crate::models::optimizer::PrivacySettings, AppError> {
    use winreg::enums::*;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Telemetry disabled: AllowTelemetry == 0
    let telemetry_disabled = hklm
        .open_subkey(REG_TELEMETRY_KEY)
        .ok()
        .and_then(|k| k.get_value::<u32, _>("AllowTelemetry").ok())
        .map(|v| v == 0)
        .unwrap_or(false);

    // Bing search disabled: BingSearchEnabled == 0
    let bing_search_disabled = hkcu
        .open_subkey(REG_SEARCH_KEY)
        .ok()
        .and_then(|k| k.get_value::<u32, _>("BingSearchEnabled").ok())
        .map(|v| v == 0)
        .unwrap_or(false);

    // Advertising ID disabled: Enabled == 0
    let advertising_id_disabled = hkcu
        .open_subkey(REG_ADVERTISING_KEY)
        .ok()
        .and_then(|k| k.get_value::<u32, _>("Enabled").ok())
        .map(|v| v == 0)
        .unwrap_or(false);

    // Activity history disabled: EnableActivityFeed == 0
    let activity_history_disabled = hklm
        .open_subkey(REG_ACTIVITY_KEY)
        .ok()
        .and_then(|k| k.get_value::<u32, _>("EnableActivityFeed").ok())
        .map(|v| v == 0)
        .unwrap_or(false);

    // Location disabled: Value == "Deny"
    let location_disabled = hkcu
        .open_subkey(REG_LOCATION_KEY)
        .ok()
        .and_then(|k| k.get_value::<String, _>("Value").ok())
        .map(|v| v.to_lowercase() == "deny")
        .unwrap_or(false);

    Ok(crate::models::optimizer::PrivacySettings {
        telemetry_disabled,
        bing_search_disabled,
        advertising_id_disabled,
        activity_history_disabled,
        location_disabled,
    })
}

pub async fn set_privacy_setting(setting_key: String, disabled: bool) -> Result<(), AppError> {
    use winreg::enums::*;

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    match setting_key.as_str() {
        "telemetry" => {
            let (key, _) = hklm
                .create_subkey(REG_TELEMETRY_KEY)
                .map_err(|e| AppError::Registry(e.to_string()))?;
            let val: u32 = if disabled { 0 } else { 1 };
            key.set_value("AllowTelemetry", &val)
                .map_err(|e| AppError::Registry(e.to_string()))?;

            // Also set in the policies key for belt-and-suspenders
            let policies_key = r"SOFTWARE\Policies\Microsoft\Windows\DataCollection";
            if let Ok((pk, _)) = hklm.create_subkey(policies_key) {
                let _ = pk.set_value("AllowTelemetry", &val);
            }
        }
        "bing_search" => {
            let (key, _) = hkcu
                .create_subkey(REG_SEARCH_KEY)
                .map_err(|e| AppError::Registry(e.to_string()))?;
            let val: u32 = if disabled { 0 } else { 1 };
            key.set_value("BingSearchEnabled", &val)
                .map_err(|e| AppError::Registry(e.to_string()))?;
        }
        "advertising_id" => {
            let (key, _) = hkcu
                .create_subkey(REG_ADVERTISING_KEY)
                .map_err(|e| AppError::Registry(e.to_string()))?;
            let val: u32 = if disabled { 0 } else { 1 };
            key.set_value("Enabled", &val)
                .map_err(|e| AppError::Registry(e.to_string()))?;
        }
        "activity_history" => {
            let (key, _) = hklm
                .create_subkey(REG_ACTIVITY_KEY)
                .map_err(|e| AppError::Registry(e.to_string()))?;
            let val: u32 = if disabled { 0 } else { 1 };
            key.set_value("EnableActivityFeed", &val)
                .map_err(|e| AppError::Registry(e.to_string()))?;
            key.set_value("PublishUserActivities", &val)
                .map_err(|e| AppError::Registry(e.to_string()))?;
        }
        "location" => {
            let (key, _) = hkcu
                .create_subkey(REG_LOCATION_KEY)
                .map_err(|e| AppError::Registry(e.to_string()))?;
            let val = if disabled { "Deny" } else { "Allow" };
            key.set_value("Value", &val)
                .map_err(|e| AppError::Registry(e.to_string()))?;
        }
        _ => return Err(AppError::Custom(format!("Unknown privacy setting: {}", setting_key))),
    }

    Ok(())
}

// ── RAM Optimization ─────────────────────────────────────────────────────────

pub async fn optimize_ram() -> Result<crate::models::optimizer::RamOptimizationResult, AppError> {
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

    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
            ])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("RAM optimization timed out".to_string()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Ok(crate::models::optimizer::RamOptimizationResult { freed_bytes: 0 });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let freed_bytes: i64 = stdout.trim().parse().unwrap_or(0);
    Ok(crate::models::optimizer::RamOptimizationResult { freed_bytes })
}
