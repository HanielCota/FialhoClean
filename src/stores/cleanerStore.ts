import { create } from "zustand";
import type { CleanCategory, CleanResult, ScanSummary } from "../types/cleaner";
import { ALL_CATEGORIES } from "../constants/categories";

export type ScanProgressStatus = "pending" | "scanning" | "done" | "error";

const HISTORY_STORAGE_KEY = "fc_clean_history";
const MAX_HISTORY_ENTRIES = 30;

export interface CleanHistoryEntry {
  id: string;
  date: string; // ISO string
  freed_bytes: number;
  deleted_count: number;
  categories: string[];
}

function loadHistory(): CleanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as CleanHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(history: CleanHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage full, ignore
  }
}

interface CleanerState {
  selectedCategories: Set<CleanCategory>;
  scanSummary: ScanSummary | null;
  cleanResult: CleanResult | null;
  isScanning: boolean;
  isCleaning: boolean;
  error: string | null;
  scanProgress: Record<CleanCategory, ScanProgressStatus> | null;
  cleanHistory: CleanHistoryEntry[];

  toggleCategory: (category: CleanCategory) => void;
  selectAllCategories: () => void;
  deselectAllCategories: () => void;
  setSelectedCategories: (cats: CleanCategory[]) => void;
  setScanSummary: (summary: ScanSummary | null) => void;
  setCleanResult: (result: CleanResult | null) => void;
  setIsScanning: (v: boolean) => void;
  setIsCleaning: (v: boolean) => void;
  setError: (err: string | null) => void;
  setScanProgress: (
    progress: Record<CleanCategory, ScanProgressStatus> | null
  ) => void;
  updateCategoryProgress: (
    category: CleanCategory,
    status: ScanProgressStatus
  ) => void;
  addCleanHistory: (entry: Omit<CleanHistoryEntry, "id" | "date">) => void;
  reset: () => void;
}

export const useCleanerStore = create<CleanerState>((set) => ({
  selectedCategories: new Set(ALL_CATEGORIES),
  scanSummary: null,
  cleanResult: null,
  isScanning: false,
  isCleaning: false,
  error: null,
  scanProgress: null,
  cleanHistory: loadHistory(),

  toggleCategory: (category) =>
    set((s) => {
      const next = new Set(s.selectedCategories);
      next.has(category) ? next.delete(category) : next.add(category);
      return { selectedCategories: next };
    }),

  selectAllCategories: () =>
    set({ selectedCategories: new Set(ALL_CATEGORIES) }),

  deselectAllCategories: () =>
    set({ selectedCategories: new Set<CleanCategory>() }),

  setSelectedCategories: (cats) =>
    set({ selectedCategories: new Set(cats) }),

  setScanSummary: (summary) => set({ scanSummary: summary }),
  setCleanResult: (result) => set({ cleanResult: result }),
  setIsScanning: (v) => set({ isScanning: v }),
  setIsCleaning: (v) => set({ isCleaning: v }),
  setError: (err) => set({ error: err }),
  setScanProgress: (progress) => set({ scanProgress: progress }),

  updateCategoryProgress: (category, status) =>
    set((s) => ({
      scanProgress: s.scanProgress
        ? { ...s.scanProgress, [category]: status }
        : null,
    })),

  addCleanHistory: (entry) =>
    set((s) => {
      const newEntry: CleanHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
      };
      const updated = [newEntry, ...s.cleanHistory].slice(0, MAX_HISTORY_ENTRIES);
      saveHistory(updated);
      return { cleanHistory: updated };
    }),

  reset: () =>
    set({
      scanSummary: null,
      cleanResult: null,
      isScanning: false,
      isCleaning: false,
      error: null,
      scanProgress: null,
    }),
}));
