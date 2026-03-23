use crate::errors::AppError;
use crate::models::repair::RepairResult;
use crate::services::process_runner::ProcessRunner;
use std::time::Duration;
use tokio::time::timeout;

const SFC_TIMEOUT: Duration = Duration::from_secs(600); // 10 min
const DISM_TIMEOUT: Duration = Duration::from_secs(900); // 15 min
const RESTORE_RUNNER: ProcessRunner = ProcessRunner::new("restore-point", Duration::from_secs(60));

/// Decode process output as UTF-8 first, falling back to the Windows OEM
/// codepage (cp850) which `cmd.exe` uses on most non-English locales.
/// This prevents the `�` mojibake seen with accented characters in
/// Portuguese, Spanish, French, German, etc.
fn decode_cmd_output(bytes: &[u8]) -> String {
    String::from_utf8(bytes.to_vec()).unwrap_or_else(|_| {
        // Fallback: decode as cp850 (Western European OEM codepage).
        bytes
            .iter()
            .map(|&b| cp850_to_char(b))
            .collect()
    })
}

/// Map a single cp850 byte to its Unicode character. ASCII range (0–127)
/// maps 1:1; the upper half (128–255) covers the accented latin characters
/// that cmd.exe outputs on Western European Windows installations.
fn cp850_to_char(b: u8) -> char {
    if b < 128 {
        return b as char;
    }
    const CP850_HIGH: [char; 128] = [
        'Ç','ü','é','â','ä','à','å','ç', 'ê','ë','è','ï','î','ì','Ä','Å', // 80-8F
        'É','æ','Æ','ô','ö','ò','û','ù', 'ÿ','Ö','Ü','ø','£','Ø','×','ƒ', // 90-9F
        'á','í','ó','ú','ñ','Ñ','ª','º', '¿','®','¬','½','¼','¡','«','»', // A0-AF
        '░','▒','▓','│','┤','Á','Â','À', 'Ã','╣','║','╗','╝','¢','¥','┐', // B0-BF (Note: B8 = © on some variants, using Ã here for cp850)
        '└','┴','┬','├','─','┼','ã','Ã', '╚','╔','╩','╦','╠','═','╬','¤', // C0-CF
        'ð','Ð','Ê','Ë','È','ı','Í','Î', 'Ï','┘','┌','█','▄','¦','Ì','▀', // D0-DF
        'Ó','ß','Ô','Ò','õ','Õ','µ','þ', 'Þ','Ú','Û','Ù','ý','Ý','¯','´', // E0-EF
        '\u{00AD}','±','‗','¾','¶','§','÷','¸', '°','¨','·','¹','³','²','■',' ', // F0-FF
    ];
    CP850_HIGH[(b - 128) as usize]
}

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
        tokio::process::Command::new("cmd")
            .args(["/C", command])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom(format!("{} timed out", tool_name)))?
    .map_err(AppError::Io)?;

    let stdout = decode_cmd_output(&output.stdout);
    let stderr = decode_cmd_output(&output.stderr);
    let combined = format!("{}\n{}", stdout, stderr).trim().to_string();

    let lower = combined.to_lowercase();
    let needs_admin =
        lower.contains("must be an administrator") || lower.contains("precisa ser administrador");

    if !output.status.success() && needs_admin {
        return Ok(RepairResult {
            success: false,
            output: format!(
                "{} requires administrator privileges. Please run FialhoClean as administrator.",
                tool_name
            ),
        });
    }

    Ok(RepairResult {
        success: output.status.success() && !needs_admin,
        output: if combined.is_empty() {
            format!("{} completed.", tool_name)
        } else {
            combined
        },
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decode_ascii_unchanged() {
        let input = b"Hello World";
        assert_eq!(decode_cmd_output(input), "Hello World");
    }

    #[test]
    fn decode_utf8_passthrough() {
        let input = "Verificação concluída".as_bytes();
        assert_eq!(decode_cmd_output(input), "Verificação concluída");
    }

    #[test]
    fn decode_cp850_accented_portuguese() {
        // cp850 bytes for "Verificação" — ç=0x87, ã=0xC6 in cp850
        let input: &[u8] = &[
            b'V', b'e', b'r', b'i', b'f', b'i', b'c', b'a',
            0x87, // ç
            0xC6, // ã (cp850 C6 = ã)
            b'o',
        ];
        let decoded = decode_cmd_output(input);
        assert_eq!(decoded, "Verificação");
    }

    #[test]
    fn decode_cp850_common_chars() {
        assert_eq!(cp850_to_char(0x82), 'é');
        assert_eq!(cp850_to_char(0x87), 'ç');
        assert_eq!(cp850_to_char(0xA0), 'á');
        assert_eq!(cp850_to_char(0xA1), 'í');
        assert_eq!(cp850_to_char(0xA2), 'ó');
        assert_eq!(cp850_to_char(0xA3), 'ú');
    }

    #[test]
    fn decode_empty_input() {
        assert_eq!(decode_cmd_output(b""), "");
    }
}
