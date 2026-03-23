import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { debloaterService } from "../services/debloaterService";
import { useDebloaterStore } from "../stores/debloaterStore";
import { useNotify } from "./useNotify";

export function useDebloater() {
  const {
    apps,
    selectedApps,
    isRemoving,
    lastRemovalCount,
    toggleApp,
    clearSelection,
    selectAllApps,
    setLastRemovalCount,
  } = useDebloaterStore();
  const notify = useNotify();
  const { t } = useTranslation();

  const {
    isLoading,
    error: rawError,
    refetch: loadApps,
  } = useQuery({
    queryKey: ["bloatware-apps"],
    queryFn: async () => {
      const apps = await debloaterService.getInstalledApps();
      useDebloaterStore.getState().setApps(apps);
      return apps;
    },
  });

  const error = rawError ? sanitizeError(rawError) : null;

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
        notify("debloater.toast.removeFailed", "error", {
          name: f.package_full_name,
          error: f.error ? sanitizeError(f.error) : t("common.unknownError"),
        });
      }
    } catch (err) {
      notify("debloater.toast.removalFailed", "error", { msg: sanitizeError(err) });
    } finally {
      useDebloaterStore.getState().setIsRemoving(false);
    }
  }, [notify, t]);

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
