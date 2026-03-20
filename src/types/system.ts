export interface SystemInfo {
  hostname: string;
  os_version: string;
  cpu_usage: number;
  ram_used_bytes: number;
  ram_total_bytes: number;
  uptime_seconds: number;
}

export interface DiskUsage {
  name: string;
  mount_point: string;
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  filesystem: string;
}
