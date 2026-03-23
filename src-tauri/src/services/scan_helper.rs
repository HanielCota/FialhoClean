use crate::errors::AppError;
use crate::models::cleaner::{CategoryScanResult, CleanCategory, FileEntry};
use std::path::Path;

/// Generic scan helper that collects files from one or more paths and handles
/// the repeated Ok/PermissionDenied/Error fallback pattern.
///
/// Replaces ~15 individual scanner functions that all had identical structure.
pub async fn scan_paths(
    category: &CleanCategory,
    paths: &[&str],
    collector: impl Fn(
        &Path,
    ) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<Vec<FileEntry>, AppError>> + Send>,
    >,
) -> Result<CategoryScanResult, AppError> {
    let mut all_files = Vec::new();
    let mut needs_elevation = false;

    for path_str in paths {
        if path_str.is_empty() {
            continue;
        }
        let path = Path::new(path_str);
        match collector(path).await {
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

/// Simplified variant that scans a single path, returning the standard 3-way
/// fallback (success / permission denied / error).
pub async fn scan_single_path(
    category: &CleanCategory,
    collector: impl std::future::Future<Output = Result<Vec<FileEntry>, AppError>>,
) -> Result<CategoryScanResult, AppError> {
    let (files, needs_elevation, error) = match collector.await {
        Ok(files) => (files, false, None),
        Err(AppError::PermissionDenied { .. }) => (vec![], true, None),
        Err(e) => (vec![], false, Some(e.to_string())),
    };

    let total_size_bytes = files.iter().map(|f| f.size_bytes).sum();

    Ok(CategoryScanResult {
        category: category.clone(),
        files,
        total_size_bytes,
        needs_elevation,
        error,
    })
}

/// Empty scan result — for command-based categories (RecycleBin, DnsCache).
pub fn empty_result(category: &CleanCategory) -> CategoryScanResult {
    CategoryScanResult {
        category: category.clone(),
        files: vec![],
        total_size_bytes: 0,
        needs_elevation: false,
        error: None,
    }
}
