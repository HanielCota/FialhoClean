import type { SafetyLevel } from "./common";
export type { SafetyLevel };

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
  package_family_name: string;
  publisher: string;
  version: string;
  safety_level: SafetyLevel;
  description: string;
  category: BloatCategory;
}

export interface RemoveResult {
  package_full_name: string;
  success: boolean;
  error: string | null;
}

export interface BloatwareEntry {
  family_name_prefix: string;
  friendly_name: string;
  safety_level: SafetyLevel;
  description: string;
  category: BloatCategory;
}
