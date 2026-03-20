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
