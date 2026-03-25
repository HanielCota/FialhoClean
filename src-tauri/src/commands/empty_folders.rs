use crate::errors::AppError;
use crate::models::empty_folders::{DeleteEmptyFoldersResult, EmptyFolderScanResult};

#[tauri::command]
pub async fn scan_empty_folders() -> Result<EmptyFolderScanResult, AppError> {
    crate::services::empty_folders::scan_empty_folders().await
}

#[tauri::command]
pub async fn delete_empty_folders(
    paths: Vec<String>,
) -> Result<DeleteEmptyFoldersResult, AppError> {
    crate::services::empty_folders::delete_empty_folders(paths).await
}
