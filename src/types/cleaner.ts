export type CleanCategory =
  | "temp_files"
  | "browser_cache"
  | "recycle_bin"
  | "old_logs"
  | "prefetch"
  | "windows_update_cache"
  | "delivery_optimization"
  | "windows_error_reports"
  | "thumbnail_cache"
  | "icon_cache"
  | "memory_dumps"
  | "discord_cache"
  | "spotify_cache"
  | "steam_cache"
  | "recent_files"
  | "dns_cache";

export interface FileEntry {
  path: string;
  size_bytes: number;
  modified_timestamp: number;
}

export interface CategoryScanResult {
  category: CleanCategory;
  files: FileEntry[];
  total_size_bytes: number;
  needs_elevation: boolean;
  error: string | null;
}

export interface ScanSummary {
  categories: CategoryScanResult[];
  total_size_bytes: number;
}

export interface CleanResult {
  deleted_count: number;
  skipped_count: number;
  freed_bytes: number;
  errors: string[];
}

export interface FileGroup {
  category: CleanCategory;
  paths: string[];
}

