use crate::errors::AppError;
use crate::models::repair::RepairResult;
use crate::services::process_runner::{decode_output, ProcessRunner};
use std::time::Duration;
use tokio::time::timeout;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const SFC_TIMEOUT: Duration = Duration::from_secs(600); // 10 min
const DISM_TIMEOUT: Duration = Duration::from_secs(900); // 15 min
const RESTORE_RUNNER: ProcessRunner = ProcessRunner::new("restore-point", Duration::from_secs(60));

/// Run a cmd.exe system tool, returning a RepairResult with properly
/// decoded output regardless of the Windows locale/codepage.
async fn run_system_tool(
    command: &str,
    timeout_duration: Duration,
    tool_name: &str,
) -> Result<RepairResult, AppError> {
    tracing::info!("starting {} scan", tool_name);

    let output = timeout(
        timeout_duration,
        {
            let mut cmd = tokio::process::Command::new("cmd");
            cmd.args(["/C", command]);
            #[cfg(windows)]
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.output()
        },
    )
    .await
    .map_err(|_| AppError::Custom(format!("{} timed out", tool_name)))?
    .map_err(AppError::Io)?;

    let stdout = decode_output(&output.stdout);
    let stderr = decode_output(&output.stderr);
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    let lower = combined.to_lowercase();
    let needs_admin =
        lower.contains("must be an administrator") || lower.contains("precisa ser administrador");

    if !output.status.success() && needs_admin {
        return Ok(RepairResult {
            success: false,
            output: format!(
                "{} requires administrator privileges. Please run Fialho Optimizer as administrator.",
                tool_name
            ),
        });
    }

    let output_text = if combined.is_empty() {
        format!("{} completed.", tool_name)
    } else {
        combined
    };

    Ok(RepairResult {
        success: output.status.success() && !needs_admin,
        output: output_text,
    })
}

pub async fn run_sfc() -> Result<RepairResult, AppError> {
    run_system_tool("sfc /scannow", SFC_TIMEOUT, "SFC").await
}

pub async fn run_dism() -> Result<RepairResult, AppError> {
    run_system_tool(
        "DISM /Online /Cleanup-Image /RestoreHealth",
        DISM_TIMEOUT,
        "DISM",
    )
    .await
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
