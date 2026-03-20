import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useUiStore } from "../stores/uiStore";
import { useStartup } from "./useStartup";
import { useServices } from "./useServices";
import { usePowerSettings } from "./usePowerSettings";
import { useSystemTweaks } from "./useSystemTweaks";
import { useScheduledTasks } from "./useScheduledTasks";

export function useOptimizer() {
  const startup = useStartup();
  const services = useServices();
  const power = usePowerSettings();
  const tweaks = useSystemTweaks();
  const scheduledTasks = useScheduledTasks();
  const { addToast } = useUiStore();
  const { t } = useTranslation();

  const [isOptimizingRam, setIsOptimizingRam] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([
      startup.load(),
      services.load(),
      power.load(),
      tweaks.load(),
      scheduledTasks.load(),
    ]);
  }, [startup.load, services.load, power.load, tweaks.load, scheduledTasks.load]);

  const optimizeRam = useCallback(async () => {
    setIsOptimizingRam(true);
    try {
      const result = await optimizerService.optimizeRam();
      const { formatBytes } = await import("../lib/format");
      if (result.freed_bytes > 0) {
        addToast(t("optimizer.toast.ramOptimized", { size: formatBytes(result.freed_bytes) }), "success");
      } else {
        addToast(t("optimizer.toast.ramOptimizedNoChange"), "info");
      }
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    } finally {
      setIsOptimizingRam(false);
    }
  }, [addToast, t]);

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
    gpuSettings: tweaks.gpuSettings,
    privacySettings: tweaks.privacySettings,
    setHibernate: tweaks.setHibernate,
    setFastStartup: tweaks.setFastStartup,
    applyGameMode: tweaks.applyGameMode,
    setNetworkOptimized: tweaks.setNetworkOptimized,
    setGpuHags: tweaks.setGpuHags,
    setPrivacy: tweaks.setPrivacy,
    // RAM
    optimizeRam,
    isOptimizingRam,
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
