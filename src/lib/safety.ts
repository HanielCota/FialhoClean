import type { SafetyLevel } from "../types/common";

/** Maps a safety level to the corresponding Badge variant. */
export function getSafetyVariant(level: SafetyLevel): "success" | "caution" | "error" {
  if (level === "safe") {
    return "success";
  }
  if (level === "caution") {
    return "caution";
  }
  return "error";
}
