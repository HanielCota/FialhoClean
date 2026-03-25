import { useCallback, useState } from "react";
import { sanitizeError } from "../lib/errors";
import { emptyFoldersService } from "../services/emptyFoldersService";
import type { DeleteEmptyFoldersResult, EmptyFolderScanResult } from "../types/emptyFolders";
import { useNotify } from "./useNotify";

type Phase = "idle" | "scanning" | "results" | "deleting" | "done";

export function useEmptyFolders() {
  const notify = useNotify();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<EmptyFolderScanResult | null>(null);
  const [deleteResult, setDeleteResult] = useState<DeleteEmptyFoldersResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const scan = useCallback(async () => {
    setPhase("scanning");
    setError(null);
    setScanResult(null);
    setDeleteResult(null);
    setSelected(new Set());

    try {
      const result = await emptyFoldersService.scan();
      setScanResult(result);
      // Auto-select all found folders.
      setSelected(new Set(result.folders.map((f) => f.path)));
      setPhase("results");
    } catch (err) {
      setError(sanitizeError(err));
      setPhase("idle");
    }
  }, []);

  const toggleFolder = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!scanResult) return;
    setSelected(new Set(scanResult.folders.map((f) => f.path)));
  }, [scanResult]);

  const deselectAll = useCallback(() => setSelected(new Set()), []);

  const deleteSelected = useCallback(async () => {
    if (selected.size === 0) return;
    setPhase("deleting");
    setError(null);

    try {
      const result = await emptyFoldersService.delete([...selected]);
      setDeleteResult(result);
      setPhase("done");
      const hasErrors = result.errors.length > 0;
      notify(
        hasErrors ? "emptyFolders.toast.deletedPartial" : "emptyFolders.toast.deleted",
        hasErrors ? "warning" : "success",
        { count: result.deleted_count, errors: result.errors.length },
      );
    } catch (err) {
      setError(sanitizeError(err));
      setPhase("results");
    }
  }, [selected, notify]);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
    setScanResult(null);
    setDeleteResult(null);
    setSelected(new Set());
  }, []);

  return {
    phase,
    error,
    scanResult,
    deleteResult,
    selected,
    scan,
    toggleFolder,
    selectAll,
    deselectAll,
    deleteSelected,
    reset,
  };
}
