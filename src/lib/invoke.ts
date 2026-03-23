import { invoke as tauriInvoke } from "@tauri-apps/api/core";

/**
 * Typed wrapper around Tauri's invoke. The generic `T` is trusted at compile
 * time only — there is no runtime validation of the response shape. Keep
 * TypeScript types in `src/types/` in sync with the corresponding Rust
 * structs in `src-tauri/src/models/` to avoid silent runtime failures.
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return tauriInvoke<T>(cmd, args);
}
