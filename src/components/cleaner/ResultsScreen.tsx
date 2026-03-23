import { ArrowLeft, ChevronDown, ChevronRight, File, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { formatBytes } from "../../lib/format";
import type { CleanCategory, ScanSummary } from "../../types/cleaner";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { Modal } from "../shared/Modal";

export function ResultsScreen({
  scanSummary,
  isCleaning,
  onClean,
  onRescan,
  confirmBeforeCleaning,
}: {
  scanSummary: ScanSummary;
  isCleaning: boolean;
  onClean: () => void;
  onRescan: () => void;
  confirmBeforeCleaning: boolean;
}) {
  const { t } = useTranslation();
  const {
    isOpen: confirmOpen,
    request: requestConfirm,
    confirm: handleConfirm,
    cancel: handleCancel,
  } = useConfirmModal(onClean);
  const [expandedCategory, setExpandedCategory] = useState<CleanCategory | null>(null);
  const totalSize = scanSummary?.total_size_bytes ?? 0;
  const totalFiles = scanSummary?.categories?.reduce((s, c) => s + (c.files?.length ?? 0), 0) ?? 0;

  if (totalSize === 0) {
    return (
      <div className="flex flex-col items-center p-6 text-center xl:p-8">
        <div className="mb-4 select-none text-5xl">✨</div>
        <h1 className="mb-2 font-bold text-[22px] text-text">{t("cleaner.results.empty.title")}</h1>
        <p className="mb-6 text-[12px] text-text-muted">{t("cleaner.results.empty.message")}</p>
        <Button variant="ghost" onClick={onRescan}>
          <ArrowLeft className="h-4 w-4" />
          {t("cleaner.results.empty.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 xl:p-8">
      <h1 className="mb-1 font-bold text-[22px] text-text">
        {t("cleaner.results.found", { size: formatBytes(totalSize) })}
      </h1>
      <p className="mb-6 text-[12px] text-text-muted">
        {t("cleaner.results.foundSub", {
          files: totalFiles.toLocaleString(),
          categories: scanSummary.categories.length,
        })}
      </p>

      <div className="mb-6 space-y-2">
        {scanSummary?.categories?.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category];
          const isExpandable = cat.category !== "recycle_bin" && (cat.files?.length ?? 0) > 0;
          const isExpanded = expandedCategory === cat.category;
          const previewFiles = cat.files?.slice(0, 10) ?? [];

          return (
            <div
              key={cat.category}
              className="overflow-hidden rounded-xl border border-white/[0.06] bg-card"
            >
              <div
                className={`flex items-center gap-4 p-3 ${isExpandable ? "cursor-pointer transition-colors hover:bg-white/[0.02]" : ""}`}
                onClick={() => {
                  if (isExpandable) {
                    setExpandedCategory(isExpanded ? null : cat.category);
                  }
                }}
                role={isExpandable ? "button" : undefined}
                tabIndex={isExpandable ? 0 : undefined}
                aria-expanded={isExpandable ? isExpanded : undefined}
                onKeyDown={(e) => {
                  if (isExpandable && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setExpandedCategory(isExpanded ? null : cat.category);
                  }
                }}
              >
                <Icon className="h-4 w-4 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[14px] text-text">
                    {t(`cleaner.categories.${cat.category}.label` as const)}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    {formatBytes(cat.total_size_bytes)}
                    {cat.category !== "recycle_bin"
                      ? ` ${t("cleaner.results.files", { count: cat.files?.length ?? 0 })}`
                      : ` ${t("cleaner.results.estimated")}`}
                  </p>
                </div>
                <div className="ml-auto flex flex-shrink-0 items-center justify-end gap-2">
                  <Badge label={t("cleaner.results.safeBadge")} variant="success" />
                  <span className="flex h-4 w-4 items-center justify-center text-text-muted/60">
                    {isExpandable ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )
                    ) : null}
                  </span>
                </div>
              </div>

              {isExpanded && previewFiles.length > 0 && (
                <div className="border-white/[0.06] border-t px-3 pb-2">
                  <div className="space-y-0.5 pt-1">
                    {previewFiles.map((file) => {
                      const basename = file.path.split(/[\\/]/).pop() ?? file.path;
                      return (
                        <div key={file.path} className="flex items-center gap-2 px-1 py-1">
                          <File className="h-3 w-3 flex-shrink-0 text-text-muted/50" />
                          <span
                            className="flex-1 truncate text-[12px] text-text-muted"
                            title={file.path}
                          >
                            {basename}
                          </span>
                          <span className="flex-shrink-0 text-[11px] text-text-muted/50">
                            {formatBytes(file.size_bytes)}
                          </span>
                        </div>
                      );
                    })}
                    {(cat.files?.length ?? 0) > 10 && (
                      <p className="px-1 pt-1 text-[11px] text-text-muted/50">
                        {t("cleaner.results.moreFiles", { count: (cat.files?.length ?? 0) - 10 })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="danger"
          onClick={() => {
            if (confirmBeforeCleaning) requestConfirm();
            else onClean();
          }}
          disabled={isCleaning}
          className="w-full"
        >
          <Trash2 className="h-4 w-4" />
          {t("cleaner.results.cleanButton", { size: formatBytes(totalSize) })}
        </Button>

        <Button variant="ghost" onClick={onRescan} className="w-full">
          <ArrowLeft className="h-4 w-4" />
          {t("cleaner.results.scanAgain")}
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        title={t("cleaner.results.modal.title")}
        confirmLabel={t("cleaner.results.modal.confirm", { size: formatBytes(totalSize) })}
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        <p>
          {t("cleaner.results.modal.body", {
            size: formatBytes(totalSize),
            files: totalFiles.toLocaleString(),
          })}
        </p>
        <p className="font-medium text-[12px] text-orange">{t("cleaner.results.modal.warning")}</p>
      </Modal>
    </div>
  );
}
