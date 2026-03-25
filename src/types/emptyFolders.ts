export interface EmptyFolderEntry {
  path: string;
  depth: number;
}

export interface EmptyFolderScanResult {
  folders: EmptyFolderEntry[];
  scanned_roots: string[];
  skipped_permission_count: number;
}

export interface DeleteEmptyFoldersResult {
  deleted_count: number;
  errors: string[];
}
