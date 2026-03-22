use crate::errors::AppError;
use crate::models::repair::RepairResult;
use crate::services::process_runner::ProcessRunner;
use std::time::Duration;
use tokio::time::timeout;

const SFC_TIMEOUT: Duration = Duration::from_secs(600); // 10 min
const DISM_TIMEOUT: Duration = Duration::from_secs(900); // 15 min
const RESTORE_RUNNER: ProcessRunner = ProcessRunner::new("restore-point", Duration::from_secs(60));

pub async fn run_sfc() -> Result<RepairResult, AppError> {
    tracing::info!("starting SFC scan");
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

    let success =
        output.status.success() && !combined.to_lowercase().contains("must be an administrator");

    if !success && combined.to_lowercase().contains("must be an administrator") {
        return Ok(RepairResult {
            success: false,
            output:
                "SFC requires administrator privileges. Please run FialhoClean as administrator."
                    .to_string(),
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
    tracing::info!("starting DISM repair");
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

    let success =
        output.status.success() && !combined.to_lowercase().contains("must be an administrator");

    if !success && combined.to_lowercase().contains("must be an administrator") {
        return Ok(RepairResult {
            success: false,
            output:
                "DISM requires administrator privileges. Please run FialhoClean as administrator."
                    .to_string(),
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
    tracing::info!(desc = %description, "creating system restore point");

    // Pass description via environment variable to prevent PowerShell injection.
    let script = r#"
        try {
            Enable-ComputerRestore -Drive "C:\" -ErrorAction SilentlyContinue
            Checkpoint-Computer -Description $env:FIALHO_RP_DESC -RestorePointType MODIFY_SETTINGS -ErrorAction Stop
        } catch {
            throw $_.Exception.Message
        }
        "#;

    let mut cmd = tokio::process::Command::new("powershell");
    cmd.args([
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
    ])
    .env("FIALHO_RP_DESC", &description);

    RESTORE_RUNNER.run(cmd).await?;
    Ok(())
}
