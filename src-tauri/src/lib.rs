pub mod commands;
pub mod errors;
pub mod models;
pub mod services;

use commands::{cleaner, debloater, optimizer, system};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // System
            system::get_system_info,
            system::get_disk_usage,
            // Cleaner
            cleaner::scan_categories,
            cleaner::clean_files,
            // Optimizer
            optimizer::get_startup_items,
            optimizer::set_startup_enabled,
            optimizer::get_services,
            optimizer::set_service_status,
            optimizer::get_power_plans,
            optimizer::set_power_plan,
            optimizer::set_visual_effects,
            // Debloater
            debloater::get_installed_apps,
            debloater::remove_apps,
            // get_bloatware_database removed — internal data, not used by frontend
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("FialhoClean failed to start: {e}");
            std::process::exit(1);
        });
}
