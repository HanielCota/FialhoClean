/**
 * Strips Windows file paths and technical prefixes from backend error messages
 * so users see something readable instead of "Error: C:\Windows\Prefetch\..."
 */
export function sanitizeError(err: unknown): string {
  if (err == null) {
    return "Unknown error";
  }
  return String(err)
    .replace(/^Error:\s*/i, "")
    .replace(/[a-zA-Z]:\\[^\s,;:)\]"']+/g, "…")
    .replace(/\\\\[^\s,;:)\]"']+/g, "…");
}
