pub mod commands;
pub mod errors;
pub mod models;
pub mod services;

use commands::{cleaner, debloater, optimizer, repair, system};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize structured logging (controlled via RUST_LOG env var).
    // Default level: warn in release, debug in dev.
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                match cfg!(debug_assertions) {
                    true => "fialho_clean_lib=debug".into(),
                    false => "fialho_clean_lib=warn".into(),
                }
            }),
        )
        .compact()
        .try_init()
        .ok();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // System
            system::get_system_info,
            system::get_disk_usage,
            system::open_url,
            // Cleaner
            cleaner::scan_categories,
            cleaner::clean_files,
            // Optimizer — startup
            optimizer::get_startup_items,
            optimizer::set_startup_enabled,
            // Optimizer — services
            optimizer::get_services,
            optimizer::set_service_status,
            // Optimizer — power
            optimizer::get_power_plans,
            optimizer::set_power_plan,
            optimizer::set_visual_effects,
            // Optimizer — hibernate / fast startup
            optimizer::get_hibernate_settings,
            optimizer::set_hibernate,
            optimizer::set_fast_startup,
            // Optimizer — game mode
            optimizer::apply_game_mode_preset,
            optimizer::apply_ultimate_performance,
            // Optimizer — network
            optimizer::get_network_settings,
            optimizer::set_network_optimized,
            // Optimizer — scheduled tasks
            optimizer::get_scheduled_tasks,
            optimizer::set_scheduled_task_enabled,
            // Optimizer — GPU
            optimizer::get_gpu_settings,
            optimizer::set_gpu_hags,
            // Optimizer — privacy
            optimizer::get_privacy_settings,
            optimizer::set_privacy_setting,
            // Optimizer — RAM
            optimizer::optimize_ram,
            // Debloater
            debloater::get_installed_apps,
            debloater::remove_apps,
            // Repair
            repair::run_sfc,
            repair::run_dism,
            repair::create_restore_point,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("FialhoClean failed to start: {e}");
            std::process::exit(1);
        });
}
