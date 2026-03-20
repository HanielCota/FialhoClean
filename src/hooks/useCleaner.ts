import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { formatBytes } from "../lib/format";
import { cleanerService } from "../services/cleanerService";
import { useCleanerStore } from "../stores/cleanerStore";
import { useUiStore } from "../stores/uiStore";
import type { CleanCategory, FileGroup, ScanSummary } from "../types/cleaner";
import type { ScanProgressStatus } from "../stores/cleanerStore";

export function useCleaner() {
  const store = useCleanerStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();

  // Ref shared between scan() and cancelScan() — no state needed.
  const cancelledRef = useRef(false);

  const scan = useCallback(async () => {
    cancelledRef.current = false;

    // Always read current state — avoids stale closure issues
    const s = useCleanerStore.getState();
    const categories = [...s.selectedCategories] as CleanCategory[];

    s.setIsScanning(true);
    s.setError(null);
    s.setScanSummary(null);
    s.setCleanResult(null);

    // Initialise per-category progress
    const initialProgress = Object.fromEntries(
      categories.map((c) => [c, "pending" as const])
    ) as Record<CleanCategory, ScanProgressStatus>;
    s.setScanProgress(initialProgress);

    const allCategoryResults: ScanSummary["categories"] = [];

    try {
      for (const category of categories) {
        if (cancelledRef.current) break;

        useCleanerStore.getState().updateCategoryProgress(category, "scanning");
        try {
          const result = await cleanerService.scan([category]);

          if (cancelledRef.current) break;

          const catResult = result.categories[0];
          if (catResult) allCategoryResults.push(catResult);
          useCleanerStore.getState().updateCategoryProgress(category, "done");
        } catch {
          useCleanerStore.getState().updateCategoryProgress(category, "error");
        }
      }

      if (!cancelledRef.current) {
        const totalSize = allCategoryResults.reduce(
          (sum, c) => sum + c.total_size_bytes,
          0
        );
        useCleanerStore.getState().setScanSummary({
          categories: allCategoryResults,
          total_size_bytes: totalSize,
        });
      }
    } catch (err) {
      if (!cancelledRef.current) {
        const msg = sanitizeError(err);
        useCleanerStore.getState().setError(msg);
        addToast(t('cleaner.toast.scanFailed', { msg }), "error");
      }
    } finally {
      useCleanerStore.getState().setIsScanning(false);
    }
  }, [addToast, t]);

  // Cancels an in-progress scan and resets all scan state.
  const cancelScan = useCallback(() => {
    cancelledRef.current = true;
    useCleanerStore.getState().reset();
  }, []);

  const clean = useCallback(async () => {
    const s = useCleanerStore.getState();
    if (!s.scanSummary) return;

    s.setIsCleaning(true);
    s.setError(null);

    const fileGroups: FileGroup[] = s.scanSummary.categories
      .filter((c) => c.files.length > 0 || c.category === "recycle_bin")
      .map((c) => ({
        category: c.category,
        paths: c.files.map((f) => f.path),
      }));

    try {
      const result = await cleanerService.clean(fileGroups);
      useCleanerStore.getState().setCleanResult(result);
      // Keep scanSummary — success screen uses it for per-category breakdown
      addToast(
        t('cleaner.toast.cleaned', {
          count: result.deleted_count,
          size: formatBytes(result.freed_bytes),
        }),
        "success"
      );
    } catch (err) {
      const msg = sanitizeError(err);
      useCleanerStore.getState().setError(msg);
      addToast(t('cleaner.toast.cleanFailed', { msg }), "error");
    } finally {
      useCleanerStore.getState().setIsCleaning(false);
    }
  }, [addToast, t]);

  return { scan, clean, cancelScan, ...store };
}
