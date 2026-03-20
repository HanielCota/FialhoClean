import { create } from "zustand";
import type { PowerPlan, ServiceInfo, StartupItem } from "../types/optimizer";

interface OptimizerState {
  startupItems: StartupItem[];
  services: ServiceInfo[];
  powerPlans: PowerPlan[];
  visualEffectsPerformanceMode: boolean;

  setStartupItems: (items: StartupItem[]) => void;
  updateStartupItem: (name: string, enabled: boolean) => void;
  setServices: (services: ServiceInfo[]) => void;
  setPowerPlans: (plans: PowerPlan[]) => void;
  setVisualEffectsPerformanceMode: (v: boolean) => void;
}

export const useOptimizerStore = create<OptimizerState>((set) => ({
  startupItems: [],
  services: [],
  powerPlans: [],
  visualEffectsPerformanceMode: false,

  setStartupItems: (items) => set({ startupItems: items }),
  updateStartupItem: (name, enabled) =>
    set((s) => ({
      startupItems: s.startupItems.map((i) =>
        i.name === name ? { ...i, enabled } : i
      ),
    })),
  setServices: (services) => set({ services }),
  setPowerPlans: (plans) => set({ powerPlans: plans }),
  setVisualEffectsPerformanceMode: (v) => set({ visualEffectsPerformanceMode: v }),
}));
