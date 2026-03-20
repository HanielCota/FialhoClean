import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useUiStore } from "../stores/uiStore";
import type { ServiceAction } from "../types/optimizer";

export function useServices() {
  const { services } = useOptimizerStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const svcs = await optimizerService.getServices();
      useOptimizerStore.getState().setServices(svcs);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeServiceStatus = useCallback(
    async (name: string, action: ServiceAction) => {
      try {
        await optimizerService.setServiceStatus(name, action);
        addToast(t('optimizer.toast.serviceAction', { name, action }), "success");
        await load();
      } catch (err) {
        addToast(t('optimizer.toast.serviceFailed', { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, load, t]
  );

  return { services, isLoading, error, load, changeServiceStatus };
}
