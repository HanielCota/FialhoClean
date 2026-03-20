import { create } from "zustand";
import { TOAST_DURATIONS } from "../constants/ui";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ActiveView = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings";

interface UiState {
  activeView: ActiveView;
  toasts: Toast[];
  pendingQuickScan: boolean;
  setActiveView: (view: ActiveView) => void;
  setPendingQuickScan: (v: boolean) => void;
  addToast: (message: string, type: ToastType) => void;
  addToastDuration: (message: string, type: ToastType, duration: number) => void;
  removeToast: (id: string) => void;
}

// Module-level map so timers survive re-renders and are always cancellable.
const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearToastTimer(id: string) {
  const timer = toastTimers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    toastTimers.delete(id);
  }
}

function scheduleRemoval(
  id: string,
  duration: number,
  set: (fn: (s: UiState) => Partial<UiState>) => void
) {
  const timer = setTimeout(() => {
    toastTimers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  }, duration);
  toastTimers.set(id, timer);
}

export const useUiStore = create<UiState>((set) => ({
  activeView: "dashboard",
  toasts: [],
  pendingQuickScan: false,
  setActiveView: (view) => set({ activeView: view }),
  setPendingQuickScan: (v) => set({ pendingQuickScan: v }),
  addToast: (message, type) => {
    const id = crypto.randomUUID();
    const duration = TOAST_DURATIONS[type];
    set((s) => {
      const nextToasts = [...s.toasts, { id, message, type }];
      if (nextToasts.length <= 3) return { toasts: nextToasts };

      const [oldest, ...visibleToasts] = nextToasts;
      clearToastTimer(oldest.id);
      return { toasts: visibleToasts };
    });
    scheduleRemoval(id, duration, set);
  },
  addToastDuration: (message, type, duration) => {
    const id = crypto.randomUUID();
    set((s) => {
      const nextToasts = [...s.toasts, { id, message, type }];
      if (nextToasts.length <= 3) return { toasts: nextToasts };

      const [oldest, ...visibleToasts] = nextToasts;
      clearToastTimer(oldest.id);
      return { toasts: visibleToasts };
    });
    scheduleRemoval(id, duration, set);
  },
  removeToast: (id) => {
    clearToastTimer(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
