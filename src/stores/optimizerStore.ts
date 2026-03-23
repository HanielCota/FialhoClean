import { create } from "zustand";
import type {
  GpuSettings,
  HibernateSettings,
  NetworkSettings,
  PowerPlan,
  PrivacySettings,
  ScheduledTask,
  ServiceInfo,
  StartupItem,
} from "../types/optimizer";

interface OptimizerState {
  startupItems: StartupItem[];
  services: ServiceInfo[];
  powerPlans: PowerPlan[];
  visualEffectsPerformanceMode: boolean;
  hibernateSettings: HibernateSettings;
  networkSettings: NetworkSettings;
  scheduledTasks: ScheduledTask[];
  gpuSettings: GpuSettings;
  privacySettings: PrivacySettings;

  setStartupItems: (items: StartupItem[]) => void;
  updateStartupItem: (name: string, enabled: boolean) => void;
  setServices: (services: ServiceInfo[]) => void;
  setPowerPlans: (plans: PowerPlan[]) => void;
  setVisualEffectsPerformanceMode: (v: boolean) => void;
  setHibernateSettings: (s: HibernateSettings) => void;
  setNetworkSettings: (s: NetworkSettings) => void;
  setScheduledTasks: (tasks: ScheduledTask[]) => void;
  setGpuSettings: (s: GpuSettings) => void;
  setPrivacySettings: (s: PrivacySettings) => void;
}

export const useOptimizerStore = create<OptimizerState>((set) => ({
  startupItems: [],
  services: [],
  powerPlans: [],
  visualEffectsPerformanceMode: false,
  hibernateSettings: { hibernate_enabled: false, fast_startup_enabled: false },
  networkSettings: { network_throttling_disabled: false },
  scheduledTasks: [],
  gpuSettings: { hags_enabled: false },
  privacySettings: {
    telemetry_disabled: false,
    bing_search_disabled: false,
    advertising_id_disabled: false,
    activity_history_disabled: false,
    location_disabled: false,
  },

  setStartupItems: (items) => set({ startupItems: items }),
  updateStartupItem: (name, enabled) =>
    set((s) => ({
      startupItems: s.startupItems.map((i) => (i.name === name ? { ...i, enabled } : i)),
    })),
  setServices: (services) => set({ services }),
  setPowerPlans: (plans) => set({ powerPlans: plans }),
  setVisualEffectsPerformanceMode: (v) => set({ visualEffectsPerformanceMode: v }),
  setHibernateSettings: (s) => set({ hibernateSettings: s }),
  setNetworkSettings: (s) => set({ networkSettings: s }),
  setScheduledTasks: (tasks) => set({ scheduledTasks: tasks }),
  setGpuSettings: (s) => set({ gpuSettings: s }),
  setPrivacySettings: (s) => set({ privacySettings: s }),
}));
