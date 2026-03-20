use crate::errors::AppError;
use crate::models::debloater::{AppInfo, RemoveResult};

#[tauri::command]
pub async fn get_installed_apps() -> Result<Vec<AppInfo>, AppError> {
    crate::services::debloater::get_installed_apps().await
}

#[tauri::command]
pub async fn remove_apps(package_full_names: Vec<String>) -> Result<Vec<RemoveResult>, AppError> {
    crate::services::debloater::remove_apps(package_full_names).await
}

// get_bloatware_database intentionally omitted — it is an internal database
// used by get_installed_apps() and should not be exposed as a command.
