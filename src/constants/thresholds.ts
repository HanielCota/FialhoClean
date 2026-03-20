/** Usage % at which a resource bar turns orange. */
export const USAGE_WARNING = 70;

/** Usage % at which a resource bar turns red. */
export const USAGE_CRITICAL = 90;

/**
 * Disk usage % threshold for the Dashboard health indicator (turns red).
 * Intentionally lower than USAGE_CRITICAL: the health label reacts earlier
 * than the per-bar color to prompt the user to run a clean.
 */
export const DISK_HEALTH_CRITICAL = 85;
