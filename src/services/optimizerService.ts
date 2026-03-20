import { invoke } from "../lib/invoke";
import type {
  GpuSettings,
  HibernateSettings,
  NetworkSettings,
  PowerPlan,
  PrivacySettings,
  RamOptimizationResult,
  ScheduledTask,
  ServiceAction,
  ServiceInfo,
  StartupItem,
} from "../types/optimizer";

export const optimizerService = {
  // Startup
  getStartupItems: () => invoke<StartupItem[]>("get_startup_items"),
  setStartupEnabled: (name: string, keyPath: string, enabled: boolean) =>
    invoke("set_startup_enabled", { name, keyPath, enabled }),

  // Services
  getServices: () => invoke<ServiceInfo[]>("get_services"),
  setServiceStatus: (name: string, action: ServiceAction) =>
    invoke("set_service_status", { name, action }),

  // Power plans
  getPowerPlans: () => invoke<PowerPlan[]>("get_power_plans"),
  setPowerPlan: (planGuid: string) => invoke("set_power_plan", { planGuid }),
  setVisualEffects: (performanceMode: boolean) =>
    invoke("set_visual_effects", { performanceMode }),

  // Hibernate / fast startup
  getHibernateSettings: () => invoke<HibernateSettings>("get_hibernate_settings"),
  setHibernate: (enabled: boolean) => invoke("set_hibernate", { enabled }),
  setFastStartup: (enabled: boolean) => invoke("set_fast_startup", { enabled }),

  // Game mode preset
  applyGameModePreset: () => invoke("apply_game_mode_preset"),

  // Ultimate Performance power plan
  applyUltimatePerformance: () => invoke("apply_ultimate_performance"),

  // Network optimizer
  getNetworkSettings: () => invoke<NetworkSettings>("get_network_settings"),
  setNetworkOptimized: (enabled: boolean) =>
    invoke("set_network_optimized", { enabled }),

  // Scheduled tasks
  getScheduledTasks: () => invoke<ScheduledTask[]>("get_scheduled_tasks"),
  setScheduledTaskEnabled: (taskPath: string, enabled: boolean) =>
    invoke("set_scheduled_task_enabled", { taskPath, enabled }),

  // GPU HAGS
  getGpuSettings: () => invoke<GpuSettings>("get_gpu_settings"),
  setGpuHags: (enabled: boolean) => invoke("set_gpu_hags", { enabled }),

  // Privacy
  getPrivacySettings: () => invoke<PrivacySettings>("get_privacy_settings"),
  setPrivacySetting: (settingKey: string, disabled: boolean) =>
    invoke("set_privacy_setting", { settingKey, disabled }),

  // RAM
  optimizeRam: () => invoke<RamOptimizationResult>("optimize_ram"),
};
