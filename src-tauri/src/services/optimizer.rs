use crate::errors::AppError;
use crate::models::optimizer::{
    PowerPlan, ServiceAction, ServiceInfo, ServiceSafety, ServiceStatus, StartType, StartupItem,
    StartupSource,
};
use std::time::Duration;
use tokio::time::timeout;
use winreg::enums::*;
use winreg::RegKey;

const REG_RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";
const REG_STARTUP_APPROVED_KEY: &str =
    r"Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run";
const REG_VISUAL_EFFECTS_KEY: &str =
    r"Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects";
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
];

const CAUTION_SERVICES: &[&str] = &[
    "Spooler",  // Print Spooler
    "BITS",     // Background Intelligent Transfer
    "wuauserv", // Windows Update
    "ndu",      // Network Data Usage
];

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
                bytes: value_bytes,
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

    Some(ServiceInfo {
        name,
        display_name,
        status,
        start_type,
        safety_level,
        description: String::new(),
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
