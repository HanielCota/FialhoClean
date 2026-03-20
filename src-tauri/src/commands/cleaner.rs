use crate::errors::AppError;
use crate::models::cleaner::{CleanCategory, CleanResult, FileGroup, ScanSummary};

#[tauri::command]
pub async fn scan_categories(categories: Vec<CleanCategory>) -> Result<ScanSummary, AppError> {
    crate::services::cleaner::scan_categories(categories).await
}

#[tauri::command]
pub async fn clean_files(file_groups: Vec<FileGroup>) -> Result<CleanResult, AppError> {
    crate::services::cleaner::clean_files(file_groups).await
}
