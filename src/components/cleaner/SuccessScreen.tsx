import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../../lib/errors";
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
  const hasIssues = cleanResult.skipped_count > 0 || cleanResult.errors.length > 0;
  const errorPreview = cleanResult.errors.slice(0, 3).map((error) => sanitizeError(error));

  return (
    <div className="p-6 xl:p-8 flex flex-col items-center text-center">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-scale-in ${
          hasIssues ? "bg-amber-400/[0.15]" : "bg-green/[0.15]"
        }`}
      >
        {hasIssues ? (
          <AlertTriangle className="w-9 h-9 text-amber-400" />
        ) : (
          <CheckCircle2 className="w-9 h-9 text-green" />
        )}
      </div>

      <h1 className="text-[22px] font-bold text-text mb-1">
        {t(
          hasIssues ? "cleaner.success.partialTitle" : "cleaner.success.title",
          { size: formatBytes(cleanResult.freed_bytes) }
        )}
      </h1>
      <p className="text-[12px] text-text-muted mb-6">
        {t(
          hasIssues ? "cleaner.success.partialSubtitle" : "cleaner.success.subtitle",
          {
            files: cleanResult.deleted_count.toLocaleString(),
            deleted: cleanResult.deleted_count.toLocaleString(),
            skipped: cleanResult.skipped_count.toLocaleString(),
            errors: cleanResult.errors.length.toLocaleString(),
          }
        )}
      </p>

      {hasIssues && (
        <div className="w-full rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-left mb-6">
          <p className="text-[13px] font-semibold text-text">
            {t("cleaner.success.partialNotice")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-text">
              {t("cleaner.success.summary.deleted", {
                count: cleanResult.deleted_count,
              })}
            </span>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-text">
              {t("cleaner.success.summary.skipped", {
                count: cleanResult.skipped_count,
              })}
            </span>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-text">
              {t("cleaner.success.summary.errors", {
                count: cleanResult.errors.length,
              })}
            </span>
          </div>
          {errorPreview.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[12px] font-medium text-text">
                {t("cleaner.success.issueHeading")}
              </p>
              {errorPreview.map((error, index) => (
                <p key={`${error}-${index}`} className="text-[12px] text-text-muted">
                  - {error}
                </p>
              ))}
              {cleanResult.errors.length > errorPreview.length && (
                <p className="text-[12px] text-text-muted">
                  {t("cleaner.success.moreIssues", {
                    count: cleanResult.errors.length - errorPreview.length,
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!hasIssues && scanSummary && scanSummary.categories.length > 0 && (
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
