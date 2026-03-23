import type { SafetyLevel } from "./common";

export type BloatCategory =
  | "microsoft"
  | "communication"
  | "entertainment"
  | "third_party"
  | "oem"
  | "security_trials";

export interface AppInfo {
  name: string;
  package_full_name: string;
  package_family_name: string; // backend-only
  publisher: string; // backend-only
  version: string; // backend-only
  safety_level: SafetyLevel;
  description: string;
  category: BloatCategory;
}

export interface RemoveResult {
  package_full_name: string;
  success: boolean;
  error: string | null;
}
