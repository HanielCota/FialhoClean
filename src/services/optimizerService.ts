import { invoke } from "../lib/invoke";
import type { PowerPlan, ServiceAction, ServiceInfo, StartupItem } from "../types/optimizer";

export const optimizerService = {
  getStartupItems: () => invoke<StartupItem[]>("get_startup_items"),
  getServices: () => invoke<ServiceInfo[]>("get_services"),
  getPowerPlans: () => invoke<PowerPlan[]>("get_power_plans"),

  setStartupEnabled: (name: string, keyPath: string, enabled: boolean) =>
    invoke("set_startup_enabled", { name, keyPath, enabled }),

  setServiceStatus: (name: string, action: ServiceAction) =>
    invoke("set_service_status", { name, action }),

  setPowerPlan: (planGuid: string) =>
    invoke("set_power_plan", { planGuid }),

  setVisualEffects: (performanceMode: boolean) =>
    invoke("set_visual_effects", { performanceMode }),
};
