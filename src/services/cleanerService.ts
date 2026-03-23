import { invoke } from "../lib/invoke";
import type { CleanCategory, CleanResult, FileGroup, ScanSummary } from "../types/cleaner";

export const cleanerService = {
  scan: (categories: CleanCategory[]) => invoke<ScanSummary>("scan_categories", { categories }),

  clean: (fileGroups: FileGroup[]) => invoke<CleanResult>("clean_files", { fileGroups }),
};
