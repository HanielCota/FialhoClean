import { CheckCircle2, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CleanResult, ScanSummary } from "../../types/cleaner";
import { Button } from "../shared/Button";
import { SectionHeading } from "../shared/SectionHeading";
import { ActionCard } from "../shared/ActionCard";
import { formatBytes } from "../../lib/format";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";

export function SuccessScreen({
  cleanResult,
  scanSummary,
  onDashboard,
  onDebloater,
  onScanAgain,
}: {
  cleanResult: CleanResult;
  scanSummary: ScanSummary | null;
  onDashboard: () => void;
  onDebloater: () => void;
  onScanAgain: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="p-6 xl:p-8 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-green/[0.15] flex items-center justify-center mb-4 animate-scale-in">
        <CheckCircle2 className="w-9 h-9 text-green" />
      </div>

      <h1 className="text-[22px] font-bold text-text mb-1">
        {t("cleaner.success.title", { size: formatBytes(cleanResult.freed_bytes) })}
      </h1>
      <p className="text-[12px] text-text-muted mb-6">
        {t("cleaner.success.subtitle", { files: cleanResult.deleted_count.toLocaleString() })}
      </p>

      {scanSummary && scanSummary.categories.length > 0 && (
        <div className="w-full bg-card border border-white/[0.06] rounded-xl overflow-hidden mb-6">
          {scanSummary.categories.map((cat, i) => {
            const Icon = CATEGORY_ICONS[cat.category];
            return (
              <div
                key={cat.category}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < scanSummary.categories.length - 1 ? "border-b border-white/[0.06]" : ""
                }`}
              >
                <Icon className="w-4 h-4 text-text-muted" />
                <span className="flex-1 text-[14px] text-text text-left">
                  {t(`cleaner.categories.${cat.category}.label` as const)}
                </span>
                <span className="text-[12px] text-text-muted mr-2">
                  {t("cleaner.success.freed", { size: formatBytes(cat.total_size_bytes) })}
                </span>
                <CheckCircle2 className="w-4 h-4 text-green" />
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={onDashboard} className="w-full mb-2">
        {t("cleaner.success.backToDashboard")}
      </Button>
      <Button variant="ghost" onClick={onScanAgain} className="w-full mb-3">
        {t("cleaner.success.scanAgain")}
      </Button>

      <div className="w-full">
        <SectionHeading className="text-left">
          {t("cleaner.success.upsell.sectionTitle")}
        </SectionHeading>
        <ActionCard
          icon={Shield}
          title={t("cleaner.success.upsell.title")}
          description={t("cleaner.success.upsell.description")}
          onClick={onDebloater}
        />
      </div>
    </div>
  );
}
