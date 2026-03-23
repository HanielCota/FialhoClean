import { create } from "zustand";
import type { AppInfo } from "../types/debloater";

interface DebloaterState {
  apps: AppInfo[];
  selectedApps: Set<string>;
  isLoading: boolean;
  isRemoving: boolean;
  error: string | null;
  lastRemovalCount: number | null;

  setApps: (apps: AppInfo[]) => void;
  toggleApp: (packageFullName: string) => void;
  clearSelection: () => void;
  selectAllApps: () => void;
  removeFromList: (packageFullNames: string[]) => void;
  setIsLoading: (v: boolean) => void;
  setIsRemoving: (v: boolean) => void;
  setError: (err: string | null) => void;
  setLastRemovalCount: (count: number | null) => void;
}

export const useDebloaterStore = create<DebloaterState>((set) => ({
  apps: [],
  selectedApps: new Set(),
  isLoading: false,
  isRemoving: false,
  error: null,
  lastRemovalCount: null,

  setApps: (apps) => set({ apps }),
  toggleApp: (packageFullName) =>
    set((s) => {
      const next = new Set(s.selectedApps);
      next.has(packageFullName) ? next.delete(packageFullName) : next.add(packageFullName);
      return { selectedApps: next };
    }),
  clearSelection: () => set({ selectedApps: new Set() }),
  selectAllApps: () =>
    set((state) => ({
      selectedApps: new Set(state.apps.map((a) => a.package_full_name)),
    })),
  removeFromList: (packageFullNames) =>
    set((s) => ({
      apps: s.apps.filter((a) => !packageFullNames.includes(a.package_full_name)),
      selectedApps: new Set([...s.selectedApps].filter((p) => !packageFullNames.includes(p))),
    })),
  setIsLoading: (v) => set({ isLoading: v }),
  setIsRemoving: (v) => set({ isRemoving: v }),
  setError: (err) => set({ error: err }),
  setLastRemovalCount: (count) => set({ lastRemovalCount: count }),
}));
