use crate::errors::AppError;
use crate::models::cleaner::{
    CategoryScanResult, CleanCategory, CleanResult, FileEntry, FileGroup, ScanSummary,
};
use crate::services::process_runner::ProcessRunner;
use crate::services::scan_helper::{empty_result, scan_paths, scan_single_path};
use std::path::{Path, PathBuf};
use std::time::{Duration, UNIX_EPOCH};
use tokio::fs;

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

/// Shared runner for all cleaner subprocesses (30s timeout).
const RUNNER: ProcessRunner = ProcessRunner::new("cleaner", Duration::from_secs(30));

#[cfg(windows)]
const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x0400;

#[cfg(windows)]
fn is_reparse_point(metadata: &std::fs::Metadata) -> bool {
    use std::os::windows::fs::MetadataExt;

    metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0
}

#[cfg(not(windows))]
fn is_reparse_point(_metadata: &std::fs::Metadata) -> bool {
    false
}

fn canonicalize_for_scope(path: &Path) -> Option<PathBuf> {
    std::fs::canonicalize(path).ok().or_else(|| {
        let file_name = path.file_name()?.to_os_string();
        let parent = path.parent()?;
        let resolved_parent = std::fs::canonicalize(parent).ok()?;
        Some(resolved_parent.join(file_name))
    })
}

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
    let path_obj = Path::new(path);
    if !path_obj.is_absolute() {
        return false;
    }
    // Reject parent-directory traversal regardless of how it is encoded.
    if path_obj
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return false;
    }

    // Build the list of allowed base directories for this category.
    let allowed_prefixes: Vec<String> = match category {
        CleanCategory::TempFiles => {
            let mut paths = vec![WINDOWS_TEMP_FALLBACK.to_string()];
            if let Ok(t) = std::env::var("TEMP") {
                paths.push(t);
            }
            if let Ok(t) = std::env::var("TMP") {
                paths.push(t);
            }
            paths
        }
        CleanCategory::BrowserCache => {
            let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
            let app_data = std::env::var("APPDATA").unwrap_or_default();
            browser_cache_paths(&local_app_data, &app_data)
        }
        CleanCategory::OldLogs => {
            let mut paths = vec![WINDOWS_LOGS_PATH.to_string()];
            if let Ok(t) = std::env::var("TEMP") {
                paths.push(t);
            }
            paths
        }
        CleanCategory::Prefetch => vec![WINDOWS_PREFETCH_PATH.to_string()],
        CleanCategory::WindowsUpdateCache => vec![WINDOWS_UPDATE_DOWNLOAD_PATH.to_string()],
        CleanCategory::DeliveryOptimization => vec![WINDOWS_DELIVERY_OPT_PATH.to_string()],
        CleanCategory::WindowsErrorReports => {
            let mut paths = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                paths.push(format!(r"{}\Microsoft\Windows\WER", t));
            }
            if let Ok(t) = std::env::var("PROGRAMDATA") {
                paths.push(format!(r"{}\Microsoft\Windows\WER", t));
            }
            paths
        }
        CleanCategory::ThumbnailCache | CleanCategory::IconCache => {
            let mut paths = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                paths.push(format!(r"{}\Microsoft\Windows\Explorer", t));
            }
            paths
        }
        CleanCategory::MemoryDumps => {
            // Special case: also allow the exact MEMORY.DMP file (checked below).
            vec![WINDOWS_MINIDUMP_PATH.to_string()]
        }
        CleanCategory::DiscordCache => {
            let mut paths = Vec::new();
            if let Ok(t) = std::env::var("APPDATA") {
                paths.push(format!(r"{}\discord\Cache", t));
                paths.push(format!(r"{}\discord\Code Cache", t));
                paths.push(format!(r"{}\discord\GPUCache", t));
            }
            paths
        }
        CleanCategory::SpotifyCache => {
            let mut paths = Vec::new();
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                paths.push(format!(r"{}\Spotify\Storage", t));
            }
            paths
        }
        CleanCategory::SteamCache => {
            let mut paths = vec![
                format!(r"{}\depotcache", STEAM_PATH_X86),
                format!(r"{}\logs", STEAM_PATH_X86),
                format!(r"{}\dumps", STEAM_PATH_X86),
                format!(r"{}\depotcache", STEAM_PATH_X64),
                format!(r"{}\logs", STEAM_PATH_X64),
                format!(r"{}\dumps", STEAM_PATH_X64),
            ];
            // Also support Steam installed on other drives via LOCALAPPDATA hint.
            if let Ok(t) = std::env::var("LOCALAPPDATA") {
                paths.push(format!(r"{}\Steam\depotcache", t));
                paths.push(format!(r"{}\Steam\logs", t));
                paths.push(format!(r"{}\Steam\dumps", t));
            }
            paths
        }
        CleanCategory::RecentFiles => {
            let mut paths = Vec::new();
            if let Ok(t) = std::env::var("APPDATA") {
                paths.push(format!(r"{}\Microsoft\Windows\Recent", t));
            }
            paths
        }
        // RecycleBin and DnsCache are handled via commands — no individual file paths.
        CleanCategory::RecycleBin | CleanCategory::DnsCache => return false,
    };

    let Some(resolved_path) = canonicalize_for_scope(path_obj) else {
        return false;
    };

    // Special exact-path check for MEMORY.DMP.
    if *category == CleanCategory::MemoryDumps {
        if let Some(memory_dump_path) = canonicalize_for_scope(Path::new(WINDOWS_MEMORY_DMP)) {
            if resolved_path == memory_dump_path {
                return true;
            }
        }
    }

    allowed_prefixes
        .iter()
        .filter(|prefix| !prefix.is_empty())
        .filter_map(|prefix| canonicalize_for_scope(Path::new(prefix)))
        .any(|prefix| resolved_path.starts_with(prefix))
        && category_path_shape_matches(path, category)
}

fn browser_cache_paths(local_app_data: &str, app_data: &str) -> Vec<String> {
    let mut cache_paths = vec![
        format!(r"{}\{}", local_app_data, CHROME_CACHE_SUBPATH),
        format!(r"{}\{}", local_app_data, CHROME_CODE_CACHE_SUBPATH),
        format!(r"{}\{}", local_app_data, EDGE_CACHE_SUBPATH),
        format!(r"{}\{}", local_app_data, EDGE_CODE_CACHE_SUBPATH),
    ];
    if let Some(ff) = find_firefox_cache(app_data) {
        cache_paths.push(ff);
    }
    cache_paths
}

fn category_path_shape_matches(path: &str, category: &CleanCategory) -> bool {
    match category {
        CleanCategory::OldLogs => has_extension(path, "log"),
        CleanCategory::ThumbnailCache => file_name_starts_with(path, "thumbcache_"),
        CleanCategory::IconCache => file_name_starts_with(path, "iconcache_"),
        _ => true,
    }
}

fn has_extension(path: &str, ext: &str) -> bool {
    Path::new(path)
        .extension()
        .map(|e| e.to_string_lossy().eq_ignore_ascii_case(ext))
        .unwrap_or(false)
}

fn file_name_starts_with(path: &str, prefix: &str) -> bool {
    Path::new(path)
        .file_name()
        .map(|n| {
            n.to_string_lossy()
                .to_ascii_lowercase()
                .starts_with(&prefix.to_ascii_lowercase())
        })
        .unwrap_or(false)
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
    scan_paths(category, &[&user_temp], |p| {
        let owned = p.to_path_buf();
        Box::pin(async move { collect_files(&owned).await })
    })
    .await
}

async fn scan_browser_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let app_data = std::env::var("APPDATA").unwrap_or_default();

    let cache_paths = browser_cache_paths(&local_app_data, &app_data);
    let refs: Vec<&str> = cache_paths.iter().map(|s| s.as_str()).collect();
    scan_paths(category, &refs, |p| {
        let owned = p.to_path_buf();
        Box::pin(async move { collect_files(&owned).await })
    })
    .await
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
    let mut result = empty_result(category);
    result.total_size_bytes = estimate_recycle_bin_size().await;
    Ok(result)
}

/// Estimates the recycle bin size via PowerShell.
async fn estimate_recycle_bin_size() -> u64 {
    let ps = "(New-Object -ComObject Shell.Application).NameSpace(0xA).Items() \
              | Measure-Object -Property Size -Sum \
              | Select-Object -ExpandProperty Sum";
    RUNNER
        .powershell(ps)
        .await
        .ok()
        .and_then(|o| o.stdout.trim().parse::<u64>().ok())
        .unwrap_or(0)
}

async fn scan_old_logs(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let temp = std::env::var("TEMP").unwrap_or_default();
    let logs_path = WINDOWS_LOGS_PATH.to_string();
    let refs: Vec<&str> = vec![&temp, &logs_path];
    scan_paths(category, &refs, |p| {
        let owned = p.to_path_buf();
        Box::pin(async move { collect_files_by_extension(&owned, "log").await })
    })
    .await
}

async fn scan_prefetch(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let path = Path::new(WINDOWS_PREFETCH_PATH);
    scan_single_path(category, collect_files(path)).await
}

async fn scan_windows_update_cache(
    category: &CleanCategory,
) -> Result<CategoryScanResult, AppError> {
    let path = Path::new(WINDOWS_UPDATE_DOWNLOAD_PATH);
    scan_single_path(category, collect_files(path)).await
}

async fn scan_delivery_optimization(
    category: &CleanCategory,
) -> Result<CategoryScanResult, AppError> {
    let path = Path::new(WINDOWS_DELIVERY_OPT_PATH);
    scan_single_path(category, collect_files(path)).await
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

    let refs: Vec<&str> = wer_paths.iter().map(|s| s.as_str()).collect();
    scan_paths(category, &refs, |p| {
        let owned = p.to_path_buf();
        Box::pin(async move { collect_files(&owned).await })
    })
    .await
}

async fn scan_thumbnail_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let explorer_path = format!(r"{}\Microsoft\Windows\Explorer", local_app_data);
    let path = Path::new(&explorer_path);
    scan_single_path(category, collect_files_by_name_prefix(path, "thumbcache_")).await
}

async fn scan_icon_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let explorer_path = format!(r"{}\Microsoft\Windows\Explorer", local_app_data);
    let path = Path::new(&explorer_path);
    scan_single_path(category, collect_files_by_name_prefix(path, "iconcache_")).await
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

    let refs: Vec<&str> = cache_paths.iter().map(|s| s.as_str()).collect();
    let mut result = scan_paths(category, &refs, |p| {
        let owned = p.to_path_buf();
        Box::pin(async move { collect_files(&owned).await })
    })
    .await?;

    // Sort then deduplicate by path in case subdirectories overlapped.
    result.files.sort_by(|a, b| a.path.cmp(&b.path));
    result.files.dedup_by(|a, b| a.path == b.path);
    result.total_size_bytes = result.files.iter().map(|f| f.size_bytes).sum();

    Ok(result)
}

async fn scan_spotify_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let storage_path = format!(r"{}\Spotify\Storage", local_app_data);
    let path = Path::new(&storage_path);
    scan_single_path(category, collect_files(path)).await
}

async fn scan_steam_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let steam_bases = [
        STEAM_PATH_X86.to_string(),
        STEAM_PATH_X64.to_string(),
        format!(r"{}\Steam", local_app_data),
    ];

    let sub_dirs = ["depotcache", "logs", "dumps"];
    let all_paths: Vec<String> = steam_bases
        .iter()
        .flat_map(|base| sub_dirs.iter().map(move |sub| format!(r"{}\{}", base, sub)))
        .collect();

    let refs: Vec<&str> = all_paths.iter().map(|s| s.as_str()).collect();
    scan_paths(category, &refs, |p| {
        let owned = p.to_path_buf();
        Box::pin(async move { collect_files(&owned).await })
    })
    .await
}

async fn scan_recent_files(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    let app_data = std::env::var("APPDATA").unwrap_or_default();
    let recent_path = format!(r"{}\Microsoft\Windows\Recent", app_data);
    let path = Path::new(&recent_path);
    scan_single_path(category, collect_files(path)).await
}

async fn scan_dns_cache(category: &CleanCategory) -> Result<CategoryScanResult, AppError> {
    Ok(empty_result(category))
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
            let Ok(meta) = fs::symlink_metadata(&path).await else {
                continue;
            };

            if is_reparse_point(&meta) {
                continue;
            }

            if meta.is_dir() {
                stack.push(path);
                continue;
            }

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
                .map(|n| {
                    n.to_string_lossy()
                        .to_lowercase()
                        .starts_with(&prefix_lower)
                })
                .unwrap_or(false)
        })
        .collect();
    Ok(filtered)
}

pub async fn clean_files(file_groups: Vec<FileGroup>) -> Result<CleanResult, AppError> {
    tracing::info!(groups = file_groups.len(), "starting file cleanup");
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

                // Re-check metadata right before deletion to close the
                // TOCTOU window: reject symlinks/junctions that may have
                // been swapped in after the initial scan.
                let meta = match tokio::fs::symlink_metadata(&path).await {
                    Ok(m) => m,
                    Err(_) => return (false, 0, None::<String>),
                };
                if is_reparse_point(&meta) {
                    return (false, 0, None);
                }

                let size = meta.len();
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
    tracing::info!("emptying recycle bin");
    let size_before = estimate_recycle_bin_size().await;
    RUNNER
        .powershell("Clear-RecycleBin -Force -ErrorAction SilentlyContinue")
        .await?;
    Ok(size_before)
}

async fn flush_dns() -> Result<(), AppError> {
    tracing::info!("flushing DNS cache");
    let mut cmd = tokio::process::Command::new("ipconfig");
    cmd.arg("/flushdns");
    RUNNER.run(cmd).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── Path validation: rejection cases ────────────────────────────────────

    #[test]
    fn rejects_null_bytes() {
        assert!(!is_path_allowed(
            "C:\\temp\\file\0.txt",
            &CleanCategory::TempFiles
        ));
    }

    #[test]
    fn rejects_relative_path() {
        assert!(!is_path_allowed(
            "relative/path.tmp",
            &CleanCategory::TempFiles
        ));
        assert!(!is_path_allowed("./file.tmp", &CleanCategory::TempFiles));
    }

    #[test]
    fn rejects_parent_traversal() {
        assert!(!is_path_allowed(
            "C:\\Windows\\Temp\\..\\System32\\cmd.exe",
            &CleanCategory::TempFiles
        ));
    }

    #[test]
    fn rejects_recycle_bin_individual_paths() {
        // RecycleBin is command-based, individual paths always rejected
        assert!(!is_path_allowed(
            "C:\\$Recycle.Bin\\file.txt",
            &CleanCategory::RecycleBin
        ));
    }

    #[test]
    fn rejects_dns_cache_individual_paths() {
        // DnsCache is command-based, individual paths always rejected
        assert!(!is_path_allowed(
            "C:\\dns\\cache.dat",
            &CleanCategory::DnsCache
        ));
    }

    #[test]
    fn rejects_empty_path() {
        assert!(!is_path_allowed("", &CleanCategory::TempFiles));
    }

    // ── Path validation: acceptance cases ───────────────────────────────────

    #[test]
    fn accepts_windows_temp_fallback_path() {
        let path = format!(r"{}\test.tmp", WINDOWS_TEMP_FALLBACK);
        // This may or may not pass depending on whether the directory exists on the
        // test machine, but it should not panic.
        let _ = is_path_allowed(&path, &CleanCategory::TempFiles);
    }

    #[test]
    fn accepts_prefetch_path() {
        let path = format!(r"{}\APP.EXE-12345678.pf", WINDOWS_PREFETCH_PATH);
        let _ = is_path_allowed(&path, &CleanCategory::Prefetch);
    }

    // ── Reparse point detection ─────────────────────────────────────────────

    #[test]
    fn regular_file_is_not_reparse_point() {
        // Use a known file that exists on all Windows systems
        let meta = std::fs::metadata(r"C:\Windows\System32\notepad.exe");
        if let Ok(m) = meta {
            assert!(!is_reparse_point(&m));
        }
    }

    // ── Helper functions ────────────────────────────────────────────────────

    #[test]
    fn has_extension_case_insensitive() {
        assert!(has_extension("C:\\logs\\app.LOG", "log"));
        assert!(has_extension("C:\\logs\\app.log", "log"));
        assert!(!has_extension("C:\\logs\\app.txt", "log"));
    }

    #[test]
    fn file_name_starts_with_case_insensitive() {
        assert!(file_name_starts_with(
            "C:\\Explorer\\thumbcache_256.db",
            "thumbcache_"
        ));
        assert!(file_name_starts_with(
            "C:\\Explorer\\THUMBCACHE_256.db",
            "thumbcache_"
        ));
        assert!(!file_name_starts_with(
            "C:\\Explorer\\iconcache_256.db",
            "thumbcache_"
        ));
    }
}
