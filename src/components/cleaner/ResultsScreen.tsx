import { ArrowLeft, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { formatBytes } from "../../lib/format";
import type { ScanSummary } from "../../types/cleaner";
import { Button } from "../shared/Button";
import { Modal } from "../shared/Modal";
import { CATEGORY_ICONS } from "../../constants/categoryIcons";

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
  const { isOpen: confirmOpen, request: requestConfirm, confirm: handleConfirm, cancel: handleCancel } = useConfirmModal(onClean);
  const totalSize = scanSummary.total_size_bytes;
  const totalFiles = scanSummary.categories.reduce((s, c) => s + c.files.length, 0);

  if (totalSize === 0) {
    return (
      <div className="p-6 xl:p-8 flex flex-col items-center text-center">
        <div className="text-5xl mb-4 select-none">✨</div>
        <h1 className="text-[22px] font-bold text-text mb-2">
          {t("cleaner.results.empty.title")}
        </h1>
        <p className="text-[12px] text-text-muted mb-6">
          {t("cleaner.results.empty.message")}
        </p>
        <Button variant="ghost" onClick={onRescan}>
          <ArrowLeft className="w-4 h-4" />
          {t("cleaner.results.empty.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 xl:p-8">
      <h1 className="text-[22px] font-bold text-text mb-1">
        {t("cleaner.results.found", { size: formatBytes(totalSize) })}
      </h1>
      <p className="text-[12px] text-text-muted mb-6">
        {t("cleaner.results.foundSub", {
          files: totalFiles.toLocaleString(),
          categories: scanSummary.categories.length,
        })}
      </p>

      <div className="space-y-2 mb-6">
        {scanSummary.categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.category];
          return (
            <div
              key={cat.category}
              className="flex items-center gap-4 p-3 bg-card border border-white/[0.06] rounded-xl"
            >
              <Icon className="w-4 h-4 text-text-muted" />
              <div className="flex-1">
                <p className="text-[14px] font-medium text-text">
                  {t(`cleaner.categories.${cat.category}.label` as const)}
                </p>
                <p className="text-[12px] text-text-muted">
                  {formatBytes(cat.total_size_bytes)}
                  {cat.category !== "recycle_bin"
                    ? ` ${t("cleaner.results.files", { count: cat.files.length })}`
                    : ` ${t("cleaner.results.estimated")}`}
                </p>
              </div>
              <span className="inline-flex items-center h-5 px-2 rounded text-[11px] font-semibold bg-green/[0.15] text-green">
                {t("cleaner.results.safeBadge")}
              </span>
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
          <Trash2 className="w-4 h-4" />
          {t("cleaner.results.cleanButton", { size: formatBytes(totalSize) })}
        </Button>

        <Button variant="ghost" onClick={onRescan} className="w-full">
          <ArrowLeft className="w-4 h-4" />
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
        <p className="text-orange text-[12px] font-medium">
          {t("cleaner.results.modal.warning")}
        </p>
      </Modal>
    </div>
  );
}
