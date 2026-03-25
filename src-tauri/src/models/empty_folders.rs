use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmptyFolderEntry {
    /// Absolute path to the empty folder.
    pub path: String,
    /// Nesting depth relative to the scan root (1 = direct child of root).
    pub depth: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmptyFolderScanResult {
    pub folders: Vec<EmptyFolderEntry>,
    /// Human-readable list of roots that were scanned.
    pub scanned_roots: Vec<String>,
    /// How many directories were skipped due to permission errors.
    pub skipped_permission_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteEmptyFoldersResult {
    pub deleted_count: usize,
    pub errors: Vec<String>,
}
