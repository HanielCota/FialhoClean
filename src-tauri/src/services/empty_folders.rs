use crate::errors::AppError;
use crate::models::empty_folders::{
    DeleteEmptyFoldersResult, EmptyFolderEntry, EmptyFolderScanResult,
};
use std::path::{Path, PathBuf};

// ── Safety constants ─────────────────────────────────────────────────────────

/// Max recursion depth when scanning user directories.
const MAX_DEPTH: u32 = 8;

/// Subdirectory names inside %USERPROFILE% that are safe to scan.
/// Cloud storage roots are included because they are fully user-controlled.
const SAFE_SUBDIR_NAMES: &[&str] = &[
    "Desktop",
    "Documents",
    "Downloads",
    "Pictures",
    "Music",
    "Videos",
    "OneDrive",
    "Dropbox",
    "Google Drive",
    "GoogleDrive",
    "iCloudDrive",
    "Box",
    "Nextcloud",
    "3D Objects",
    "Saved Games",
    "Searches",
    "Favorites",
    "Links",
    "Contacts",
];

/// Path fragments that are NEVER safe to touch, even if they appear under
/// %USERPROFILE%.  Checked case-insensitively.
const BLOCKED_PATH_FRAGMENTS: &[&str] = &[
    "AppData",
    "Application Data",
    "Local Settings",
    "NetHood",
    "PrintHood",
    "Recent",
    "SendTo",
    "Start Menu",
    "Templates",
    "MicrosoftEdgeBackups",
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
];

// ── Public API ────────────────────────────────────────────────────────────────

pub async fn scan_empty_folders() -> Result<EmptyFolderScanResult, AppError> {
    tokio::task::spawn_blocking(scan_sync)
        .await
        .map_err(|e| AppError::Custom(e.to_string()))?
}

pub async fn delete_empty_folders(
    paths: Vec<String>,
) -> Result<DeleteEmptyFoldersResult, AppError> {
    tokio::task::spawn_blocking(move || delete_sync(paths))
        .await
        .map_err(|e| AppError::Custom(e.to_string()))?
}

// ── Sync scan implementation ──────────────────────────────────────────────────

fn scan_sync() -> Result<EmptyFolderScanResult, AppError> {
    let user_profile =
        std::env::var("USERPROFILE").map_err(|_| AppError::Custom("USERPROFILE not set".into()))?;
    let profile_path = PathBuf::from(&user_profile);

    // Collect safe scan roots that actually exist on this machine.
    let roots: Vec<PathBuf> = SAFE_SUBDIR_NAMES
        .iter()
        .map(|name| profile_path.join(name))
        .filter(|p| p.is_dir())
        .collect();

    let mut all_folders: Vec<EmptyFolderEntry> = Vec::new();
    let mut skipped_permission_count: u32 = 0;
    let scanned_roots: Vec<String> = roots
        .iter()
        .map(|p| p.to_string_lossy().into_owned())
        .collect();

    for root in &roots {
        collect_empty_dirs(
            root,
            root,
            1,
            &roots,
            &mut all_folders,
            &mut skipped_permission_count,
        );
    }

    // Sort deepest-first so the frontend can display them logically and the
    // delete pass removes children before parents.
    all_folders.sort_by(|a, b| b.path.len().cmp(&a.path.len()));

    Ok(EmptyFolderScanResult {
        folders: all_folders,
        scanned_roots,
        skipped_permission_count,
    })
}

/// Recursively walks `dir`.  Appends any empty sub-directory to `out`.
/// Returns `true` if `dir` itself is empty (no files anywhere in subtree).
fn collect_empty_dirs(
    dir: &Path,
    root: &Path,
    depth: u32,
    allowed_roots: &[PathBuf],
    out: &mut Vec<EmptyFolderEntry>,
    skipped: &mut u32,
) -> bool {
    if depth > MAX_DEPTH {
        return false;
    }

    // Skip reparse points (junctions, symlinks).
    if is_reparse_point(dir) {
        return false;
    }

    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => {
            *skipped += 1;
            return false;
        }
        Err(_) => return false,
    };

    let mut has_file = false;
    let mut all_subdirs_empty = true;

    for entry in entries.flatten() {
        let path = entry.path();
        let ft = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => {
                all_subdirs_empty = false;
                continue;
            }
        };

        if ft.is_symlink() {
            // Symlinks count as "content" — folder is not empty.
            has_file = true;
        } else if ft.is_file() {
            has_file = true;
        } else if ft.is_dir() {
            if has_blocked_fragment(&path) {
                // Treat blocked paths as non-empty so we never touch them.
                all_subdirs_empty = false;
            } else {
                let sub_empty =
                    collect_empty_dirs(&path, root, depth + 1, allowed_roots, out, skipped);
                if !sub_empty {
                    all_subdirs_empty = false;
                }
            }
        }
    }

    let this_dir_empty = !has_file && all_subdirs_empty;

    // Only report non-root directories (we never delete the scan root itself).
    if this_dir_empty && dir != root {
        out.push(EmptyFolderEntry {
            path: dir.to_string_lossy().into_owned(),
            depth,
        });
    }

    this_dir_empty
}

// ── Sync delete implementation ────────────────────────────────────────────────

fn delete_sync(paths: Vec<String>) -> Result<DeleteEmptyFoldersResult, AppError> {
    let user_profile =
        std::env::var("USERPROFILE").map_err(|_| AppError::Custom("USERPROFILE not set".into()))?;
    let profile_path = PathBuf::from(&user_profile);

    let allowed_roots: Vec<PathBuf> = SAFE_SUBDIR_NAMES
        .iter()
        .map(|name| profile_path.join(name))
        .collect();

    // Sort deepest path first (longest string ≈ deepest path).
    let mut sorted = paths.clone();
    sorted.sort_by(|a, b| b.len().cmp(&a.len()));

    let mut deleted_count = 0usize;
    let mut errors: Vec<String> = Vec::new();

    for path_str in &sorted {
        let path = PathBuf::from(path_str);

        // Safety gate — re-validate every path at delete time.
        if !is_safe_delete_target(&path, &allowed_roots) {
            errors.push(format!("Blocked: path is outside allowed roots"));
            continue;
        }

        // remove_dir only succeeds if the directory is truly empty.
        // This is intentional — it is the safest possible delete operation.
        match std::fs::remove_dir(&path) {
            Ok(()) => deleted_count += 1,
            Err(e) => errors.push(format!("Could not remove folder: {e}")),
        }
    }

    Ok(DeleteEmptyFoldersResult {
        deleted_count,
        errors,
    })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn is_reparse_point(path: &Path) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x0400;
    match std::fs::symlink_metadata(path) {
        Ok(meta) => meta.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0,
        Err(_) => false,
    }
}

fn has_blocked_fragment(path: &Path) -> bool {
    let s = path.to_string_lossy().to_lowercase();
    BLOCKED_PATH_FRAGMENTS
        .iter()
        .any(|frag| s.contains(&frag.to_lowercase()))
}

/// Returns `true` if `path` is a subdirectory of one of the allowed roots AND
/// does not contain any blocked fragment.
fn is_safe_delete_target(path: &Path, allowed_roots: &[PathBuf]) -> bool {
    if has_blocked_fragment(path) {
        return false;
    }
    if is_reparse_point(path) {
        return false;
    }
    allowed_roots.iter().any(|root| path.starts_with(root))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocked_fragment_detected() {
        let p = PathBuf::from(r"C:\Users\user\AppData\Local\Something");
        assert!(has_blocked_fragment(&p));
    }

    #[test]
    fn safe_user_path_passes_fragment_check() {
        let p = PathBuf::from(r"C:\Users\user\Documents\EmptyFolder");
        assert!(!has_blocked_fragment(&p));
    }

    #[test]
    fn delete_target_blocked_outside_roots() {
        let roots = vec![PathBuf::from(r"C:\Users\user\Documents")];
        let path = PathBuf::from(r"C:\Users\user\Downloads\foo");
        assert!(!is_safe_delete_target(&path, &roots));
    }

    #[test]
    fn delete_target_allowed_inside_root() {
        let roots = vec![PathBuf::from(r"C:\Users\user\Documents")];
        let path = PathBuf::from(r"C:\Users\user\Documents\Projects\old");
        assert!(is_safe_delete_target(&path, &roots));
    }

    #[test]
    fn delete_target_blocked_appdata_inside_root() {
        // Even if somehow AppData ended up inside Documents, it must be blocked.
        let roots = vec![PathBuf::from(r"C:\Users\user\Documents")];
        let path = PathBuf::from(r"C:\Users\user\Documents\AppData\Roaming");
        assert!(!is_safe_delete_target(&path, &roots));
    }
}
