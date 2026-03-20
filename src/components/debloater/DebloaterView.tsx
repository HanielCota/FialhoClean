import { AlertTriangle, CheckCircle2, CheckSquare2, Trash2, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useDebloater } from "../../hooks/useDebloater";
import { useAsyncState } from "../../hooks/useAsyncState";
import { MODAL_PREVIEW_LIMIT } from "../../constants/ui";
import { useUiStore } from "../../stores/uiStore";
import { Header } from "../layout/Header";
import { ActionCard } from "../shared/ActionCard";
import { AsyncView } from "../shared/AsyncView";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";
import { Modal } from "../shared/Modal";
import { SectionHeading } from "../shared/SectionHeading";
import { SkeletonItem } from "../shared/SkeletonItem";
import { BloatwareItem } from "./BloatwareItem";

export function DebloaterView() {
  const { t } = useTranslation();
  const {
    apps,
    selectedApps,
    isLoading,
    isRemoving,
    error,
    lastRemovalCount,
    loadApps,
    toggleApp,
    clearSelection,
    selectAllApps,
    removeSelected,
    setLastRemovalCount,
  } = useDebloater();

  const { setActiveView } = useUiStore();
  const { isOpen: confirmOpen, request: requestConfirm, confirm: handleRemove, cancel: cancelRemove } = useConfirmModal(removeSelected);

  const hasCautionSelected = useMemo(
    () => apps.some((a) => selectedApps.has(a.package_full_name) && a.safety_level !== "safe"),
    [apps, selectedApps]
  );

  const selectedAppsList = useMemo(
    () => apps.filter((a) => selectedApps.has(a.package_full_name)),
    [apps, selectedApps]
  );

  const count = selectedApps.size;
  const appsStatus = useAsyncState(isLoading, error, apps.length === 0);

  // Success screen after removal
  if (lastRemovalCount !== null) {
    return (
      <div className="p-6 xl:p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green/[0.15] flex items-center justify-center mb-4 animate-scale-in">
          <CheckCircle2 className="w-9 h-9 text-green" />
        </div>
        <h1 className="text-[22px] font-bold text-text mb-1">
          {t('debloater.success.title')}
        </h1>
        <p className="text-[12px] text-text-muted mb-6">
          {t(
            lastRemovalCount === 1
              ? 'debloater.success.subtitle_one'
              : 'debloater.success.subtitle_other',
            { count: lastRemovalCount }
          )}
        </p>

        <Button onClick={() => setLastRemovalCount(null)} className="w-full mb-3">
          {t('debloater.success.backToList')}
        </Button>

        <div className="w-full">
          <SectionHeading className="text-left">
            {t('debloater.success.nextStep')}
          </SectionHeading>
          <ActionCard
            icon={Trash2}
            title={t('debloater.success.runCleaner')}
            description={t('debloater.success.runCleanerDesc')}
            onClick={() => setActiveView('cleaner')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 xl:p-8">
      <Header
        title={t('debloater.title')}
        subtitle={t('debloater.subtitle')}
        onRefresh={loadApps}
        isRefreshing={isLoading}
      />

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <AsyncView
        status={appsStatus}
        skeleton={
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonItem key={i} height="h-16" />
            ))}
          </div>
        }
        empty={
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-green/[0.15] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-green" />
            </div>
            <p className="text-[17px] font-semibold text-text mb-1">
              {t('debloater.empty.title')}
            </p>
            <p className="text-[13px] text-text-muted">{t('debloater.empty.message')}</p>
          </div>
        }
      >
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <SectionHeading className="mb-0">{t('debloater.sectionTitle')}</SectionHeading>
            {count === apps.length ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="rounded-full px-3.5 gap-1.5 text-[11px] font-medium tracking-wide hover:bg-white/[0.05]"
              >
                <X className="w-3.5 h-3.5" />
                {t('debloater.clearAll')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={selectAllApps}
                className="rounded-full px-3.5 gap-1.5 text-[11px] font-medium tracking-wide border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.16]"
              >
                <CheckSquare2 className="w-3.5 h-3.5 text-text" />
                {t('debloater.selectAll')}
              </Button>
            )}
          </div>

          {/* Selection summary */}
          {count > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-accent/[0.06] border border-accent/20 rounded-xl">
              <p className="text-[13px] font-semibold text-text flex-1">
                {t(count === 1 ? 'debloater.selected_one' : 'debloater.selected_other', { count })}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                aria-label={t('debloater.clearSelection')}
              >
                <X className="w-3.5 h-3.5" />
                {t('debloater.clearSelection')}
              </Button>
            </div>
          )}

          {/* App list */}
          <div className="space-y-2 mb-6">
            {apps.map((app) => (
              <BloatwareItem
                key={app.package_full_name}
                app={app}
                selected={selectedApps.has(app.package_full_name)}
                onToggle={toggleApp}
              />
            ))}
          </div>

          {/* Caution banner */}
          {hasCautionSelected && (
            <div className="flex items-start gap-3 p-4 bg-orange/[0.07] border border-orange/20 rounded-xl mb-4">
              <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-text">
                  {t('debloater.cautionBanner.title')}
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  {t('debloater.cautionBanner.message')}
                </p>
              </div>
            </div>
          )}

          {/* Remove button */}
          {count > 0 && (
            <Button
              variant="danger"
              onClick={requestConfirm}
              disabled={isRemoving}
              loading={isRemoving}
              className="w-full"
            >
              {t(count === 1 ? 'debloater.removeButton_one' : 'debloater.removeButton_other', { count })}
            </Button>
          )}
        </>
      </AsyncView>

      {/* Removal confirmation sheet */}
      <Modal
        open={confirmOpen}
        title={t(count === 1 ? 'debloater.modal.title_one' : 'debloater.modal.title_other', { count })}
        confirmLabel={t(count === 1 ? 'debloater.modal.confirm_one' : 'debloater.modal.confirm_other', { count })}
        confirmVariant="danger"
        onConfirm={handleRemove}
        onCancel={cancelRemove}
        loading={isRemoving}
      >
        <div className="space-y-3">
          <ul className="space-y-1">
            {selectedAppsList.slice(0, MODAL_PREVIEW_LIMIT).map((app) => (
              <li key={app.package_full_name} className="text-[14px] text-text">
                • {app.name}
              </li>
            ))}
            {selectedAppsList.length > MODAL_PREVIEW_LIMIT && (
              <li className="text-[14px] text-text-muted">
                {t('debloater.modal.andMore', { count: selectedAppsList.length - MODAL_PREVIEW_LIMIT })}
              </li>
            )}
          </ul>
          {hasCautionSelected && (
            <div className="flex items-start gap-2 text-[12px] text-orange">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                {t('debloater.modal.cautionWarning')}
              </span>
            </div>
          )}
          <p className="text-[11px] text-text-muted">
            {t('debloater.modal.disclaimer')}
          </p>
        </div>
      </Modal>
    </div>
  );
}
