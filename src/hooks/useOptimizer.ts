import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { sanitizeError } from "../lib/errors";
import { formatBytes } from "../lib/format";
import { optimizerService } from "../services/optimizerService";
import { useNotify } from "./useNotify";
import { usePowerSettings } from "./usePowerSettings";
import { useScheduledTasks } from "./useScheduledTasks";
import { useServices } from "./useServices";
import { useStartup } from "./useStartup";
import { useSystemTweaks } from "./useSystemTweaks";

export function useOptimizer() {
  const startup = useStartup();
  const services = useServices();
  const power = usePowerSettings();
  const tweaks = useSystemTweaks();
  const scheduledTasks = useScheduledTasks();
  const notify = useNotify();
  const queryClient = useQueryClient();

  const [isOptimizingRam, setIsOptimizingRam] = useState(false);

  const loadAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["startup-items"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["power-plans"] });
    queryClient.invalidateQueries({ queryKey: ["system-tweaks"] });
    queryClient.invalidateQueries({ queryKey: ["scheduled-tasks"] });
  }, [queryClient]);

  const optimizeRam = useCallback(async () => {
    setIsOptimizingRam(true);
    try {
      const result = await optimizerService.optimizeRam();
      if (result.freed_bytes > 0) {
        notify("optimizer.toast.ramOptimized", "success", {
          size: formatBytes(result.freed_bytes),
        });
      } else {
        notify("optimizer.toast.ramOptimizedNoChange", "info");
      }
    } catch (err) {
      notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
    } finally {
      setIsOptimizingRam(false);
    }
  }, [notify]);

  return {
    startupItems: startup.startupItems,
    toggleStartup: startup.toggleStartup,
    services: services.services,
    changeServiceStatus: services.changeServiceStatus,
    powerPlans: power.powerPlans,
    visualEffectsPerformanceMode: power.visualEffectsPerformanceMode,
    changePowerPlan: power.changePowerPlan,
    setVisualEffects: power.setVisualEffects,
    applyUltimatePerformance: power.applyUltimatePerformance,
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
    optimizeRam,
    isOptimizingRam,
    scheduledTasks: scheduledTasks.tasks,
    toggleScheduledTask: scheduledTasks.toggleTask,
    isLoading:
      startup.isLoading ||
      services.isLoading ||
      power.isLoading ||
      tweaks.isLoading ||
      scheduledTasks.isLoading,
    error: startup.error || services.error || power.error || tweaks.error || scheduledTasks.error,
    loadAll,
  };
}
