import { CheckSquare2, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ALL_CATEGORIES } from "../../constants/categories";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";
import type { CleanCategory } from "../../types/cleaner";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Checkbox } from "../shared/Checkbox";

export function SelectScreen({
  selectedCategories,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onScan,
}: {
  selectedCategories: Set<CleanCategory>;
  onToggle: (cat: CleanCategory) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onScan: () => void;
}) {
  const { t } = useTranslation();
  const noneSelected = !selectedCategories || selectedCategories.size === 0;

  return (
    <div className="p-6 xl:p-8">
      <h1 className="mb-1 font-bold text-[22px] text-text">{t("cleaner.title")}</h1>

      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="max-w-lg text-[13px] text-text-muted">{t("cleaner.subtitle")}</p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSelectAll}
            className="gap-1.5 rounded-full border-white/[0.10] bg-white/[0.05] px-3.5 font-medium text-[11px] tracking-wide hover:border-white/[0.16] hover:bg-white/[0.09]"
          >
            <CheckSquare2 className="h-3.5 w-3.5 text-text" />
            {t("cleaner.selectAll")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            disabled={noneSelected}
            className="gap-1.5 rounded-full px-3.5 font-medium text-[11px] tracking-wide hover:bg-white/[0.05]"
          >
            <X className="h-3.5 w-3.5" />
            {t("cleaner.deselectAll")}
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        {ALL_CATEGORIES.map((cat) => {
          const selected = selectedCategories?.has(cat) ?? false;
          const Icon = CATEGORY_ICONS[cat];
          const needsAdmin = cat === "prefetch";

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onToggle(cat)}
              role="checkbox"
              aria-checked={selected}
              className={`focus-ring flex w-full items-start gap-4 rounded-2xl border p-3 text-left transition-all duration-150 ${
                selected
                  ? "border-accent/20 bg-accent/[0.06]"
                  : "border-white/[0.06] bg-card hover:border-white/[0.10] hover:bg-card-hover"
              }`}
            >
              <Checkbox checked={selected} size="md" shape="circle" className="mt-0.5" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <span className="font-semibold text-[14px] text-text">
                    {t(`cleaner.categories.${cat}.label` as const)}
                  </span>
                  {needsAdmin && <Badge label={t("cleaner.needsAdmin")} variant="warning" />}
                </div>
                <p className="mt-0.5 text-[12px] text-text-muted leading-relaxed">
                  {t(`cleaner.categories.${cat}.description` as const)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={onScan} disabled={noneSelected} className="relative w-full">
        {noneSelected
          ? t("cleaner.scan.button_none")
          : t("cleaner.scan.button", { count: selectedCategories?.size ?? 0 })}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 flex h-4 w-4 -translate-y-1/2 items-center justify-center"
        >
          {!noneSelected ? <ChevronRight className="h-4 w-4" /> : null}
        </span>
      </Button>
    </div>
  );
}
