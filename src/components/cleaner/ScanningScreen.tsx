import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";
import type { ScanProgressStatus } from "../../stores/cleanerStore";
import type { CleanCategory } from "../../types/cleaner";
import { Button } from "../shared/Button";
import { ItemRow } from "../shared/ItemRow";

interface StatusConfig {
  indicator: ReactNode;
  labelClass: string;
  trailingKey?: "scanning" | "error";
  trailingClass?: string;
}

const STATUS_CONFIG: Record<ScanProgressStatus, StatusConfig> = {
  done: {
    indicator: <CheckCircle2 className="h-5 w-5 text-green" />,
    labelClass: "text-text",
  },
  scanning: {
    indicator: <div className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-accent" />,
    labelClass: "text-text",
    trailingKey: "scanning",
    trailingClass: "text-[12px] text-text-muted animate-pulse-dot",
  },
  pending: {
    indicator: <div className="h-2.5 w-2.5 rounded-full bg-white/20" />,
    labelClass: "text-text-muted",
  },
  error: {
    indicator: <div className="h-2.5 w-2.5 rounded-full bg-white/20" />,
    labelClass: "text-text-muted",
    trailingKey: "error",
    trailingClass:
      "inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold bg-red/[0.15] text-red",
  },
};

export function ScanningScreen({
  selectedCategories,
  scanProgress,
  onCancel,
}: {
  selectedCategories: Set<CleanCategory>;
  scanProgress: Record<CleanCategory, ScanProgressStatus> | null;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const categories = [...selectedCategories] as CleanCategory[];
  const doneCount = scanProgress
    ? Object.values(scanProgress).filter((s) => s === "done" || s === "error").length
    : 0;
  const totalCount = categories.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col items-center p-6 xl:p-8">
      <h1 className="mb-1 text-center font-bold text-[22px] text-text">
        {t("cleaner.scan.title")}
      </h1>
      <p className="mb-6 text-center text-[12px] text-text-muted">{t("cleaner.scan.subtitle")}</p>

      <div className="mb-6 w-full max-w-sm lg:max-w-md">
        <div className="mb-1.5 flex justify-between text-[12px] text-text-muted">
          <span aria-live="polite">
            {t("cleaner.scan.progress", { done: doneCount, total: totalCount })}
          </span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuetext={t("cleaner.scan.progressAria", { done: doneCount, total: totalCount })}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-6 w-full space-y-2" aria-live="polite">
        {categories.map((cat) => {
          const status = scanProgress?.[cat] ?? "pending";
          const Icon = CATEGORY_ICONS[cat];
          const config = STATUS_CONFIG[status];

          return (
            <ItemRow
              key={cat}
              className="border border-white/[0.06] bg-card"
              leading={
                <div className="flex items-center gap-4">
                  <div className="flex h-5 w-5 items-center justify-center">{config.indicator}</div>
                  <Icon className="h-4 w-4 text-text-muted" />
                </div>
              }
              title={t(`cleaner.categories.${cat}.label` as const)}
              titleClass={config.labelClass}
              trailing={
                config.trailingKey ? (
                  <span className={config.trailingClass}>
                    {t(`cleaner.scan.${config.trailingKey}`)}
                  </span>
                ) : undefined
              }
            />
          );
        })}
      </div>

      <Button variant="ghost" onClick={onCancel} size="sm">
        {t("cleaner.scan.cancel")}
      </Button>
    </div>
  );
}
