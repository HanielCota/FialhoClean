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
