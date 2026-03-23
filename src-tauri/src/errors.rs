use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Permission denied: {context}")]
    PermissionDenied { context: String },

    #[error("Registry error: {0}")]
    Registry(String),

    #[error("PowerShell error: {0}")]
    PowerShell(String),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("{0}")]
    Custom(String),
}

/// Strip absolute Windows paths and UNC paths from error messages before
/// they reach the frontend, mirroring the sanitisation already done on the
/// TypeScript side (`src/lib/errors.ts`).
fn sanitize_for_frontend(msg: &str) -> String {
    // Replace drive-letter paths  (C:\Users\...) and UNC paths (\\server\...)
    let mut out = String::with_capacity(msg.len());
    let mut chars = msg.chars().peekable();

    while let Some(ch) = chars.next() {
        // Detect drive-letter path: X:\ where X is ascii alpha
        if ch.is_ascii_alphabetic() {
            if let Some(&':') = chars.peek() {
                // Peek two ahead for backslash
                let mut tmp = chars.clone();
                tmp.next(); // consume ':'
                if let Some(&'\\') = tmp.peek() {
                    // Skip until whitespace, comma, semicolon, quote, or end
                    chars.next(); // consume ':'
                    for c in chars.by_ref() {
                        if c.is_whitespace() || matches!(c, ',' | ';' | '"' | '\'' | ')' | ']') {
                            out.push(c);
                            break;
                        }
                    }
                    continue;
                }
            }
        }

        // Detect UNC path: \\
        if ch == '\\' {
            if let Some(&'\\') = chars.peek() {
                chars.next(); // consume second '\'
                for c in chars.by_ref() {
                    if c.is_whitespace() || matches!(c, ',' | ';' | '"' | '\'' | ')' | ']') {
                        out.push(c);
                        break;
                    }
                }
                continue;
            }
        }

        out.push(ch);
    }

    out
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(&sanitize_for_frontend(&self.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_windows_paths() {
        let input = "failed at C:\\Users\\Admin\\file.txt with error";
        let out = sanitize_for_frontend(input);
        assert!(!out.contains("C:\\Users"));
        assert!(out.contains("with error"));
    }

    #[test]
    fn strips_unc_paths() {
        let input = "access denied: \\\\server\\share\\dir";
        let out = sanitize_for_frontend(input);
        assert!(!out.contains("\\\\server"));
    }

    #[test]
    fn preserves_normal_text() {
        let input = "service 'WSearch' not found";
        assert_eq!(sanitize_for_frontend(input), input);
    }
}
