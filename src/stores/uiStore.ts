import { create } from "zustand";

type ActiveView = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings";

const SIDEBAR_KEY = "fialho:sidebar-collapsed";

interface UiState {
  activeView: ActiveView;
  pendingQuickScan: boolean;
  sidebarCollapsed: boolean;
  setActiveView: (view: ActiveView) => void;
  setPendingQuickScan: (v: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: "dashboard",
  pendingQuickScan: false,
  sidebarCollapsed: localStorage.getItem(SIDEBAR_KEY) === "1",
  setActiveView: (view) => set({ activeView: view }),
  setPendingQuickScan: (v) => set({ pendingQuickScan: v }),
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return { sidebarCollapsed: next };
    }),
}));
