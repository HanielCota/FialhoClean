use crate::errors::AppError;
use crate::models::repair::RepairResult;

#[tauri::command]
pub async fn run_sfc() -> Result<RepairResult, AppError> {
    crate::services::repair::run_sfc().await
}

#[tauri::command]
pub async fn run_dism() -> Result<RepairResult, AppError> {
    crate::services::repair::run_dism().await
}

#[tauri::command]
pub async fn create_restore_point(description: String) -> Result<(), AppError> {
    crate::services::repair::create_restore_point(description).await
}
