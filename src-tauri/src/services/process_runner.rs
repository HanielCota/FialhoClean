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

/// Decode process output bytes to a UTF-8 String.
///
/// Tries UTF-8 first (covers PowerShell with `[Console]::OutputEncoding = UTF8`
/// and any modern tool). Falls back to cp850 decoding for cmd.exe on
/// non-English Windows locales (Portuguese, Spanish, French, German, etc.)
/// which use the OEM codepage for console output.
pub fn decode_output(bytes: &[u8]) -> String {
    String::from_utf8(bytes.to_vec()).unwrap_or_else(|_| {
        bytes.iter().map(|&b| cp850_to_char(b)).collect()
    })
}

/// Map a single cp850 byte to its Unicode character.
fn cp850_to_char(b: u8) -> char {
    if b < 128 {
        return b as char;
    }
    #[rustfmt::skip]
    const CP850_HIGH: [char; 128] = [
        'Ç','ü','é','â','ä','à','å','ç', 'ê','ë','è','ï','î','ì','Ä','Å',
        'É','æ','Æ','ô','ö','ò','û','ù', 'ÿ','Ö','Ü','ø','£','Ø','×','ƒ',
        'á','í','ó','ú','ñ','Ñ','ª','º', '¿','®','¬','½','¼','¡','«','»',
        '░','▒','▓','│','┤','Á','Â','À', 'Ã','╣','║','╗','╝','¢','¥','┐',
        '└','┴','┬','├','─','┼','ã','Ã', '╚','╔','╩','╦','╠','═','╬','¤',
        'ð','Ð','Ê','Ë','È','ı','Í','Î', 'Ï','┘','┌','█','▄','¦','Ì','▀',
        'Ó','ß','Ô','Ò','õ','Õ','µ','þ', 'Þ','Ú','Û','Ù','ý','Ý','¯','´',
        '\u{00AD}','±','‗','¾','¶','§','÷','¸', '°','¨','·','¹','³','²','■',' ',
    ];
    CP850_HIGH[(b - 128) as usize]
}

impl ProcessRunner {
    pub const fn new(label: &'static str, timeout: Duration) -> Self {
        Self { timeout, label }
    }

    /// Run a pre-built `Command`, enforcing the timeout.
    /// Returns `Ok(ProcessOutput)` only if the process exits with status 0.
    /// Output is decoded as UTF-8 with cp850 fallback.
    pub async fn run(&self, mut cmd: Command) -> Result<ProcessOutput, AppError> {
        let output = timeout(self.timeout, cmd.output())
            .await
            .map_err(|_| AppError::Custom(format!("{} timed out", self.label)))?
            .map_err(AppError::Io)?;

        let stdout = decode_output(&output.stdout);
        let stderr = decode_output(&output.stderr);

        if !output.status.success() {
            let msg = match stderr.trim().is_empty() {
                true => stdout,
                false => stderr,
            };
            return Err(AppError::PowerShell(msg.trim().to_string()));
        }

        Ok(ProcessOutput { stdout, stderr })
    }

    /// Run PowerShell with standard flags and UTF-8 output encoding.
    /// All PowerShell invocations force `[Console]::OutputEncoding = UTF8`
    /// to ensure consistent output regardless of system locale.
    pub async fn powershell(&self, ps_command: &str) -> Result<ProcessOutput, AppError> {
        let full = format!(
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
             $OutputEncoding = [System.Text.Encoding]::UTF8; {}",
            ps_command
        );
        let mut cmd = Command::new("powershell");
        cmd.args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            &full,
        ]);
        self.run(cmd).await
    }

    /// Run a process and return stdout, ignoring failure (best-effort).
    /// Output is decoded as UTF-8 with cp850 fallback.
    pub async fn run_best_effort(&self, mut cmd: Command) -> Option<String> {
        let output = timeout(self.timeout, cmd.output()).await.ok()?.ok()?;
        if !output.status.success() {
            return None;
        }
        Some(decode_output(&output.stdout))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decode_ascii_unchanged() {
        assert_eq!(decode_output(b"Hello World"), "Hello World");
    }

    #[test]
    fn decode_utf8_passthrough() {
        let input = "Verificação concluída".as_bytes();
        assert_eq!(decode_output(input), "Verificação concluída");
    }

    #[test]
    fn decode_cp850_portuguese() {
        // "Verificação" in cp850: ç=0x87, ã=0xC6
        let input: &[u8] = &[
            b'V', b'e', b'r', b'i', b'f', b'i', b'c', b'a', 0x87, 0xC6, b'o',
        ];
        assert_eq!(decode_output(input), "Verificação");
    }

    #[test]
    fn decode_cp850_common_accented_chars() {
        assert_eq!(cp850_to_char(0x82), 'é');
        assert_eq!(cp850_to_char(0x87), 'ç');
        assert_eq!(cp850_to_char(0xA0), 'á');
        assert_eq!(cp850_to_char(0xA1), 'í');
        assert_eq!(cp850_to_char(0xA2), 'ó');
        assert_eq!(cp850_to_char(0xA3), 'ú');
    }

    #[test]
    fn decode_empty_input() {
        assert_eq!(decode_output(b""), "");
    }
}
