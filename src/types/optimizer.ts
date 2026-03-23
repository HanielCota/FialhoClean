import type { SafetyLevel } from "./common";

export interface StartupItem {
  name: string;
  command: string;
  key_path: string;
  enabled: boolean;
  source: "hkey_current_user" | "hkey_local_machine";
}

export interface ServiceInfo {
  name: string;
  display_name: string;
  status: "running" | "stopped" | "paused" | "unknown";
  start_type: "automatic" | "manual" | "disabled" | "unknown";
  safety_level: SafetyLevel;
  description: string;
}

export type ServiceAction = "enable" | "disable" | "start" | "stop";

export interface PowerPlan {
  guid: string;
  name: string;
  is_active: boolean;
}

export interface HibernateSettings {
  hibernate_enabled: boolean;
  fast_startup_enabled: boolean;
}

export interface NetworkSettings {
  network_throttling_disabled: boolean;
}

export interface ScheduledTask {
  name: string;
  task_path: string;
  state: "Ready" | "Running" | "Disabled" | "Queued" | "Unknown";
  description: string;
}

export interface GpuSettings {
  hags_enabled: boolean;
}

export interface PrivacySettings {
  telemetry_disabled: boolean;
  bing_search_disabled: boolean;
  advertising_id_disabled: boolean;
  activity_history_disabled: boolean;
  location_disabled: boolean;
}

export interface RamOptimizationResult {
  freed_bytes: number;
}
