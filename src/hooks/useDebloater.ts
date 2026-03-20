import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { debloaterService } from "../services/debloaterService";
import { useDebloaterStore } from "../stores/debloaterStore";
import { useUiStore } from "../stores/uiStore";

export function useDebloater() {
  // Subscribe to store for reading state (drives re-renders).
  // Actions are accessed via getState() inside callbacks to keep deps stable
  // and avoid the store-reference-in-deps → infinite useEffect cycle.
  const {
    apps,
    selectedApps,
    isLoading,
    isRemoving,
    error,
    lastRemovalCount,
    toggleApp,
    clearSelection,
    selectAllApps,
    setLastRemovalCount,
  } = useDebloaterStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();

  const loadApps = useCallback(async () => {
    useDebloaterStore.getState().setIsLoading(true);
    useDebloaterStore.getState().setError(null);
    try {
      const apps = await debloaterService.getInstalledApps();
      useDebloaterStore.getState().setApps(apps);
    } catch (err) {
      const msg = sanitizeError(err);
      useDebloaterStore.getState().setError(msg);
      addToast(t('debloater.toast.loadFailed', { msg }), "error");
    } finally {
      useDebloaterStore.getState().setIsLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const removeSelected = useCallback(async () => {
    const toRemove = [...useDebloaterStore.getState().selectedApps];
    if (toRemove.length === 0) return;

    useDebloaterStore.getState().setIsRemoving(true);
    try {
      const results = await debloaterService.removeApps(toRemove);

      const successful = results.filter((r) => r.success).map((r) => r.package_full_name);
      const failed = results.filter((r) => !r.success);

      useDebloaterStore.getState().removeFromList(successful);

      if (successful.length > 0) {
        useDebloaterStore.getState().setLastRemovalCount(successful.length);
      }

      for (const f of failed) {
        addToast(
          t('debloater.toast.removeFailed', {
            name: f.package_full_name,
            error: f.error ? sanitizeError(f.error) : t('common.unknownError'),
          }),
          "error"
        );
      }
    } catch (err) {
      addToast(t('debloater.toast.removalFailed', { msg: sanitizeError(err) }), "error");
    } finally {
      useDebloaterStore.getState().setIsRemoving(false);
    }
  }, [addToast, t]);

  return {
    apps,
    selectedApps,
    isLoading,
    isRemoving,
    error,
    lastRemovalCount,
    loadApps,
    toggleApp,
    clearSelection,
    selectAllApps,
    removeSelected,
    setLastRemovalCount,
  };
}
