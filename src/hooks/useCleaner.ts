import { useCallback, useRef } from "react";
import { sanitizeError } from "../lib/errors";
import { formatBytes } from "../lib/format";
import { cleanerService } from "../services/cleanerService";
import type { ScanProgressStatus } from "../stores/cleanerStore";
import { useCleanerStore } from "../stores/cleanerStore";
import type { CleanCategory, FileGroup, ScanSummary } from "../types/cleaner";
import { useNotify } from "./useNotify";

export function useCleaner() {
  const store = useCleanerStore();
  const notify = useNotify();

  const cancelledRef = useRef(false);

  const scan = useCallback(async () => {
    cancelledRef.current = false;

    const store = useCleanerStore.getState();
    const categories = [...store.selectedCategories] as CleanCategory[];

    store.setIsScanning(true);
    store.setError(null);
    store.setScanSummary(null);
    store.setCleanResult(null);

    const initialProgress = Object.fromEntries(
      categories.map((c) => [c, "pending" as const]),
    ) as Record<CleanCategory, ScanProgressStatus>;
    store.setScanProgress(initialProgress);

    const allCategoryResults: ScanSummary["categories"] = [];

    try {
      for (const category of categories) {
        if (cancelledRef.current) break;

        useCleanerStore.getState().updateCategoryProgress(category, "scanning");
        try {
          const result = await cleanerService.scan([category]);
          if (cancelledRef.current) break;

          const categories = result?.categories;
          if (!categories || categories.length === 0) {
            useCleanerStore.getState().updateCategoryProgress(category, "done");
            continue;
          }
          const catResult = categories[0];
          if (catResult) allCategoryResults.push(catResult);
          useCleanerStore.getState().updateCategoryProgress(category, "done");
        } catch {
          useCleanerStore.getState().updateCategoryProgress(category, "error");
        }
      }

      if (cancelledRef.current) return;
      const totalSize = allCategoryResults.reduce((sum, c) => sum + c.total_size_bytes, 0);
      useCleanerStore.getState().setScanSummary({
        categories: allCategoryResults,
        total_size_bytes: totalSize,
      });
    } catch (err) {
      if (cancelledRef.current) return;
      const msg = sanitizeError(err);
      useCleanerStore.getState().setError(msg);
      notify("cleaner.toast.scanFailed", "error", { msg });
    } finally {
      useCleanerStore.getState().setIsScanning(false);
    }
  }, [notify]);

  const cancelScan = useCallback(() => {
    cancelledRef.current = true;
    useCleanerStore.getState().reset();
  }, []);

  const clean = useCallback(async () => {
    const store = useCleanerStore.getState();
    if (!store.scanSummary) return;

    store.setIsCleaning(true);
    store.setError(null);

    const categories = store.scanSummary?.categories;
    if (!categories) return;

    const fileGroups: FileGroup[] = categories
      .filter((c) => c.files.length > 0 || c.category === "recycle_bin")
      .map((c) => ({
        category: c.category,
        paths: c.files.map((f) => f.path),
      }));

    try {
      const result = await cleanerService.clean(fileGroups);
      if (!result) return;
      useCleanerStore.getState().setCleanResult(result);
      useCleanerStore.getState().addCleanHistory({
        freed_bytes: result.freed_bytes,
        deleted_count: result.deleted_count,
        categories: fileGroups.map((g) => g.category),
      });
      const hasIssues = result.skipped_count > 0 || result.errors.length > 0;
      notify(
        hasIssues ? "cleaner.toast.cleanedPartial" : "cleaner.toast.cleaned",
        hasIssues ? "warning" : "success",
        {
          count: result.deleted_count,
          size: formatBytes(result.freed_bytes),
          skipped: result.skipped_count,
          errors: result.errors.length,
        },
      );
    } catch (err) {
      const msg = sanitizeError(err);
      useCleanerStore.getState().setError(msg);
      notify("cleaner.toast.cleanFailed", "error", { msg });
    } finally {
      useCleanerStore.getState().setIsCleaning(false);
    }
  }, [notify]);

  return { scan, clean, cancelScan, ...store };
}
