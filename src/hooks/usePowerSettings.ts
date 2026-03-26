import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useNotify } from "./useNotify";

export function usePowerSettings() {
  const { powerPlans, visualEffectsPerformanceMode } = useOptimizerStore();
  const notify = useNotify();

  const {
    isLoading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ["power-plans"],
    queryFn: async () => {
      const plans = await optimizerService.getPowerPlans();
      useOptimizerStore.getState().setPowerPlans(plans ?? []);
      return plans;
    },
  });

  const error = rawError ? sanitizeError(rawError) : null;

  const changePowerPlan = useCallback(
    async (planGuid: string) => {
      try {
        await optimizerService.setPowerPlan(planGuid);
        notify("optimizer.toast.powerPlanUpdated", "success");
        await refetch();
      } catch (err) {
        notify("optimizer.toast.powerPlanFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [refetch, notify],
  );

  const setVisualEffects = useCallback(
    async (performanceMode: boolean) => {
      try {
        await optimizerService.setVisualEffects(performanceMode);
        useOptimizerStore.getState().setVisualEffectsPerformanceMode(performanceMode);
        notify(
          performanceMode ? "optimizer.toast.visualPerformance" : "optimizer.toast.visualRestored",
          "success",
        );
      } catch (err) {
        notify("optimizer.toast.visualFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  const applyUltimatePerformance = useCallback(async () => {
    try {
      await optimizerService.applyUltimatePerformance();
      notify("optimizer.toast.ultimatePerformanceApplied", "success");
      await refetch();
    } catch (err) {
      notify("optimizer.toast.powerPlanFailed", "error", { msg: sanitizeError(err) });
    }
  }, [refetch, notify]);

  return {
    powerPlans,
    visualEffectsPerformanceMode,
    isLoading,
    error,
    load: refetch,
    changePowerPlan,
    setVisualEffects,
    applyUltimatePerformance,
  };
}
