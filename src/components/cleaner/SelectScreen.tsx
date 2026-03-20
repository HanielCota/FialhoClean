import { CheckSquare2, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CleanCategory } from "../../types/cleaner";
import { ALL_CATEGORIES } from "../../constants/categories";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Checkbox } from "../shared/Checkbox";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";

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
  const noneSelected = selectedCategories.size === 0;

  return (
    <div className="p-6 xl:p-8">
      <h1 className="text-[22px] font-bold text-text mb-1">{t("cleaner.title")}</h1>

      <div className="mb-6 flex items-start justify-between gap-3">
        <p className="max-w-lg text-[13px] text-text-muted">{t("cleaner.subtitle")}</p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSelectAll}
            className="rounded-full px-3.5 gap-1.5 text-[11px] font-medium tracking-wide border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.16]"
          >
            <CheckSquare2 className="w-3.5 h-3.5 text-text" />
            {t("cleaner.selectAll")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            disabled={noneSelected}
            className="rounded-full px-3.5 gap-1.5 text-[11px] font-medium tracking-wide hover:bg-white/[0.05]"
          >
            <X className="w-3.5 h-3.5" />
            {t("cleaner.deselectAll")}
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {ALL_CATEGORIES.map((cat) => {
          const selected = selectedCategories.has(cat);
          const Icon = CATEGORY_ICONS[cat];
          const needsAdmin = cat === "prefetch";

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onToggle(cat)}
              role="checkbox"
              aria-checked={selected}
              className={`focus-ring flex w-full items-start gap-4 rounded-xl border p-3 text-left transition-all duration-150 ${
                selected
                  ? "border-accent/20 bg-accent/[0.06]"
                  : "border-white/[0.06] bg-card hover:border-white/[0.10] hover:bg-card-hover"
              }`}
            >
              <Checkbox checked={selected} size="md" shape="circle" className="mt-0.5" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Icon className="w-4 h-4 text-text-muted" />
                  <span className="text-[14px] font-semibold text-text">
                    {t(`cleaner.categories.${cat}.label` as const)}
                  </span>
                  {needsAdmin && (
                    <Badge label={t("cleaner.needsAdmin")} variant="warning" />
                  )}
                </div>
                <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">
                  {t(`cleaner.categories.${cat}.description` as const)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={onScan} disabled={noneSelected} className="w-full">
        {noneSelected
          ? t("cleaner.scan.button_none")
          : t("cleaner.scan.button", { count: selectedCategories.size })}
        {!noneSelected && <ChevronRight className="w-4 h-4" />}
      </Button>
    </div>
  );
}
