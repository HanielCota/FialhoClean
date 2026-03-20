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
    <div className="flex items-start gap-4 p-4 bg-card border border-white/5 rounded-xl">
      <Toggle
        checked={selected}
        onChange={() => onToggle(category)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-medium text-text">
            {t(`cleaner.categories.${category}.label` as const)}
          </span>
          {scanResult?.needs_elevation && (
            <Badge label={t('cleaner.needsAdmin')} variant="caution" />
          )}
          {scanResult?.error && (
            <Badge label={t('common.error')} variant="error" />
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-text-muted">
          {t(`cleaner.categories.${category}.description` as const)}
        </p>
      </div>
      {scanResult && (
        <div className="text-right flex-shrink-0">
          <p className="text-[14px] font-medium text-text">
            {formatBytes(scanResult.total_size_bytes)}
          </p>
          <p className="text-[12px] text-text-muted">
            {category === "recycle_bin"
              ? t('cleaner.results.estimated').replace('· ', '')
              : `${scanResult.files.length} ${t('cleaner.results.files', { count: scanResult.files.length }).replace('· ', '')}`}
          </p>
        </div>
      )}
    </div>
  );
}
