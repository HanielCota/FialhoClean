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

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

