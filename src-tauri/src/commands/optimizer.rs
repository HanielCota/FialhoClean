use crate::errors::AppError;
use crate::models::optimizer::{PowerPlan, ServiceAction, ServiceInfo, StartupItem};

#[tauri::command]
pub async fn get_startup_items() -> Result<Vec<StartupItem>, AppError> {
    crate::services::optimizer::get_startup_items().await
}

#[tauri::command]
pub async fn set_startup_enabled(
    name: String,
    key_path: String,
    enabled: bool,
) -> Result<(), AppError> {
    crate::services::optimizer::set_startup_enabled(name, key_path, enabled).await
}

#[tauri::command]
pub async fn get_services() -> Result<Vec<ServiceInfo>, AppError> {
    crate::services::optimizer::get_services().await
}

#[tauri::command]
pub async fn set_service_status(name: String, action: ServiceAction) -> Result<(), AppError> {
    crate::services::optimizer::set_service_status(name, action).await
}

#[tauri::command]
pub async fn get_power_plans() -> Result<Vec<PowerPlan>, AppError> {
    crate::services::optimizer::get_power_plans().await
}

#[tauri::command]
pub async fn set_power_plan(plan_guid: String) -> Result<(), AppError> {
    crate::services::optimizer::set_power_plan(plan_guid).await
}

#[tauri::command]
pub async fn set_visual_effects(performance_mode: bool) -> Result<(), AppError> {
    crate::services::optimizer::set_visual_effects(performance_mode).await
}
