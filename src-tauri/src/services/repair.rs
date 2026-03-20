use crate::errors::AppError;
use crate::models::repair::RepairResult;
use std::time::Duration;
use tokio::time::timeout;

const SFC_TIMEOUT: Duration = Duration::from_secs(600);   // 10 min
const DISM_TIMEOUT: Duration = Duration::from_secs(900);  // 15 min
const RESTORE_TIMEOUT: Duration = Duration::from_secs(60);

#[allow(dead_code)]
async fn run_powershell(args: &[&str], op_timeout: Duration) -> Result<RepairResult, AppError> {
    let output = timeout(
        op_timeout,
        tokio::process::Command::new("powershell")
            .args(&["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass"])
            .args(args)
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("Operation timed out".to_string()))?
    .map_err(AppError::Io)?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = if stderr.is_empty() {
        stdout.clone()
    } else {
        format!("{}\n{}", stdout, stderr)
    };

    Ok(RepairResult {
        success: output.status.success(),
        output: combined.trim().to_string(),
    })
}

pub async fn run_sfc() -> Result<RepairResult, AppError> {
    // sfc /scannow requires elevation; try directly and surface the error clearly
    let output = timeout(
        SFC_TIMEOUT,
        tokio::process::Command::new("cmd")
            .args(&["/C", "sfc /scannow"])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("SFC timed out (>10 min)".to_string()))?
    .map_err(AppError::Io)?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    let success = output.status.success()
        && !combined.to_lowercase().contains("must be an administrator");

    if !success && combined.to_lowercase().contains("must be an administrator") {
        return Ok(RepairResult {
            success: false,
            output: "SFC requires administrator privileges. Please run FialhoClean as administrator.".to_string(),
        });
    }

    Ok(RepairResult {
        success,
        output: if combined.is_empty() {
            "SFC completed.".to_string()
        } else {
            combined
        },
    })
}

pub async fn run_dism() -> Result<RepairResult, AppError> {
    let output = timeout(
        DISM_TIMEOUT,
        tokio::process::Command::new("cmd")
            .args(&["/C", "DISM /Online /Cleanup-Image /RestoreHealth"])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("DISM timed out (>15 min)".to_string()))?
    .map_err(AppError::Io)?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    let success = output.status.success()
        && !combined.to_lowercase().contains("must be an administrator");

    if !success && combined.to_lowercase().contains("must be an administrator") {
        return Ok(RepairResult {
            success: false,
            output: "DISM requires administrator privileges. Please run FialhoClean as administrator.".to_string(),
        });
    }

    Ok(RepairResult {
        success,
        output: if combined.is_empty() {
            "DISM completed.".to_string()
        } else {
            combined
        },
    })
}

pub async fn create_restore_point(description: String) -> Result<(), AppError> {
    let script = format!(
        r#"
        try {{
            Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue
            Checkpoint-Computer -Description "{}" -RestorePointType MODIFY_SETTINGS -ErrorAction Stop
        }} catch {{
            throw $_.Exception.Message
        }}
        "#,
        description.replace('"', "'")
    );

    let output = timeout(
        RESTORE_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args(&[
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                &script,
            ])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("Restore point creation timed out".to_string()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        let out = String::from_utf8_lossy(&output.stdout).to_string();
        let msg = if !err.is_empty() { err } else { out };
        return Err(AppError::PowerShell(msg.trim().to_string()));
    }

    Ok(())
}
