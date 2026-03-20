import { useCallback } from "react";
import { useStartup } from "./useStartup";
import { useServices } from "./useServices";
import { usePowerSettings } from "./usePowerSettings";

/**
 * Composite hook that delegates to three focused sub-hooks.
 * Each sub-hook manages only its slice of optimizer state and only
 * reloads its own data — e.g. changeServiceStatus no longer triggers
 * a full reload of startup items and power plans.
 *
 * OptimizerView consumes this hook unchanged.
 */
export function useOptimizer() {
  const startup = useStartup();
  const services = useServices();
  const power = usePowerSettings();

  const loadAll = useCallback(async () => {
    await Promise.all([startup.load(), services.load(), power.load()]);
  }, [startup.load, services.load, power.load]);

  return {
    startupItems: startup.startupItems,
    services: services.services,
    powerPlans: power.powerPlans,
    visualEffectsPerformanceMode: power.visualEffectsPerformanceMode,
    isLoading: startup.isLoading || services.isLoading || power.isLoading,
    error: startup.error || services.error || power.error,
    loadAll,
    toggleStartup: startup.toggleStartup,
    changeServiceStatus: services.changeServiceStatus,
    changePowerPlan: power.changePowerPlan,
    setVisualEffects: power.setVisualEffects,
  };
}
