import { useTranslation } from "react-i18next";
import { formatBytes } from "../../lib/format";
import type { CategoryScanResult, CleanCategory } from "../../types/cleaner";
import { Badge } from "../shared/Badge";
import { Toggle } from "../shared/Toggle";

interface CleanerCategoryProps {
  category: CleanCategory;
  selected: boolean;
  scanResult?: CategoryScanResult;
  onToggle: (category: CleanCategory) => void;
}

export function CleanerCategory({
  category,
  selected,
  scanResult,
  onToggle,
}: CleanerCategoryProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-4 rounded-xl border border-white/5 bg-card p-4">
      <Toggle checked={selected} onChange={() => onToggle(category)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[14px] text-text">
            {t(`cleaner.categories.${category}.label` as const)}
          </span>
          {scanResult?.needs_elevation && (
            <Badge label={t("cleaner.needsAdmin")} variant="caution" />
          )}
          {scanResult?.error && <Badge label={t("common.error")} variant="error" />}
        </div>
        <p className="mt-0.5 text-[12px] text-text-muted">
          {t(`cleaner.categories.${category}.description` as const)}
        </p>
      </div>
      {scanResult && (
        <div className="flex-shrink-0 text-right">
          <p className="font-medium text-[14px] text-text">
            {formatBytes(scanResult.total_size_bytes)}
          </p>
          <p className="text-[12px] text-text-muted">
            {category === "recycle_bin"
              ? t("cleaner.results.estimatedShort")
              : t("cleaner.results.fileCount", { count: scanResult.files.length })}
          </p>
        </div>
      )}
    </div>
  );
}
