import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useNotify } from "./useNotify";
import type { ServiceAction } from "../types/optimizer";

export function useServices() {
  const { services } = useOptimizerStore();
  const notify = useNotify();

  const { isLoading, error: rawError, refetch } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const svcs = await optimizerService.getServices();
      useOptimizerStore.getState().setServices(svcs);
      return svcs;
    },
  });

  const error = rawError ? sanitizeError(rawError) : null;

  const changeServiceStatus = useCallback(
    async (name: string, action: ServiceAction) => {
      try {
        await optimizerService.setServiceStatus(name, action);
        notify("optimizer.toast.serviceAction", "success", { name, action });
        await refetch();
      } catch (err) {
        notify("optimizer.toast.serviceFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [refetch, notify]
  );

  return { services, isLoading, error, load: refetch, changeServiceStatus };
}
