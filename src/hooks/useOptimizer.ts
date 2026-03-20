import { useCallback } from "react";
import { useStartup } from "./useStartup";
import { useServices } from "./useServices";
import { usePowerSettings } from "./usePowerSettings";
import { useSystemTweaks } from "./useSystemTweaks";
import { useScheduledTasks } from "./useScheduledTasks";

/**
 * Composite hook that delegates to five focused sub-hooks.
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
  const tweaks = useSystemTweaks();
  const scheduledTasks = useScheduledTasks();

  const loadAll = useCallback(async () => {
    await Promise.all([
      startup.load(),
      services.load(),
      power.load(),
      tweaks.load(),
      scheduledTasks.load(),
    ]);
  }, [startup.load, services.load, power.load, tweaks.load, scheduledTasks.load]);

  return {
    // startup
    startupItems: startup.startupItems,
    toggleStartup: startup.toggleStartup,
    // services
    services: services.services,
    changeServiceStatus: services.changeServiceStatus,
    // power
    powerPlans: power.powerPlans,
    visualEffectsPerformanceMode: power.visualEffectsPerformanceMode,
    changePowerPlan: power.changePowerPlan,
    setVisualEffects: power.setVisualEffects,
    applyUltimatePerformance: power.applyUltimatePerformance,
    // system tweaks
    hibernateSettings: tweaks.hibernateSettings,
    networkSettings: tweaks.networkSettings,
    setHibernate: tweaks.setHibernate,
    setFastStartup: tweaks.setFastStartup,
    applyGameMode: tweaks.applyGameMode,
    setNetworkOptimized: tweaks.setNetworkOptimized,
    // scheduled tasks
    scheduledTasks: scheduledTasks.tasks,
    toggleScheduledTask: scheduledTasks.toggleTask,
    // meta
    isLoading:
      startup.isLoading ||
      services.isLoading ||
      power.isLoading ||
      tweaks.isLoading ||
      scheduledTasks.isLoading,
    error:
      startup.error ||
      services.error ||
      power.error ||
      tweaks.error ||
      scheduledTasks.error,
    loadAll,
  };
}
