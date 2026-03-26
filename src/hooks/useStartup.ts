import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useNotify } from "./useNotify";

export function useStartup() {
  const { startupItems } = useOptimizerStore();
  const notify = useNotify();

  const {
    isLoading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ["startup-items"],
    queryFn: async () => {
      const items = await optimizerService.getStartupItems();
      useOptimizerStore.getState().setStartupItems(items ?? []);
      return items;
    },
  });

  const error = rawError ? sanitizeError(rawError) : null;

  const toggleStartup = useCallback(
    async (name: string, keyPath: string, enabled: boolean) => {
      try {
        await optimizerService.setStartupEnabled(name, keyPath, enabled);
        useOptimizerStore.getState().updateStartupItem(name, enabled);
        notify(
          enabled ? "optimizer.toast.startupEnabled" : "optimizer.toast.startupDisabled",
          "success",
          { name },
        );
      } catch (err) {
        notify("optimizer.toast.startupFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  return { startupItems, isLoading, error, load: refetch, toggleStartup };
}
