import { invoke } from "../lib/invoke";
import type { DeleteEmptyFoldersResult, EmptyFolderScanResult } from "../types/emptyFolders";

export const emptyFoldersService = {
  scan: () => invoke<EmptyFolderScanResult>("scan_empty_folders"),
  delete: (paths: string[]) => invoke<DeleteEmptyFoldersResult>("delete_empty_folders", { paths }),
};
