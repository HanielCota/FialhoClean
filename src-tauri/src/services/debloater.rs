use crate::errors::AppError;
use crate::models::debloater::{AppInfo, BloatwareEntry, RemoveResult, SafetyLevel};
use std::time::Duration;
use tokio::time::timeout;

/// Maximum time to wait for Get-AppxPackage (can be slow on first call).
const QUERY_TIMEOUT: Duration = Duration::from_secs(60);
/// Maximum time to wait for Remove-AppxPackage per package.
const REMOVAL_TIMEOUT: Duration = Duration::from_secs(60);

pub fn get_bloatware_database() -> Vec<BloatwareEntry> {
    vec![
        BloatwareEntry {
            family_name_prefix: "Microsoft.3DBuilder".into(),
            friendly_name: "3D Builder".into(),
            safety_level: SafetyLevel::Safe,
            description: "3D printing app, rarely used".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingWeather".into(),
            friendly_name: "Weather (Bing)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Weather app with ads".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.BingNews".into(),
            friendly_name: "News (Bing)".into(),
            safety_level: SafetyLevel::Safe,
            description: "News app with ads".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.GetHelp".into(),
            friendly_name: "Get Help".into(),
            safety_level: SafetyLevel::Caution,
            description: "Windows support app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Getstarted".into(),
            friendly_name: "Tips / Get Started".into(),
            safety_level: SafetyLevel::Safe,
            description: "Windows onboarding app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MicrosoftOfficeHub".into(),
            friendly_name: "Office Hub".into(),
            safety_level: SafetyLevel::Safe,
            description: "Office advertisement app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MicrosoftSolitaireCollection".into(),
            friendly_name: "Solitaire Collection".into(),
            safety_level: SafetyLevel::Safe,
            description: "Card games bundle with ads".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.MixedReality.Portal".into(),
            friendly_name: "Mixed Reality Portal".into(),
            safety_level: SafetyLevel::Safe,
            description: "VR/AR app, requires hardware".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.People".into(),
            friendly_name: "People".into(),
            safety_level: SafetyLevel::Safe,
            description: "Contacts app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.SkypeApp".into(),
            friendly_name: "Skype".into(),
            safety_level: SafetyLevel::Safe,
            description: "Skype messaging app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Wallet".into(),
            friendly_name: "Pay / Wallet".into(),
            safety_level: SafetyLevel::Safe,
            description: "Microsoft Pay app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Xbox".into(),
            friendly_name: "Xbox Apps".into(),
            safety_level: SafetyLevel::Caution,
            description: "Xbox Game Bar and services".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.XboxApp".into(),
            friendly_name: "Xbox Console Companion".into(),
            safety_level: SafetyLevel::Safe,
            description: "Old Xbox app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.YourPhone".into(),
            friendly_name: "Your Phone / Phone Link".into(),
            safety_level: SafetyLevel::Safe,
            description: "Phone companion app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.ZuneMusic".into(),
            friendly_name: "Groove Music".into(),
            safety_level: SafetyLevel::Safe,
            description: "Music player app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.ZuneVideo".into(),
            friendly_name: "Movies & TV".into(),
            safety_level: SafetyLevel::Safe,
            description: "Video player with store".into(),
        },
        BloatwareEntry {
            family_name_prefix: "king.com".into(),
            friendly_name: "King Games (Candy Crush etc)".into(),
            safety_level: SafetyLevel::Safe,
            description: "Pre-installed mobile games".into(),
        },
        BloatwareEntry {
            family_name_prefix: "SpotifyAB.SpotifyMusic".into(),
            friendly_name: "Spotify".into(),
            safety_level: SafetyLevel::Safe,
            description: "Music streaming app".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.Advertising".into(),
            friendly_name: "Microsoft Advertising SDK".into(),
            safety_level: SafetyLevel::Safe,
            description: "Ad framework for UWP apps".into(),
        },
        BloatwareEntry {
            family_name_prefix: "Microsoft.549981C3F5F10".into(),
            friendly_name: "Cortana".into(),
            safety_level: SafetyLevel::Caution,
            description: "Microsoft assistant — may affect search integration".into(),
        },
    ]
}

const SYSTEM_CRITICAL_PREFIXES: &[&str] = &[
    "Microsoft.Windows.StartMenuExperienceHost",
    "Microsoft.Windows.ShellExperienceHost",
    "Microsoft.Windows.Search",
    "Microsoft.AAD",
    "Microsoft.AccountsControl",
    "Microsoft.BioEnrollment",
    "Microsoft.CredDialogHost",
    "Microsoft.ECApp",
    "Microsoft.LockApp",
    "Microsoft.MicrosoftEdgeDevToolsClient",
    "Microsoft.Win32WebViewHost",
    "Microsoft.Windows.Apprep",
    "Microsoft.Windows.AssignedAccessLockApp",
    "Microsoft.Windows.CloudExperienceHost",
    "Microsoft.Windows.ContentDeliveryManager",
    "Microsoft.Windows.OOBENetworkCaptivePortal",
    "Microsoft.Windows.PeopleExperienceHost",
    "Microsoft.Windows.PinningConfirmationDialog",
    "Microsoft.XboxGameCallableUI",
];

pub async fn get_installed_apps() -> Result<Vec<AppInfo>, AppError> {
    let output = timeout(
        QUERY_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
                 $OutputEncoding = [System.Text.Encoding]::UTF8; \
                 Get-AppxPackage -AllUsers \
                 | Select-Object Name, PackageFullName, PackageFamilyName, Publisher, Version \
                 | ConvertTo-Json -Compress",
            ])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("get_installed_apps timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        return Err(AppError::PowerShell(
            String::from_utf8_lossy(&output.stderr).to_string(),
        ));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);

    let raw: Vec<serde_json::Value> =
        serde_json::from_str(&json_str).map_err(|e| AppError::Parse(e.to_string()))?;

    let db = get_bloatware_database();

    let apps: Vec<AppInfo> = raw
        .into_iter()
        .filter_map(|v| parse_app_entry(v, &db))
        .collect();

    Ok(apps)
}

fn parse_app_entry(v: serde_json::Value, db: &[BloatwareEntry]) -> Option<AppInfo> {
    let name = v["Name"].as_str()?.to_string();
    let package_full_name = v["PackageFullName"].as_str()?.to_string();
    let package_family_name = v["PackageFamilyName"].as_str().unwrap_or("").to_string();
    let publisher = v["Publisher"].as_str().unwrap_or("").to_string();
    let version = v["Version"].as_str().unwrap_or("").to_string();

    // Skip system-critical apps
    let is_critical = SYSTEM_CRITICAL_PREFIXES
        .iter()
        .any(|p| name.starts_with(p) || package_family_name.starts_with(p));

    if is_critical {
        return None;
    }

    // Match against bloatware database
    let db_entry = db.iter().find(|e| {
        name.starts_with(&e.family_name_prefix)
            || package_family_name.starts_with(&e.family_name_prefix)
    })?;

    Some(AppInfo {
        name: db_entry.friendly_name.clone(),
        package_full_name,
        package_family_name,
        publisher,
        version,
        safety_level: db_entry.safety_level.clone(),
        description: db_entry.description.clone(),
    })
}

pub async fn remove_apps(package_full_names: Vec<String>) -> Result<Vec<RemoveResult>, AppError> {
    let mut results = Vec::new();

    for pkg in package_full_names {
        let result = remove_single_app(&pkg).await;
        results.push(result);
    }

    Ok(results)
}

/// Removes a single AppX package.
///
/// The package name is passed via an environment variable (`FIALHO_PKG_NAME`)
/// rather than being interpolated into the PowerShell command string. This
/// eliminates PowerShell command-injection risk regardless of the package name's
/// content (quotes, dollar signs, newlines, etc.).
async fn remove_single_app(package_full_name: &str) -> RemoveResult {
    let result = timeout(
        REMOVAL_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Remove-AppxPackage -Package $env:FIALHO_PKG_NAME -AllUsers -ErrorAction Stop",
            ])
            .env("FIALHO_PKG_NAME", package_full_name)
            .output(),
    )
    .await;

    match result {
        Err(_) => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: false,
            error: Some("operation timed out".to_string()),
        },
        Ok(Err(e)) => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: false,
            error: Some(e.to_string()),
        },
        Ok(Ok(o)) if o.status.success() => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: true,
            error: None,
        },
        Ok(Ok(o)) => RemoveResult {
            package_full_name: package_full_name.to_string(),
            success: false,
            error: Some(String::from_utf8_lossy(&o.stderr).trim().to_string()),
        },
    }
}
