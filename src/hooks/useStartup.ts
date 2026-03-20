import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useUiStore } from "../stores/uiStore";

export function useStartup() {
  const { startupItems } = useOptimizerStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await optimizerService.getStartupItems();
      useOptimizerStore.getState().setStartupItems(items);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStartup = useCallback(
    async (name: string, keyPath: string, enabled: boolean) => {
      try {
        await optimizerService.setStartupEnabled(name, keyPath, enabled);
        useOptimizerStore.getState().updateStartupItem(name, enabled);
        addToast(
          enabled
            ? t('optimizer.toast.startupEnabled', { name })
            : t('optimizer.toast.startupDisabled', { name }),
          "success"
        );
      } catch (err) {
        addToast(t('optimizer.toast.startupFailed', { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, t]
  );

  return { startupItems, isLoading, error, load, toggleStartup };
}
