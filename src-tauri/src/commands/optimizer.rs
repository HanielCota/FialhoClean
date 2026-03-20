use crate::errors::AppError;
use crate::models::optimizer::{
    HibernateSettings, NetworkSettings, PowerPlan, ScheduledTask, ServiceAction, ServiceInfo,
    StartupItem,
};

#[tauri::command]
pub async fn apply_ultimate_performance() -> Result<(), AppError> {
    crate::services::optimizer::apply_ultimate_performance().await
}

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

#[tauri::command]
pub async fn get_hibernate_settings() -> Result<HibernateSettings, AppError> {
    crate::services::optimizer::get_hibernate_settings().await
}

#[tauri::command]
pub async fn set_hibernate(enabled: bool) -> Result<(), AppError> {
    crate::services::optimizer::set_hibernate(enabled).await
}

#[tauri::command]
pub async fn set_fast_startup(enabled: bool) -> Result<(), AppError> {
    crate::services::optimizer::set_fast_startup(enabled).await
}

#[tauri::command]
pub async fn apply_game_mode_preset() -> Result<(), AppError> {
    crate::services::optimizer::apply_game_mode_preset().await
}

#[tauri::command]
pub async fn get_network_settings() -> Result<NetworkSettings, AppError> {
    crate::services::optimizer::get_network_settings().await
}

#[tauri::command]
pub async fn set_network_optimized(enabled: bool) -> Result<(), AppError> {
    crate::services::optimizer::set_network_optimized(enabled).await
}

#[tauri::command]
pub async fn get_scheduled_tasks() -> Result<Vec<ScheduledTask>, AppError> {
    crate::services::optimizer::get_scheduled_tasks().await
}

#[tauri::command]
pub async fn set_scheduled_task_enabled(
    task_path: String,
    enabled: bool,
) -> Result<(), AppError> {
    crate::services::optimizer::set_scheduled_task_enabled(task_path, enabled).await
}

#[tauri::command]
pub async fn get_gpu_settings() -> Result<crate::models::optimizer::GpuSettings, AppError> {
    crate::services::optimizer::get_gpu_settings().await
}

#[tauri::command]
pub async fn set_gpu_hags(enabled: bool) -> Result<(), AppError> {
    crate::services::optimizer::set_gpu_hags(enabled).await
}

#[tauri::command]
pub async fn get_privacy_settings() -> Result<crate::models::optimizer::PrivacySettings, AppError> {
    crate::services::optimizer::get_privacy_settings().await
}

#[tauri::command]
pub async fn set_privacy_setting(setting_key: String, disabled: bool) -> Result<(), AppError> {
    crate::services::optimizer::set_privacy_setting(setting_key, disabled).await
}

#[tauri::command]
pub async fn optimize_ram() -> Result<crate::models::optimizer::RamOptimizationResult, AppError> {
    crate::services::optimizer::optimize_ram().await
}
