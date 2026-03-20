use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum CleanCategory {
    TempFiles,
    BrowserCache,
    RecycleBin,
    OldLogs,
    Prefetch,
    WindowsUpdateCache,
    DeliveryOptimization,
    WindowsErrorReports,
    ThumbnailCache,
    IconCache,
    MemoryDumps,
    DiscordCache,
    SpotifyCache,
    SteamCache,
    RecentFiles,
    DnsCache,
}

impl CleanCategory {
    pub fn display_name(&self) -> &'static str {
        match self {
            CleanCategory::TempFiles => "Temp Files",
            CleanCategory::BrowserCache => "Browser Cache",
            CleanCategory::RecycleBin => "Recycle Bin",
            CleanCategory::OldLogs => "Old Logs",
            CleanCategory::Prefetch => "Prefetch",
            CleanCategory::WindowsUpdateCache => "Windows Update Cache",
            CleanCategory::DeliveryOptimization => "Delivery Optimization",
            CleanCategory::WindowsErrorReports => "Windows Error Reports",
            CleanCategory::ThumbnailCache => "Thumbnail Cache",
            CleanCategory::IconCache => "Icon Cache",
            CleanCategory::MemoryDumps => "Memory Dumps",
            CleanCategory::DiscordCache => "Discord Cache",
            CleanCategory::SpotifyCache => "Spotify Cache",
            CleanCategory::SteamCache => "Steam Cache",
            CleanCategory::RecentFiles => "Recent Files",
            CleanCategory::DnsCache => "DNS Cache",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub path: String,
    pub size_bytes: u64,
    pub modified_timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryScanResult {
    pub category: CleanCategory,
    pub files: Vec<FileEntry>,
    pub total_size_bytes: u64,
    pub needs_elevation: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanSummary {
    pub categories: Vec<CategoryScanResult>,
    pub total_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanResult {
    pub deleted_count: usize,
    pub skipped_count: usize,
    pub freed_bytes: u64,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileGroup {
    pub category: CleanCategory,
    pub paths: Vec<String>,
}
