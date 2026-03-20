use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupItem {
    pub name: String,
    pub command: String,
    pub key_path: String,
    pub enabled: bool,
    pub source: StartupSource,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StartupSource {
    HkeyCurrentUser,
    HkeyLocalMachine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub name: String,
    pub display_name: String,
    pub status: ServiceStatus,
    pub start_type: StartType,
    pub safety_level: ServiceSafety,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceStatus {
    Running,
    Stopped,
    Paused,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StartType {
    Automatic,
    Manual,
    Disabled,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceSafety {
    Safe,
    Caution,
    NotRecommended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceAction {
    Enable,
    Disable,
    Start,
    Stop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerPlan {
    pub guid: String,
    pub name: String,
    pub is_active: bool,
}
