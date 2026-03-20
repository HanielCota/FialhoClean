use crate::errors::AppError;
use crate::models::system::{DiskUsage, SystemInfo};
use sysinfo::System;

const DEFAULT_HOSTNAME: &str = "Unknown";
const DEFAULT_OS_NAME: &str = "Windows";
const DEFAULT_OS_VERSION: &str = "Unknown";

pub async fn get_system_info() -> Result<SystemInfo, AppError> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let hostname = System::host_name().unwrap_or_else(|| DEFAULT_HOSTNAME.to_string());
    let os_version = format!(
        "{} {}",
        System::name().unwrap_or_else(|| DEFAULT_OS_NAME.to_string()),
        System::os_version().unwrap_or_else(|| DEFAULT_OS_VERSION.to_string())
    );

    let cpu_usage = sys.global_cpu_usage();
    let ram_used_bytes = sys.used_memory();
    let ram_total_bytes = sys.total_memory();
    let uptime_seconds = System::uptime();

    Ok(SystemInfo {
        hostname,
        os_version,
        cpu_usage,
        ram_used_bytes,
        ram_total_bytes,
        uptime_seconds,
    })
}

pub async fn get_disk_usage() -> Result<Vec<DiskUsage>, AppError> {
    use sysinfo::Disks;
    let disks = Disks::new_with_refreshed_list();

    let result = disks
        .iter()
        .map(|disk| {
            let total = disk.total_space();
            let available = disk.available_space();
            let used = total.saturating_sub(available);
            DiskUsage {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total_bytes: total,
                used_bytes: used,
                available_bytes: available,
                filesystem: disk.file_system().to_string_lossy().to_string(),
            }
        })
        .collect();

    Ok(result)
}
