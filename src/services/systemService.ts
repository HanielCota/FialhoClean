import { invoke } from "../lib/invoke";
import type { DiskUsage, SystemInfo } from "../types/system";

export const systemService = {
  getSystemInfo: () => invoke<SystemInfo>("get_system_info"),
  getDiskUsage: () => invoke<DiskUsage[]>("get_disk_usage"),
};
