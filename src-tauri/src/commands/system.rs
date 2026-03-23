use crate::errors::AppError;
use crate::models::system::{DiskUsage, SystemInfo};

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, AppError> {
    crate::services::system_info::get_system_info().await
}

#[tauri::command]
pub async fn get_disk_usage() -> Result<Vec<DiskUsage>, AppError> {
    crate::services::system_info::get_disk_usage().await
}

/// Opens a URL in the user's default browser. Only allows https:// URLs
/// to prevent opening arbitrary protocols or local files.
#[tauri::command]
pub async fn open_url(url: String) -> Result<(), AppError> {
    if !url.starts_with("https://") {
        return Err(AppError::Custom("only https URLs are allowed".into()));
    }
    tokio::process::Command::new("cmd")
        .args(["/C", "start", &url])
        .output()
        .await
        .map_err(AppError::Io)?;
    Ok(())
}
