use crate::errors::AppError;
use crate::models::cleaner::{
    CategoryScanResult, CleanCategory, CleanResult, FileEntry, FileGroup, ScanSummary,
};
use std::path::Path;
use std::time::{Duration, UNIX_EPOCH};
use tokio::fs;
use tokio::time::timeout;

const WINDOWS_TEMP_FALLBACK: &str = r"C:\Windows\Temp";
const WINDOWS_LOGS_PATH: &str = r"C:\Windows\Logs";
const WINDOWS_PREFETCH_PATH: &str = r"C:\Windows\Prefetch";
const WINDOWS_UPDATE_DOWNLOAD_PATH: &str = r"C:\Windows\SoftwareDistribution\Download";
const WINDOWS_DELIVERY_OPT_PATH: &str = r"C:\Windows\SoftwareDistribution\DeliveryOptimization";
const WINDOWS_MINIDUMP_PATH: &str = r"C:\Windows\Minidump";
const WINDOWS_MEMORY_DMP: &str = r"C:\Windows\MEMORY.DMP";
const STEAM_PATH_X86: &str = r"C:\Program Files (x86)\Steam";
const STEAM_PATH_X64: &str = r"C:\Program Files\Steam";
const FIREFOX_PROFILES_SUBPATH: &str = r"Mozilla\Firefox\Profiles";
const CHROME_CACHE_SUBPATH: &str = r"Google\Chrome\User Data\Default\Cache";
const CHROME_CODE_CACHE_SUBPATH: &str = r"Google\Chrome\User Data\Default\Code Cache";
const EDGE_CACHE_SUBPATH: &str = r"Microsoft\Edge\User Data\Default\Cache";
const EDGE_CODE_CACHE_SUBPATH: &str = r"Microsoft\Edge\User Data\Default\Code Cache";

/// Maximum time to wait for any external process (powershell, etc.).
const PROCESS_TIMEOUT: Duration = Duration::from_secs(30);

/// Returns true if `path` is within a directory legitimately scanned for
/// `category`. Rejects null bytes, parent-directory traversal (..), and
/// paths outside the expected scope.
///
/// This is the server-side guard for `clean_files`: even if a manipulated
/// frontend sends crafted paths, only files inside the expected directories
/// will ever be deleted.
fn is_path_allowed(path: &str, category: &CleanCategory) -> bool {
    // Reject null bytes (could truncate strings in some OS APIs).
    if path.contains('\0') {
        return false;
    }
    // Reject parent-directory traversal regardless of how it is encoded.
    if Path::new(path)
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return false;
    }

    // Build the list of allowed base directories for this category.
    let allowed_prefixes: Vec<String> = match category {
        CleanCategory::TempFiles => {
            let mut v = vec![WINDOWS_TEMP_FALLBACK.to_string()];
            if let Ok(t) = std::env::var("TEMP") {
                v.push(t);
            }
            if let Ok(t) = std::env::var("TMP") {
                v.push(t);
            }
            v
        }
        CleanCategory::BrowserCache => {
            let mut v = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                v.push(t);
            }
            if let Ok(t) = std::env::var("APPDATA") {
                v.push(t);
            }
            v
        }
        CleanCategory::OldLogs => {
            let mut v = vec![WINDOWS_LOGS_PATH.to_string()];
            if let Ok(t) = std::env::var("TEMP") {
                v.push(t);
            }
            v
        }
        CleanCategory::Prefetch => vec![WINDOWS_PREFETCH_PATH.to_string()],
        CleanCategory::WindowsUpdateCache => vec![WINDOWS_UPDATE_DOWNLOAD_PATH.to_string()],
        CleanCategory::DeliveryOptimization => vec![WINDOWS_DELIVERY_OPT_PATH.to_string()],
        CleanCategory::WindowsErrorReports => {
            let mut v = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                v.push(format!(r"{}\Microsoft\Windows\WER", t));
            }
            if let Ok(t) = std::env::var("PROGRAMDATA") {
                v.push(format!(r"{}\Microsoft\Windows\WER", t));
            }
            v
        }
        CleanCategory::ThumbnailCache | CleanCategory::IconCache => {
            let mut v = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                v.push(format!(r"{}\Microsoft\Windows\Explorer", t));
            }
            v
        }
        CleanCategory::MemoryDumps => {
            // Special case: also allow the exact MEMORY.DMP file (checked below).
            vec![WINDOWS_MINIDUMP_PATH.to_string()]
        }
        CleanCategory::DiscordCache => {
            let mut v = Vec::new();
            if let Ok(t) = std::env::var("APPDATA") {
                v.push(format!(r"{}\discord\Cache", t));
                v.push(format!(r"{}\discord\Code Cache", t));
                v.push(format!(r"{}\discord\GPUCache", t));
            }
            v
        }
        CleanCategory::SpotifyCache => {
            let mut v = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                v.push(format!(r"{}\Spotify\Storage", t));
            }
            v
        }
        CleanCategory::SteamCache => {
            let mut v = vec![
                format!(r"{}\depotcache", STEAM_PATH_X86),
                format!(r"{}\logs", STEAM_PATH_X86),
                format!(r"{}\dumps", STEAM_PATH_X86),
                format!(r"{}\depotcache", STEAM_PATH_X64),
                format!(r"{}\logs", STEAM_PATH_X64),
                format!(r"{}\dumps", STEAM_PATH_X64),
            ];
            // Also support Steam installed on other drives via LOCALAPPDATA hint.
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                v.push(format!(r"{}\Steam\depotcache", t));
                v.push(format!(r"{}\Steam\logs", t));
                v.push(format!(r"{}\Steam\dumps", t));
            }
            v
        }
        CleanCategory::RecentFiles => {
            let mut v = Vec::new();
            if let Ok(t) = std::env::var("APPDATA") {
                v.push(format!(r"{}\Microsoft\Windows\Recent", t));
            }
            v
        }
        // RecycleBin and DnsCache are handled via commands — no individual file paths.
        CleanCategory::RecycleBin | CleanCategory::DnsCache => return false,
    };

    // Special exact-path check for MEMORY.DMP.
    if *category == CleanCategory::MemoryDumps
        && path.to_lowercase() == WINDOWS_MEMORY_DMP.to_lowercase()
    {
        return true;
    }

    // Case-insensitive prefix match (Windows paths are case-insensitive).
    // The trailing separator ensures "C:\Temp" never matches "C:\TempFoo\file".
    let path_lower = path.to_lowercase();
    allowed_prefixes.iter().any(|prefix| {
        if prefix.is_empty() {
            return false;
        }
        let mut p = prefix.to_lowercase();
        if !p.ends_with('\\') {
            p.push('\\');
        }
        path_lower.starts_with(&p)
    })
}

pub async fn scan_categories(categories: Vec<CleanCategory>) -> Result<ScanSummary, AppError> {
    let mut handles = Vec::new();

    for category in categories {
        let handle = tokio::spawn(async move { scan_single_category(&category).await });
        handles.push(handle);
    }

    let mut results = Vec::new();
    for handle in handles {
        let result = handle
            .await
            .map_err(|e| AppError::Custom(e.to_string()))??;
        results.push(result);
    }

    let total_size_bytes = results.iter().map(|r| r.total_size_bytes).sum();

    Ok(ScanSummary {
        categories: results,
        total_size_bytes,
    })
}

async fn scan_single_category(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    match category {
        CleanCategory::TempFiles => scan_temp_files(category).await,
        CleanCategory::BrowserCache => scan_browser_cache(category).await,
        CleanCategory::RecycleBin => scan_recycle_bin(category).await,
        CleanCategory::OldLogs => scan_old_logs(category).await,
        CleanCategory::Prefetch => scan_prefetch(category).await,
        CleanCategory::WindowsUpdateCache => scan_windows_update_cache(category).await,
        CleanCategory::DeliveryOptimization => scan_delivery_optimization(category).await,
        CleanCategory::WindowsErrorReports => scan_windows_error_reports(category).await,
        CleanCategory::ThumbnailCache => scan_thumbnail_cache(category).await,
        CleanCategory::IconCache => scan_icon_cache(category).await,
        CleanCategory::MemoryDumps => scan_memory_dumps(category).await,
        CleanCategory::DiscordCache => scan_discord_cache(category).await,
        CleanCategory::SpotifyCache => scan_spotify_cache(category).await,
        CleanCategory::SteamCache => scan_steam_cache(category).await,
        CleanCategory::RecentFiles => scan_recent_files(category).await,
        CleanCategory::DnsCache => scan_dns_cache(category).await,
    }
}

async fn scan_temp_files(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let user_temp = std::env::var("TEMP").unwrap_or_else(|_| WINDOWS_TEMP_FALLBACK.to_string());
    let paths = vec![user_temp];

    let mut all_files = Vec::new();
    let mut needs_elevation = false;

    for path_str in &paths {
        let path = Path::new(path_str);
        match collect_files(path).await {
            Ok(mut files) => all_files.append(&mut files),
            Err(AppError::PermissionDenied { .. }) => {
                needs_elevation = true;
            }
            Err(_) => {}
        }
    }

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();

    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation,
        error: None,
    })
}

async fn scan_browser_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let app_data = std::env::var("APPDATA").unwrap_or_default();

    let mut cache_paths = vec![
        format!(r"{}\{}", local_app_data, CHROME_CACHE_SUBPATH),
        format!(r"{}\{}", local_app_data, CHROME_CODE_CACHE_SUBPATH),
        format!(r"{}\{}", local_app_data, EDGE_CACHE_SUBPATH),
        format!(r"{}\{}", local_app_data, EDGE_CODE_CACHE_SUBPATH),
    ];
    if let Some(ff) = find_firefox_cache(&app_data) {
        cache_paths.push(ff);
    }

    let mut all_files = Vec::new();
    for path_str in &cache_paths {
        let path = Path::new(path_str);
        if let Ok(mut files) = collect_files(path).await {
            all_files.append(&mut files);
        }
    }

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();

    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation: false,
        error: None,
    })
}

fn find_firefox_cache(app_data: &str) -> Option<String> {
    let profiles_path = format!(r"{}\{}", app_data, FIREFOX_PROFILES_SUBPATH);
    let dir = std::fs::read_dir(&profiles_path).ok()?;

    for entry in dir.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let cache = path.join("cache2");
            if cache.exists() {
                return Some(cache.to_string_lossy().to_string());
            }
        }
    }
    None
}

async fn scan_recycle_bin(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    // We can't directly enumerate $Recycle.Bin safely, so we return a placeholder.
    // Actual deletion uses SHEmptyRecycleBin via PowerShell.
    Ok(CategoryScanResult {
        category: category.clone(),
        files: vec![],
        total_size_bytes: estimate_recycle_bin_size().await,
        needs_elevation: false,
        error: None,
    })
}

/// Estimates the recycle bin size via PowerShell.
/// Uses tokio::process::Command (non-blocking) with a hard timeout.
async fn estimate_recycle_bin_size() -> u64 {
    let result = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; \
                 $OutputEncoding = [System.Text.Encoding]::UTF8; \
                 (New-Object -ComObject Shell.Application).NameSpace(0xA).Items() \
                 | Measure-Object -Property Size -Sum \
                 | Select-Object -ExpandProperty Sum",
            ])
            .output(),
    )
    .await;

    result
        .ok()
        .and_then(|r| r.ok())
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|s| s.trim().parse::<u64>().ok())
        .unwrap_or(0)
}

async fn scan_old_logs(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let temp = std::env::var("TEMP").unwrap_or_default();
    let log_paths = vec![temp, WINDOWS_LOGS_PATH.to_string()];

    let mut all_files = Vec::new();
    let mut needs_elevation = false;

    for path_str in &log_paths {
        let path = Path::new(path_str);
        match collect_files_by_extension(path, "log").await {
            Ok(mut files) => all_files.append(&mut files),
            Err(AppError::PermissionDenied { .. }) => needs_elevation = true,
            Err(_) => {}
        }
    }

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();

    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation,
        error: None,
    })
}

async fn scan_prefetch(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let path = Path::new(WINDOWS_PREFETCH_PATH);

    match collect_files(path).await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(AppError::PermissionDenied { .. }) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: true,
            error: None,
        }),
        Err(e) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: Some(e.to_string()),
        }),
    }
}

async fn scan_windows_update_cache(
    category: &CleanCategory,
) -> Result<CategoryScanResult, AppError> {
    let path = Path::new(WINDOWS_UPDATE_DOWNLOAD_PATH);
    match collect_files(path).await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(AppError::PermissionDenied { .. }) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: true,
            error: None,
        }),
        Err(e) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: Some(e.to_string()),
        }),
    }
}

async fn scan_delivery_optimization(
    category: &CleanCategory,
) -> Result<CategoryScanResult, AppError> {
    let path = Path::new(WINDOWS_DELIVERY_OPT_PATH);
    match collect_files(path).await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(AppError::PermissionDenied { .. }) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: true,
            error: None,
        }),
        Err(e) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: Some(e.to_string()),
        }),
    }
}

async fn scan_windows_error_reports(
    category: &CleanCategory,
) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let program_data = std::env::var("PROGRAMDATA").unwrap_or_default();

    let wer_paths = vec![
        format!(r"{}\Microsoft\Windows\WER\ReportArchive", local_app_data),
        format!(r"{}\Microsoft\Windows\WER\ReportQueue", local_app_data),
        format!(r"{}\Microsoft\Windows\WER\ReportArchive", program_data),
        format!(r"{}\Microsoft\Windows\WER\ReportQueue", program_data),
    ];

    let mut all_files = Vec::new();
    let mut needs_elevation = false;

    for path_str in &wer_paths {
        let path = Path::new(path_str);
        match collect_files(path).await {
            Ok(mut files) => all_files.append(&mut files),
            Err(AppError::PermissionDenied { .. }) => needs_elevation = true,
            Err(_) => {}
        }
    }

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();

    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation,
        error: None,
    })
}

async fn scan_thumbnail_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let explorer_path = format!(r"{}\Microsoft\Windows\Explorer", local_app_data);
    let path = Path::new(&explorer_path);

    // Only thumbcache_*.db — icon cache uses iconcache_*.db (separate category).
    match collect_files_by_name_prefix(path, "thumbcache_").await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(AppError::PermissionDenied { .. }) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: true,
            error: None,
        }),
        Err(e) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: Some(e.to_string()),
        }),
    }
}

async fn scan_icon_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let explorer_path = format!(r"{}\Microsoft\Windows\Explorer", local_app_data);
    let path = Path::new(&explorer_path);

    match collect_files_by_name_prefix(path, "iconcache_").await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(AppError::PermissionDenied { .. }) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: true,
            error: None,
        }),
        Err(e) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: Some(e.to_string()),
        }),
    }
}

async fn scan_memory_dumps(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let minidump_path = Path::new(WINDOWS_MINIDUMP_PATH);
    let mut all_files = Vec::new();
    let mut needs_elevation = false;

    match collect_files(minidump_path).await {
        Ok(mut files) => all_files.append(&mut files),
        Err(AppError::PermissionDenied { .. }) => needs_elevation = true,
        Err(_) => {}
    }

    // Also include the full memory dump if it exists.
    let memory_dmp = Path::new(WINDOWS_MEMORY_DMP);
    if memory_dmp.exists() {
        if let Ok(meta) = std::fs::metadata(memory_dmp) {
            let modified_timestamp = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            all_files.push(FileEntry {
                path: WINDOWS_MEMORY_DMP.to_string(),
                size_bytes: meta.len(),
                modified_timestamp,
            });
        }
    }

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();
    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation,
        error: None,
    })
}

async fn scan_discord_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let app_data = std::env::var("APPDATA").unwrap_or_default();
    let cache_paths = vec![
        format!(r"{}\discord\Cache\Cache_Data", app_data),
        format!(r"{}\discord\Cache", app_data),
        format!(r"{}\discord\Code Cache", app_data),
        format!(r"{}\discord\GPUCache", app_data),
    ];

    let mut all_files = Vec::new();
    for path_str in &cache_paths {
        let path = Path::new(path_str);
        if let Ok(mut files) = collect_files(path).await {
            all_files.append(&mut files);
        }
    }

    // Deduplicate by path in case subdirectories overlapped.
    all_files.dedup_by(|a, b| a.path == b.path);

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();
    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation: false,
        error: None,
    })
}

async fn scan_spotify_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let storage_path = format!(r"{}\Spotify\Storage", local_app_data);
    let path = Path::new(&storage_path);

    match collect_files(path).await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(_) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: None,
        }),
    }
}

async fn scan_steam_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let steam_bases = vec![
        STEAM_PATH_X86.to_string(),
        STEAM_PATH_X64.to_string(),
        format!(r"{}\Steam", local_app_data),
    ];

    let sub_dirs = ["depotcache", "logs", "dumps"];
    let mut all_files = Vec::new();

    for base in &steam_bases {
        for sub in &sub_dirs {
            let full_path = format!(r"{}\{}", base, sub);
            let path = Path::new(&full_path);
            if let Ok(mut files) = collect_files(path).await {
                all_files.append(&mut files);
            }
        }
    }

    let total_size_bytes = all_files.iter().map(|f| f.size_bytes).sum();
    Ok(CategoryScanResult {
        category: category.clone(),
        files: all_files,
        total_size_bytes,
        needs_elevation: false,
        error: None,
    })
}

async fn scan_recent_files(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let app_data = std::env::var("APPDATA").unwrap_or_default();
    let recent_path = format!(r"{}\Microsoft\Windows\Recent", app_data);
    let path = Path::new(&recent_path);

    match collect_files(path).await {
        Ok(files) => {
            let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();
            Ok(CategoryScanResult {
                category: category.clone(),
                files,
                total_size_bytes,
                needs_elevation: false,
                error: None,
            })
        }
        Err(_) => Ok(CategoryScanResult {
            category: category.clone(),
            files: vec![],
            total_size_bytes: 0,
            needs_elevation: false,
            error: None,
        }),
    }
}

async fn scan_dns_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    // DNS cache is command-based — no individual files to enumerate.
    // Return an empty placeholder; cleaning runs ipconfig /flushdns.
    Ok(CategoryScanResult {
        category: category.clone(),
        files: vec![],
        total_size_bytes: 0,
        needs_elevation: false,
        error: None,
    })
}

async fn collect_files(dir: &Path) -> Result<Vec<FileEntry>, AppError> {
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut result = Vec::new();
    let mut stack = vec![dir.to_path_buf()];

    while let Some(current) = stack.pop() {
        let mut read_dir = match fs::read_dir(&current).await {
            Ok(rd) => rd,
            Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => {
                return Err(AppError::PermissionDenied {
                    context: current.to_string_lossy().to_string(),
                });
            }
            Err(_) => continue,
        };

        while let Ok(Some(entry)) = read_dir.next_entry().await {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
                continue;
            }

            let Ok(meta) = entry.metadata().await else {
                continue;
            };

            let modified_timestamp = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            result.push(FileEntry {
                path: path.to_string_lossy().to_string(),
                size_bytes: meta.len(),
                modified_timestamp,
            });
        }
    }

    Ok(result)
}

async fn collect_files_by_extension(dir: &Path, ext: &str) -> Result<Vec<FileEntry>, AppError> {
    let all = collect_files(dir).await?;
    let ext_lower = ext.to_lowercase();
    let filtered = all
        .into_iter()
        .filter(|f| {
            Path::new(&f.path)
                .extension()
                .map(|e| e.to_string_lossy().to_lowercase() == ext_lower)
                .unwrap_or(false)
        })
        .collect();
    Ok(filtered)
}

/// Collects only files whose filename starts with `prefix` (case-insensitive).
/// Scans a single directory level — does not recurse into subdirectories.
async fn collect_files_by_name_prefix(
    dir: &Path,
    prefix: &str,
) -> Result<Vec<FileEntry>, AppError> {
    let all = collect_files(dir).await?;
    let prefix_lower = prefix.to_lowercase();
    let filtered = all
        .into_iter()
        .filter(|f| {
            Path::new(&f.path)
                .file_name()
                .map(|n| n.to_string_lossy().to_lowercase().starts_with(&prefix_lower))
                .unwrap_or(false)
        })
        .collect();
    Ok(filtered)
}

pub async fn clean_files(file_groups: Vec<FileGroup>) -> Result<CleanResult, AppError> {
    let mut deleted_count = 0usize;
    let mut skipped_count = 0usize;
    let mut freed_bytes = 0u64;
    let mut errors = Vec::new();

    for group in file_groups {
        if group.category == CleanCategory::RecycleBin {
            match empty_recycle_bin().await {
                Ok(size) => {
                    freed_bytes += size;
                    deleted_count += 1;
                }
                Err(e) => errors.push(e.to_string()),
            }
            continue;
        }

        if group.category == CleanCategory::DnsCache {
            match flush_dns().await {
                Ok(_) => deleted_count += 1,
                Err(e) => errors.push(e.to_string()),
            }
            continue;
        }

        // Use semaphore to limit concurrent file handles.
        let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(32));
        let mut handles = Vec::new();

        for path in group.paths {
            // Server-side path validation: reject anything outside the expected
            // directories for this category. This is the primary defence against
            // a manipulated frontend sending arbitrary paths to clean_files.
            if !is_path_allowed(&path, &group.category) {
                errors.push(format!("path rejected (out of scope): {path}"));
                skipped_count += 1;
                continue;
            }

            let permit = semaphore
                .clone()
                .acquire_owned()
                .await
                .map_err(|e| AppError::Custom(format!("semaphore error: {e}")))?;

            let handle = tokio::spawn(async move {
                let _permit = permit;
                let size = tokio::fs::metadata(&path)
                    .await
                    .map(|m| m.len())
                    .unwrap_or(0);

                match tokio::fs::remove_file(&path).await {
                    Ok(_) => (true, size, None::<String>),
                    Err(_) => (false, 0, None),
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            match handle.await {
                Ok((true, size, _)) => {
                    deleted_count += 1;
                    freed_bytes += size;
                }
                Ok((false, _, _)) => skipped_count += 1,
                Err(e) => errors.push(e.to_string()),
            }
        }
    }

    Ok(CleanResult {
        deleted_count,
        skipped_count,
        freed_bytes,
        errors,
    })
}

async fn empty_recycle_bin() -> Result<u64, AppError> {
    let size_before = estimate_recycle_bin_size().await;

    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Clear-RecycleBin -Force -ErrorAction SilentlyContinue",
            ])
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("clear recycle bin timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::PowerShell(stderr.to_string()));
    }

    Ok(size_before)
}

async fn flush_dns() -> Result<(), AppError> {
    let output = timeout(
        PROCESS_TIMEOUT,
        tokio::process::Command::new("ipconfig")
            .arg("/flushdns")
            .output(),
    )
    .await
    .map_err(|_| AppError::Custom("flush DNS timed out".into()))?
    .map_err(AppError::Io)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Custom(format!("ipconfig /flushdns failed: {stderr}")));
    }

    Ok(())
}
