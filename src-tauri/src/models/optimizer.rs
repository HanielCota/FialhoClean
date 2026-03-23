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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HibernateSettings {
    pub hibernate_enabled: bool,
    pub fast_startup_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSettings {
    pub network_throttling_disabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledTask {
    pub name: String,
    pub task_path: String,
    pub state: TaskState,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskState {
    Ready,
    Running,
    Disabled,
    Queued,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuSettings {
    pub hags_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacySettings {
    pub telemetry_disabled: bool,
    pub bing_search_disabled: bool,
    pub advertising_id_disabled: bool,
    pub activity_history_disabled: bool,
    pub location_disabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RamOptimizationResult {
    pub freed_bytes: i64,
}
