import { create } from "zustand";
import type { Language } from "../i18n/config";
import {
  loadSettings,
  saveConfirmBeforeCleaning,
  saveDefaultCategories,
  saveLanguage,
} from "../lib/settingsPersistence";
import type { CleanCategory } from "../types/cleaner";

interface SettingsState {
  language: Language;
  confirmBeforeCleaning: boolean;
  defaultCategories: CleanCategory[];
  setLanguage: (lang: Language) => void;
  setConfirmBeforeCleaning: (v: boolean) => void;
  setDefaultCategories: (cats: CleanCategory[]) => void;
}

const { language, confirmBeforeCleaning, defaultCategories } = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
  language,
  confirmBeforeCleaning,
  defaultCategories,
  setLanguage: (lang) => {
    saveLanguage(lang);
    set({ language: lang });
  },
  setConfirmBeforeCleaning: (v) => {
    saveConfirmBeforeCleaning(v);
    set({ confirmBeforeCleaning: v });
  },
  setDefaultCategories: (cats) => {
    saveDefaultCategories(cats);
    set({ defaultCategories: cats });
  },
}));
