import { ExternalLink, Globe } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { APP_VERSION, GITHUB_ISSUES_URL, GITHUB_URL } from "../../constants/app";
import { ALL_CATEGORIES } from "../../constants/categories";
import { TOAST_DURATIONS } from "../../constants/ui";
import type { Language } from "../../i18n/config";
import { systemService } from "../../services/systemService";
import { useSettingsStore } from "../../stores/settingsStore";
import type { CleanCategory } from "../../types/cleaner";
import { Header } from "../layout/Header";
import { Card } from "../shared/Card";
import { Checkbox } from "../shared/Checkbox";
import { SectionHeading } from "../shared/SectionHeading";
import { Toggle } from "../shared/Toggle";

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
  const confirmLabelId = useId();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    toast.success(t("settings.toast.languageChanged"), { duration: TOAST_DURATIONS.success });
  };

  const handleConfirmToggle = (v: boolean) => {
    setConfirmBeforeCleaning(v);
    toast.success(t("settings.toast.saved"), { duration: TOAST_DURATIONS.success });
  };

  const handleCategoryToggle = (cat: CleanCategory) => {
    const current = defaultCategories ?? [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    setDefaultCategories(next);
    toast.success(t("settings.toast.saved"), { duration: TOAST_DURATIONS.success });
  };

  const categoryLabels: Record<CleanCategory, string> = {
    temp_files: t("cleaner.categories.temp_files.label"),
    browser_cache: t("cleaner.categories.browser_cache.label"),
    recycle_bin: t("cleaner.categories.recycle_bin.label"),
    old_logs: t("cleaner.categories.old_logs.label"),
    prefetch: t("cleaner.categories.prefetch.label"),
    windows_update_cache: t("cleaner.categories.windows_update_cache.label"),
    delivery_optimization: t("cleaner.categories.delivery_optimization.label"),
    windows_error_reports: t("cleaner.categories.windows_error_reports.label"),
    thumbnail_cache: t("cleaner.categories.thumbnail_cache.label"),
    icon_cache: t("cleaner.categories.icon_cache.label"),
    memory_dumps: t("cleaner.categories.memory_dumps.label"),
    discord_cache: t("cleaner.categories.discord_cache.label"),
    spotify_cache: t("cleaner.categories.spotify_cache.label"),
    steam_cache: t("cleaner.categories.steam_cache.label"),
    recent_files: t("cleaner.categories.recent_files.label"),
    dns_cache: t("cleaner.categories.dns_cache.label"),
  };

  return (
    <div className="p-6 xl:p-8">
      <Header title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {/* Section: General */}
      <SectionHeading>{t("settings.sections.general")}</SectionHeading>
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Globe className="h-4 w-4 text-text-muted" />
            <span className="truncate font-medium text-[14px] text-text">
              {t("settings.language.label")}
            </span>
          </div>
          <div
            role="group"
            aria-label={t("settings.language.label")}
            className="flex flex-shrink-0 overflow-hidden rounded-lg border border-white/10"
          >
            {(["pt-BR", "en"] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                aria-pressed={language === lang}
                className={`focus-ring h-9 px-3 font-medium text-[13px] transition-colors ${
                  language === lang
                    ? "bg-accent/10 text-accent"
                    : "bg-card text-text-muted hover:bg-white/5 hover:text-text"
                }`}
              >
                {lang === "pt-BR" ? t("settings.language.ptBR") : t("settings.language.en")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Section: Cleaner */}
      <SectionHeading>{t("settings.sections.cleaner")}</SectionHeading>

      <Card className="mb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p id={confirmLabelId} className="font-medium text-[14px] text-text">
              {t("settings.cleaner.confirmBeforeCleaning")}
            </p>
            <p className="mt-0.5 text-[12px] text-text-muted">
              {t("settings.cleaner.confirmDescription")}
            </p>
          </div>
          <div className="mt-0.5 flex-shrink-0">
            <Toggle
              checked={confirmBeforeCleaning}
              onChange={handleConfirmToggle}
              aria-labelledby={confirmLabelId}
            />
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <p className="mb-0.5 font-medium text-[14px] text-text">
          {t("settings.cleaner.defaultCategories")}
        </p>
        <p className="mb-4 text-[12px] text-text-muted">
          {t("settings.cleaner.defaultCategoriesDescription")}
        </p>
        <div className="space-y-2 border-white/[0.06] border-t pt-3">
          {ALL_CATEGORIES.map((cat) => {
            const checked = defaultCategories?.includes(cat) ?? false;
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
                <span
                  className={`min-w-0 flex-1 select-none text-[13px] ${checked ? "text-text" : "text-text-muted"}`}
                >
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
        <p className="mb-1 font-bold text-[15px] text-text">{t("app.name")}</p>
        <p className="mb-0.5 text-[13px] text-text-muted">
          {t("settings.about.version", { version: APP_VERSION })}
        </p>
        <p className="mb-3 text-[12px] text-text-tertiary">{t("settings.about.builtWith")}</p>
        <div className="flex gap-2 border-white/[0.06] border-t pt-3">
          <button
            type="button"
            onClick={() => systemService.openUrl(GITHUB_ISSUES_URL)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-card-elevated/60 px-3 py-1.5 text-[12px] text-text-muted transition-colors hover:border-white/15 hover:text-text"
          >
            {t("settings.about.reportBug")}
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => systemService.openUrl(GITHUB_URL)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-card-elevated/60 px-3 py-1.5 text-[12px] text-text-muted transition-colors hover:border-white/15 hover:text-text"
          >
            {t("settings.about.github")}
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </Card>
    </div>
  );
}
