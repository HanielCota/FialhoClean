export interface SystemInfo {
  hostname: string;
  os_version: string; // backend-only
  cpu_usage: number;
  ram_used_bytes: number;
  ram_total_bytes: number;
  uptime_seconds: number;
}

export interface DiskUsage {
  name: string; // backend-only
  mount_point: string; // backend-only
  total_bytes: number;
  used_bytes: number;
  available_bytes: number; // backend-only
  filesystem: string; // backend-only
}
