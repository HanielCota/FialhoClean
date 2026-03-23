import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";
import { sanitizeError } from "../../lib/errors";
import { formatBytes } from "../../lib/format";
import type { CleanResult, ScanSummary } from "../../types/cleaner";
import { ActionCard } from "../shared/ActionCard";
import { Button } from "../shared/Button";
import { SectionHeading } from "../shared/SectionHeading";

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
  const hasIssues = (cleanResult?.skipped_count ?? 0) > 0 || (cleanResult?.errors?.length ?? 0) > 0;
  const errorPreview = (cleanResult?.errors ?? []).slice(0, 3).map((error) => sanitizeError(error));

  return (
    <div className="flex flex-col items-center p-6 text-center xl:p-8">
      <div
        className={`mb-4 flex h-16 w-16 animate-scale-in items-center justify-center rounded-full ${
          hasIssues ? "bg-amber-400/[0.15]" : "bg-green/[0.15]"
        }`}
      >
        {hasIssues ? (
          <AlertTriangle className="h-9 w-9 text-amber-400" />
        ) : (
          <CheckCircle2 className="h-9 w-9 text-green" />
        )}
      </div>

      <h1 className="mb-1 font-bold text-[22px] text-text">
        {t(hasIssues ? "cleaner.success.partialTitle" : "cleaner.success.title", {
          size: formatBytes(cleanResult?.freed_bytes ?? 0),
        })}
      </h1>
      <p className="mb-6 text-[12px] text-text-muted">
        {t(hasIssues ? "cleaner.success.partialSubtitle" : "cleaner.success.subtitle", {
          files: (cleanResult?.deleted_count ?? 0).toLocaleString(),
          deleted: (cleanResult?.deleted_count ?? 0).toLocaleString(),
          skipped: (cleanResult?.skipped_count ?? 0).toLocaleString(),
          errors: (cleanResult?.errors?.length ?? 0).toLocaleString(),
        })}
      </p>

      {hasIssues && (
        <div className="mb-6 w-full rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-left">
          <p className="font-semibold text-[13px] text-text">
            {t("cleaner.success.partialNotice")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-text">
              {t("cleaner.success.summary.deleted", {
                count: cleanResult?.deleted_count ?? 0,
              })}
            </span>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-text">
              {t("cleaner.success.summary.skipped", {
                count: cleanResult?.skipped_count ?? 0,
              })}
            </span>
            <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-text">
              {t("cleaner.success.summary.errors", {
                count: cleanResult?.errors?.length ?? 0,
              })}
            </span>
          </div>
          {errorPreview?.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="font-medium text-[12px] text-text">
                {t("cleaner.success.issueHeading")}
              </p>
              {errorPreview.map((error, index) => (
                <p key={`${error}-${index}`} className="text-[12px] text-text-muted">
                  - {error}
                </p>
              ))}
              {(cleanResult?.errors?.length ?? 0) > errorPreview.length && (
                <p className="text-[12px] text-text-muted">
                  {t("cleaner.success.moreIssues", {
                    count: (cleanResult?.errors?.length ?? 0) - errorPreview.length,
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!hasIssues && scanSummary?.categories && scanSummary.categories.length > 0 && (
        <div className="mb-6 w-full overflow-hidden rounded-xl border border-white/[0.06] bg-card">
          {scanSummary.categories.map((cat, i) => {
            const Icon = CATEGORY_ICONS[cat.category];
            return (
              <div
                key={cat.category}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < scanSummary.categories.length - 1 ? "border-white/[0.06] border-b" : ""
                }`}
              >
                <Icon className="h-4 w-4 text-text-muted" />
                <span className="flex-1 text-left text-[14px] text-text">
                  {t(`cleaner.categories.${cat.category}.label` as const)}
                </span>
                <span className="mr-2 text-[12px] text-text-muted">
                  {t("cleaner.success.freed", { size: formatBytes(cat.total_size_bytes) })}
                </span>
                <CheckCircle2 className="h-4 w-4 text-green" />
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={onDashboard} className="mb-2 w-full">
        {t("cleaner.success.backToDashboard")}
      </Button>
      <Button variant="ghost" onClick={onScanAgain} className="mb-3 w-full">
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
