use crate::errors::AppError;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

/// Abstracts the repeated pattern of spawning a process with a timeout,
/// checking its exit status, and returning stdout/stderr as strings.
pub struct ProcessRunner {
    timeout: Duration,
    label: &'static str,
}

/// Output from a successful process execution.
pub struct ProcessOutput {
    pub stdout: String,
    pub stderr: String,
}

impl ProcessRunner {
    pub const fn new(label: &'static str, timeout: Duration) -> Self {
        Self { timeout, label }
    }

    /// Run a pre-built `Command`, enforcing the timeout.
    /// Returns `Ok(ProcessOutput)` only if the process exits with status 0.
    pub async fn run(&self, mut cmd: Command) -> Result<ProcessOutput, AppError> {
        let output = timeout(self.timeout, cmd.output())
            .await
            .map_err(|_| AppError::Custom(format!("{} timed out", self.label)))?
            .map_err(AppError::Io)?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if !output.status.success() {
            let msg = if stderr.trim().is_empty() {
                stdout
            } else {
                stderr
            };
            return Err(AppError::PowerShell(msg.trim().to_string()));
        }

        Ok(ProcessOutput { stdout, stderr })
    }

    /// Convenience: run PowerShell with standard flags.
    pub async fn powershell(&self, ps_command: &str) -> Result<ProcessOutput, AppError> {
        let mut cmd = Command::new("powershell");
        cmd.args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            ps_command,
        ]);
        self.run(cmd).await
    }

    /// Convenience: run PowerShell with UTF-8 output encoding prefix.
    pub async fn powershell_utf8(&self, ps_command: &str) -> Result<ProcessOutput, AppError> {
        let full = format!(
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
             $OutputEncoding = [System.Text.Encoding]::UTF8; {}",
            ps_command
        );
        self.powershell(&full).await
    }

    /// Run a process and return stdout, ignoring failure (best-effort).
    pub async fn run_best_effort(&self, mut cmd: Command) -> Option<String> {
        let output = timeout(self.timeout, cmd.output()).await.ok()?.ok()?;
        if output.status.success() {
            Some(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            None
        }
    }
}
