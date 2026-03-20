import type { SafetyLevel } from "../types/common";

/** Maps a safety level to the corresponding Badge variant. */
export function getSafetyVariant(level: SafetyLevel): "success" | "caution" | "error" {
  return level === "safe" ? "success" : level === "caution" ? "caution" : "error";
}
