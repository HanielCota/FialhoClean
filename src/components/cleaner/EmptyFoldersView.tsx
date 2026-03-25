import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare2,
  FolderOpen,
  FolderX,
  Loader2,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useEmptyFolders } from "../../hooks/useEmptyFolders";
import { Button } from "../shared/Button";
import { CautionBanner } from "../shared/CautionBanner";
import { Checkbox } from "../shared/Checkbox";
import { ErrorMessage } from "../shared/ErrorMessage";
import { Modal } from "../shared/Modal";
import { SectionHeading } from "../shared/SectionHeading";

export function EmptyFoldersView() {
  const { t } = useTranslation();
  const {
    phase,
    error,
    scanResult,
    deleteResult,
    selected,
    scan,
    toggleFolder,
    selectAll,
    deselectAll,
    deleteSelected,
    reset,
  } = useEmptyFolders();

  const {
    isOpen: confirmOpen,
    request: requestConfirm,
    confirm: handleConfirm,
    cancel: handleCancel,
  } = useConfirmModal(deleteSelected);

  // ── Done screen ────────────────────────────────────────────────────────────
  if (phase === "done" && deleteResult) {
    return (
      <div className="flex flex-col items-center p-6 text-center xl:p-8">
        <div className="mb-4 flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-green/[0.15]">
          <CheckCircle2 className="h-9 w-9 text-green" />
        </div>
        <h1 className="mb-1 font-bold text-[22px] text-text">
          {t("emptyFolders.done.title", { count: deleteResult.deleted_count })}
        </h1>
        <p className="mb-6 text-[13px] text-text-muted">
          {t("emptyFolders.done.subtitle")}
        </p>

        {deleteResult.errors.length > 0 && (
          <div className="mb-6 w-full rounded-2xl border border-orange/20 bg-orange/[0.06] p-4 text-left">
            <p className="font-semibold text-[13px] text-text">
              {t("emptyFolders.done.errorsTitle", { count: deleteResult.errors.length })}
            </p>
            <div className="mt-2 space-y-1">
              {deleteResult.errors.slice(0, 3).map((e, i) => (
                <p key={i} className="text-[12px] text-text-muted">
                  — {e}
                </p>
              ))}
            </div>
          </div>
        )}

        <Button onClick={reset} className="w-full">
          {t("emptyFolders.done.scanAgain")}
        </Button>
      </div>
    );
  }

  // ── Idle screen ────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center p-6 text-center xl:p-8">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
          <FolderX className="h-8 w-8 text-text-muted" />
        </div>
        <h1 className="mb-2 font-bold text-[22px] text-text">
          {t("emptyFolders.idle.title")}
        </h1>
        <p className="mb-2 max-w-sm text-[13px] text-text-muted">
          {t("emptyFolders.idle.description")}
        </p>
        <p className="mb-6 max-w-sm text-[12px] text-text-tertiary">
          {t("emptyFolders.idle.safeguard")}
        </p>
        {error && (
          <div className="mb-4 w-full">
            <ErrorMessage message={error} />
          </div>
        )}
        <Button onClick={scan} className="w-full">
          <FolderX className="h-4 w-4" />
          {t("emptyFolders.idle.scanButton")}
        </Button>
      </div>
    );
  }

  // ── Scanning screen ────────────────────────────────────────────────────────
  if (phase === "scanning") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center xl:p-8">
        <Loader2 className="h-10 w-10 animate-spin text-text-muted" />
        <p className="font-semibold text-[17px] text-text">{t("emptyFolders.scanning.title")}</p>
        <p className="text-[13px] text-text-muted">{t("emptyFolders.scanning.subtitle")}</p>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if ((phase === "results" || phase === "deleting") && scanResult) {
    const folders = scanResult.folders;
    const count = selected.size;

    // Nothing found
    if (folders.length === 0) {
      return (
        <div className="flex flex-col items-center p-6 text-center xl:p-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/[0.15]">
            <CheckCircle2 className="h-9 w-9 text-green" />
          </div>
          <h1 className="mb-2 font-bold text-[22px] text-text">
            {t("emptyFolders.results.emptyTitle")}
          </h1>
          <p className="mb-6 text-[13px] text-text-muted">
            {t("emptyFolders.results.emptySubtitle")}
          </p>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            {t("emptyFolders.results.scanAgain")}
          </Button>
        </div>
      );
    }

    return (
      <div className="p-6 xl:p-8">
        {/* Header */}
        <h1 className="mb-1 font-bold text-[22px] text-text">
          {t("emptyFolders.results.title", { count: folders.length })}
        </h1>
        <p className="mb-5 text-[12px] text-text-muted">
          {t("emptyFolders.results.subtitle", {
            roots: scanResult.scanned_roots.length,
          })}
        </p>

        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading className="mb-0">
            {t("emptyFolders.results.sectionLabel")}
            <span className="font-normal text-text-muted normal-case tracking-normal">
              {" "}— {folders.length}
            </span>
          </SectionHeading>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={selectAll}
              className="gap-1.5 rounded-full border-white/[0.10] bg-white/[0.05] px-3.5 font-medium text-[11px] tracking-wide"
            >
              <CheckSquare2 className="h-3.5 w-3.5" />
              {t("common.selectAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              disabled={count === 0}
              className="gap-1.5 rounded-full px-3.5 font-medium text-[11px] tracking-wide"
            >
              <X className="h-3.5 w-3.5" />
              {t("common.deselectAll")}
            </Button>
          </div>
        </div>

        {/* Folder list */}
        <div className="mb-5 space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
          {folders.map((folder) => {
            const isSelected = selected.has(folder.path);
            const basename = folder.path.split(/[\\/]/).pop() ?? folder.path;
            const parent = folder.path.substring(0, folder.path.lastIndexOf("\\") || folder.path.lastIndexOf("/"));

            return (
              <button
                key={folder.path}
                type="button"
                onClick={() => toggleFolder(folder.path)}
                role="checkbox"
                aria-checked={isSelected}
                className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-accent/20 bg-accent/[0.05]"
                    : "border-white/[0.06] bg-card hover:border-white/[0.10] hover:bg-card-hover"
                }`}
              >
                <Checkbox checked={isSelected} size="sm" shape="circle" className="flex-shrink-0" />
                <FolderOpen
                  className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-accent/70" : "text-text-tertiary"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[13px] text-text">{basename}</p>
                  <p className="truncate text-[11px] text-text-tertiary" title={parent}>
                    {parent}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Caution banner */}
        <CautionBanner
          message={t("emptyFolders.results.caution")}
          className="mb-4"
        />

        {error && (
          <div className="mb-3">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Actions */}
        <Button
          variant="danger"
          onClick={requestConfirm}
          disabled={count === 0 || phase === "deleting"}
          loading={phase === "deleting"}
          className="mb-2 w-full"
        >
          <Trash2 className="h-4 w-4" />
          {t("emptyFolders.results.deleteButton", { count })}
        </Button>
        <Button variant="ghost" onClick={reset} className="w-full">
          <RotateCcw className="h-4 w-4" />
          {t("emptyFolders.results.scanAgain")}
        </Button>

        {/* Confirmation modal */}
        <Modal
          open={confirmOpen}
          title={t("emptyFolders.modal.title", { count })}
          confirmLabel={t("emptyFolders.modal.confirm", { count })}
          confirmVariant="danger"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        >
          <p>{t("emptyFolders.modal.body", { count })}</p>
          <div className="flex items-start gap-2 text-[12px] text-orange">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{t("emptyFolders.modal.warning")}</span>
          </div>
        </Modal>
      </div>
    );
  }

  return null;
}
