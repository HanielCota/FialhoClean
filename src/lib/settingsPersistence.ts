import { ALL_CATEGORIES } from "../constants/categories";
import type { Language } from "../i18n/config";
import { SUPPORTED_LANGUAGES } from "../i18n/config";
import type { CleanCategory } from "../types/cleaner";

export interface PersistedSettings {
  language: Language;
  confirmBeforeCleaning: boolean;
  defaultCategories: CleanCategory[];
}

function loadLanguage(): Language {
  try {
    const raw = localStorage.getItem("fc_lang");
    if (raw && (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)) {
      return raw as Language;
    }
  } catch {
    /* ignore */
  }
  return "pt-BR";
}

function loadConfirm(): boolean {
  try {
    const raw = localStorage.getItem("fc_confirm");
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "boolean") return parsed;
    }
  } catch {
    /* ignore */
  }
  return true;
}

function loadCategories(): CleanCategory[] {
  try {
    const raw = localStorage.getItem("fc_default_cats");
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (c): c is CleanCategory =>
            typeof c === "string" && (ALL_CATEGORIES as readonly string[]).includes(c),
        );
        if (valid.length > 0) return valid;
      }
    }
  } catch {
    /* ignore */
  }
  return ALL_CATEGORIES;
}

/** Reads all persisted settings from localStorage with validation. */
export function loadSettings(): PersistedSettings {
  return {
    language: loadLanguage(),
    confirmBeforeCleaning: loadConfirm(),
    defaultCategories: loadCategories(),
  };
}

export function saveLanguage(lang: Language): void {
  localStorage.setItem("fc_lang", lang);
}

export function saveConfirmBeforeCleaning(v: boolean): void {
  localStorage.setItem("fc_confirm", JSON.stringify(v));
}

export function saveDefaultCategories(cats: CleanCategory[]): void {
  localStorage.setItem("fc_default_cats", JSON.stringify(cats));
}
