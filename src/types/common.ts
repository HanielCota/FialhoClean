/**
 * Shared safety classification used across Debloater and Optimizer modules.
 *
 * Semantic note: "dangerous" (apps) and "not_recommended" (services) are
 * distinct concepts — "dangerous" means risk of system instability from
 * removing the app; "not_recommended" means the service is not safe to
 * disable for non-expert users. Both map to the "error" badge variant.
 */
export type SafetyLevel = "safe" | "caution" | "dangerous" | "not_recommended";
