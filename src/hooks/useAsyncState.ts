export type AsyncStatus = "loading" | "error" | "empty" | "ready";

/**
 * Derives a 4-state async status from loading/error/isEmpty primitives.
 *
 * - "loading": first load in progress, no data yet
 * - "error":   load failed, no data to show
 * - "empty":   loaded successfully but collection is empty
 * - "ready":   has data (may be mid-refresh, but previous data is available)
 */
export function useAsyncState(
  isLoading: boolean,
  error: string | null,
  isEmpty: boolean
): AsyncStatus {
  if (isLoading && isEmpty) return "loading";
  if (error && isEmpty) return "error";
  if (isEmpty) return "empty";
  return "ready";
}
