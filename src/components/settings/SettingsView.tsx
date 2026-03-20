import { Globe } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { APP_VERSION } from "../../constants/app";
import type { Language } from "../../i18n/config";
import type { CleanCategory } from "../../types/cleaner";
import { useSettingsStore } from "../../stores/settingsStore";
import { useUiStore } from "../../stores/uiStore";
import { ALL_CATEGORIES } from "../../constants/categories";
import { Card } from "../shared/Card";
import { Checkbox } from "../shared/Checkbox";
import { SectionHeading } from "../shared/SectionHeading";
import { Toggle } from "../shared/Toggle";
import { Header } from "../layout/Header";

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const {
    language,
    confirmBeforeCleaning,
    defaultCategories,
    setLanguage,
    setConfirmBeforeCleaning,
    setDefaultCategories,
  } = useSettingsStore();
  const { addToast } = useUiStore();
  const confirmLabelId = useId();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    addToast(t('settings.toast.languageChanged'), 'success');
  };

  const handleConfirmToggle = (v: boolean) => {
    setConfirmBeforeCleaning(v);
    addToast(t('settings.toast.saved'), 'success');
  };

  const handleCategoryToggle = (cat: CleanCategory) => {
    if (defaultCategories.includes(cat)) {
      setDefaultCategories(defaultCategories.filter((c) => c !== cat));
    } else {
      setDefaultCategories([...defaultCategories, cat]);
    }
    addToast(t('settings.toast.saved'), 'success');
  };

  const categoryLabels: Record<CleanCategory, string> = {
    temp_files:               t("cleaner.categories.temp_files.label"),
    browser_cache:            t("cleaner.categories.browser_cache.label"),
    recycle_bin:              t("cleaner.categories.recycle_bin.label"),
    old_logs:                 t("cleaner.categories.old_logs.label"),
    prefetch:                 t("cleaner.categories.prefetch.label"),
    windows_update_cache:     t("cleaner.categories.windows_update_cache.label"),
    delivery_optimization:    t("cleaner.categories.delivery_optimization.label"),
    windows_error_reports:    t("cleaner.categories.windows_error_reports.label"),
    thumbnail_cache:          t("cleaner.categories.thumbnail_cache.label"),
    icon_cache:               t("cleaner.categories.icon_cache.label"),
    memory_dumps:             t("cleaner.categories.memory_dumps.label"),
    discord_cache:            t("cleaner.categories.discord_cache.label"),
    spotify_cache:            t("cleaner.categories.spotify_cache.label"),
    steam_cache:              t("cleaner.categories.steam_cache.label"),
    recent_files:             t("cleaner.categories.recent_files.label"),
    dns_cache:                t("cleaner.categories.dns_cache.label"),
  };

  return (
    <div className="p-6 xl:p-8">
      <Header
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      {/* Section: General */}
      <SectionHeading>{t("settings.sections.general")}</SectionHeading>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-text-muted" />
            <span className="text-[14px] font-medium text-text">
              {t("settings.language.label")}
            </span>
          </div>
          <div
            role="group"
            aria-label={t("settings.language.label")}
            className="flex overflow-hidden rounded-lg border border-white/10"
          >
            {(["pt-BR", "en"] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                aria-pressed={language === lang}
                className={`focus-ring h-9 px-3 text-[13px] font-medium transition-colors ${
                  language === lang
                    ? "bg-accent/10 text-accent"
                    : "bg-card text-text-muted hover:text-text hover:bg-white/5"
                }`}
              >
                {lang === "pt-BR"
                  ? t("settings.language.ptBR")
                  : t("settings.language.en")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Section: Cleaner */}
      <SectionHeading>{t("settings.sections.cleaner")}</SectionHeading>

      <Card className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p id={confirmLabelId} className="text-[14px] font-medium text-text">
              {t("settings.cleaner.confirmBeforeCleaning")}
            </p>
            <p className="text-[12px] text-text-muted mt-0.5">
              {t("settings.cleaner.confirmDescription")}
            </p>
          </div>
          <Toggle
            checked={confirmBeforeCleaning}
            onChange={handleConfirmToggle}
            aria-labelledby={confirmLabelId}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <p className="text-[14px] font-medium text-text mb-0.5">
          {t("settings.cleaner.defaultCategories")}
        </p>
        <p className="text-[12px] text-text-muted mb-4">
          {t("settings.cleaner.defaultCategoriesDescription")}
        </p>
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          {ALL_CATEGORIES.map((cat) => {
            const checked = defaultCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => handleCategoryToggle(cat)}
                className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                  checked
                    ? "border-accent/20 bg-accent/[0.06]"
                    : "border-white/[0.06] bg-card-elevated/60 hover:border-white/10 hover:bg-card-hover"
                }`}
              >
                <Checkbox checked={checked} />
                <span className={`select-none text-[13px] ${checked ? "text-text" : "text-text-muted"}`}>
                  {categoryLabels[cat]}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Section: About */}
      <SectionHeading>{t("settings.sections.about")}</SectionHeading>
      <Card className="border-white/[0.06]">
        <p className="text-[15px] font-bold text-text mb-1">{t('app.name')}</p>
        <p className="text-[13px] text-text-muted mb-0.5">
          {t("settings.about.version", { version: APP_VERSION })}
        </p>
        <p className="text-[12px] text-text-tertiary">
          {t("settings.about.builtWith")}
        </p>
      </Card>
    </div>
  );
}
