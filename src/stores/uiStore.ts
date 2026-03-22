import { create } from "zustand";

type ActiveView = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings";

interface UiState {
  activeView: ActiveView;
  pendingQuickScan: boolean;
  setActiveView: (view: ActiveView) => void;
  setPendingQuickScan: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: "dashboard",
  pendingQuickScan: false,
  setActiveView: (view) => set({ activeView: view }),
  setPendingQuickScan: (v) => set({ pendingQuickScan: v }),
}));
