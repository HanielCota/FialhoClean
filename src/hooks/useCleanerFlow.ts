import { useEffect, useRef } from "react";
import { useCleanerStore } from "../stores/cleanerStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useUiStore } from "../stores/uiStore";
import { useCleaner } from "./useCleaner";

export type CleanerPhase = "select" | "scanning" | "results" | "success";

export const CLEANER_STEP_MAP = {
  select: 1,
  scanning: 2,
  results: 3,
  success: 4,
} as const;

/**
 * Pure function — derives the current phase from store booleans.
 * Extracted so it can be tested independently of React.
 */
export function derivePhase(
  hasCleanResult: boolean,
  isScanning: boolean,
  hasScanSummary: boolean
): CleanerPhase {
  if (hasCleanResult) return "success";
  if (isScanning) return "scanning";
  if (hasScanSummary) return "results";
  return "select";
}

/**
 * Orchestrates the cleaner flow:
 *  - Applies the user's default categories on mount
 *  - Handles the pendingQuickScan trigger from the Dashboard
 *  - Derives the current phase from store state
 *
 * CleanerView only calls this hook — it never accesses cleanerStore directly.
 */
export function useCleanerFlow() {
  const cleaner = useCleaner();
  const { pendingQuickScan, setPendingQuickScan } = useUiStore();
  const { defaultCategories, confirmBeforeCleaning } = useSettingsStore();

  // Capture defaults at mount time so in-progress scans aren't affected
  // by the user changing Settings during the session.
  const initialDefaultCategoriesRef = useRef(defaultCategories);
  useEffect(() => {
    useCleanerStore.getState().setSelectedCategories(initialDefaultCategoriesRef.current);
  }, []);

  // Auto-start scan when triggered from Dashboard Quick Clean.
  useEffect(() => {
    if (!pendingQuickScan) return;
    setPendingQuickScan(false);
    useCleanerStore.getState().selectAllCategories();
    cleaner.scan();
  }, [pendingQuickScan, setPendingQuickScan, cleaner.scan]);

  const phase = derivePhase(
    !!cleaner.cleanResult,
    cleaner.isScanning,
    !!cleaner.scanSummary
  );

  return { ...cleaner, phase, stepMap: CLEANER_STEP_MAP, confirmBeforeCleaning };
}
