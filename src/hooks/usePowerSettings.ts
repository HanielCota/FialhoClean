import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useUiStore } from "../stores/uiStore";

export function usePowerSettings() {
  const { powerPlans, visualEffectsPerformanceMode } = useOptimizerStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const plans = await optimizerService.getPowerPlans();
      useOptimizerStore.getState().setPowerPlans(plans);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changePowerPlan = useCallback(
    async (planGuid: string) => {
      try {
        await optimizerService.setPowerPlan(planGuid);
        addToast(t('optimizer.toast.powerPlanUpdated'), "success");
        await load();
      } catch (err) {
        addToast(t('optimizer.toast.powerPlanFailed', { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, load, t]
  );

  const setVisualEffects = useCallback(
    async (performanceMode: boolean) => {
      try {
        await optimizerService.setVisualEffects(performanceMode);
        useOptimizerStore.getState().setVisualEffectsPerformanceMode(performanceMode);
        addToast(
          performanceMode
            ? t('optimizer.toast.visualPerformance')
            : t('optimizer.toast.visualRestored'),
          "success"
        );
      } catch (err) {
        addToast(t('optimizer.toast.visualFailed', { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, t]
  );

  const applyUltimatePerformance = useCallback(async () => {
    try {
      await optimizerService.applyUltimatePerformance();
      addToast(t("optimizer.toast.ultimatePerformanceApplied"), "success");
      await load(); // reload to reflect newly active plan
    } catch (err) {
      addToast(
        t("optimizer.toast.powerPlanFailed", { msg: sanitizeError(err) }),
        "error"
      );
    }
  }, [addToast, load, t]);

  return {
    powerPlans,
    visualEffectsPerformanceMode,
    isLoading,
    error,
    load,
    changePowerPlan,
    setVisualEffects,
    applyUltimatePerformance,
  };
}
