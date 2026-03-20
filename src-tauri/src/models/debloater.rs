use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub package_full_name: String,
    pub package_family_name: String,
    pub publisher: String,
    pub version: String,
    pub safety_level: SafetyLevel,
    pub description: String,
    pub category: BloatCategory,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SafetyLevel {
    Safe,
    Caution,
    Dangerous,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BloatCategory {
    Microsoft,
    Communication,
    Entertainment,
    ThirdParty,
    /// OEM manufacturer pre-installs (Dell, HP, Lenovo, ASUS, Acer, MSI, Samsung…)
    Oem,
    /// Trial antivirus and security software bundled by OEMs
    SecurityTrials,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoveResult {
    pub package_full_name: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BloatwareEntry {
    pub family_name_prefix: String,
    pub friendly_name: String,
    pub safety_level: SafetyLevel,
    pub description: String,
    pub category: BloatCategory,
}
