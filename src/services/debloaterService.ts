import { invoke } from "../lib/invoke";
import type { AppInfo, RemoveResult } from "../types/debloater";

export const debloaterService = {
  getInstalledApps: () => invoke<AppInfo[]>("get_installed_apps"),

  removeApps: (packageFullNames: string[]) =>
    invoke<RemoveResult[]>("remove_apps", { packageFullNames }),
};
