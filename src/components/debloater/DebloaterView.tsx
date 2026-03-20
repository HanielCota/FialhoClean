import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare2,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useDebloater } from "../../hooks/useDebloater";
import { useAsyncState } from "../../hooks/useAsyncState";
import { MODAL_PREVIEW_LIMIT } from "../../constants/ui";
import { useUiStore } from "../../stores/uiStore";
import type { BloatCategory } from "../../types/debloater";
import { Header } from "../layout/Header";
import { ActionCard } from "../shared/ActionCard";
import { AsyncView } from "../shared/AsyncView";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";
import { Modal } from "../shared/Modal";
import { SectionHeading } from "../shared/SectionHeading";
import { SkeletonItem } from "../shared/SkeletonItem";
import { BloatwareItem } from "./BloatwareItem";

// Ordered display groups
const CATEGORY_ORDER: BloatCategory[] = [
  "security_trials",
  "oem",
  "microsoft",
  "communication",
  "entertainment",
  "third_party",
];

type SafetyFilter = "all" | "safe" | "caution";

export function DebloaterView() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [safetyFilter, setSafetyFilter] = useState<SafetyFilter>("all");

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
  const {
    isOpen: confirmOpen,
    request: requestConfirm,
    confirm: handleRemove,
    cancel: cancelRemove,
  } = useConfirmModal(removeSelected);

  // Filtered + searched app list
  const visibleApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((app) => {
      if (safetyFilter === "safe" && app.safety_level !== "safe") return false;
      if (safetyFilter === "caution" && app.safety_level === "safe") return false;
      if (!q) return true;
      return (
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q)
      );
    });
  }, [apps, search, safetyFilter]);

  // Group visible apps by category
  const groupedApps = useMemo(() => {
    const groups = new Map<BloatCategory, typeof visibleApps>();
    for (const cat of CATEGORY_ORDER) {
      const catApps = visibleApps.filter((a) => a.category === cat);
      if (catApps.length > 0) groups.set(cat, catApps);
    }
    return groups;
  }, [visibleApps]);

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

  // ── Success screen ──────────────────────────────────────────────────────
  if (lastRemovalCount !== null) {
    return (
      <div className="p-6 xl:p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-green/[0.15] flex items-center justify-center mb-4 animate-scale-in">
          <CheckCircle2 className="w-9 h-9 text-green" />
        </div>
        <h1 className="text-[22px] font-bold text-text mb-1">
          {t("debloater.success.title")}
        </h1>
        <p className="text-[12px] text-text-muted mb-6">
          {t(
            lastRemovalCount === 1
              ? "debloater.success.subtitle_one"
              : "debloater.success.subtitle_other",
            { count: lastRemovalCount }
          )}
        </p>

        <Button onClick={() => setLastRemovalCount(null)} className="w-full mb-3">
          {t("debloater.success.backToList")}
        </Button>

        <div className="w-full">
          <SectionHeading className="text-left">
            {t("debloater.success.nextStep")}
          </SectionHeading>
          <ActionCard
            icon={Trash2}
            title={t("debloater.success.runCleaner")}
            description={t("debloater.success.runCleanerDesc")}
            onClick={() => setActiveView("cleaner")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 xl:p-8">
      <Header
        title={t("debloater.title")}
        subtitle={t("debloater.subtitle")}
        onRefresh={loadApps}
        isRefreshing={isLoading}
      />

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      )}

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
              {t("debloater.empty.title")}
            </p>
            <p className="text-[13px] text-text-muted">{t("debloater.empty.message")}</p>
          </div>
        }
      >
        <>
          {/* ── Search bar ──────────────────────────────────────────── */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("debloater.searchPlaceholder")}
              className="
                w-full h-9 rounded-[10px] border border-white/[0.07] bg-white/[0.04]
                pl-9 pr-3 text-[13px] text-text placeholder:text-text-muted/50
                focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.06]
                transition-colors duration-150
              "
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                aria-label={t("debloater.clearSearch")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* ── Safety filter pills ─────────────────────────────────── */}
          <div className="flex items-center gap-1.5 mb-4">
            {(["all", "safe", "caution"] as SafetyFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSafetyFilter(f)}
                className={`h-7 rounded-full px-3 text-[11px] font-semibold transition-all duration-150 ${
                  safetyFilter === f
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-white/[0.04] text-text-muted border border-white/[0.06] hover:bg-white/[0.07] hover:text-text/80"
                }`}
              >
                {t(`debloater.filter.${f}`)}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-text-muted">
              {t("debloater.filter.count", { visible: visibleApps.length, total: apps.length })}
            </span>
          </div>

          {/* ── Toolbar ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <SectionHeading className="mb-0">
              {t("debloater.sectionTitle")}
            </SectionHeading>
            {count === apps.length ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="rounded-full px-3.5 gap-1.5 text-[11px] font-medium tracking-wide hover:bg-white/[0.05]"
              >
                <X className="w-3.5 h-3.5" />
                {t("debloater.clearAll")}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={selectAllApps}
                className="rounded-full px-3.5 gap-1.5 text-[11px] font-medium tracking-wide border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.16]"
              >
                <CheckSquare2 className="w-3.5 h-3.5 text-text" />
                {t("debloater.selectAll")}
              </Button>
            )}
          </div>

          {/* ── Selection summary ────────────────────────────────────── */}
          {count > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-accent/[0.06] border border-accent/20 rounded-xl">
              <p className="text-[13px] font-semibold text-text flex-1">
                {t(
                  count === 1 ? "debloater.selected_one" : "debloater.selected_other",
                  { count }
                )}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                aria-label={t("debloater.clearSelection")}
              >
                <X className="w-3.5 h-3.5" />
                {t("debloater.clearSelection")}
              </Button>
            </div>
          )}

          {/* ── App list grouped by category ─────────────────────────── */}
          {visibleApps.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Search className="w-7 h-7 text-text-tertiary mb-2" />
              <p className="text-[13px] text-text-muted">
                {t("debloater.noResults")}
              </p>
            </div>
          ) : (
            <div className="space-y-5 mb-6">
              {CATEGORY_ORDER.map((cat) => {
                const catApps = groupedApps.get(cat);
                if (!catApps) return null;
                return (
                  <section key={cat}>
                    <SectionHeading>
                      {t(`debloater.categories.${cat}`)}
                      <span className="text-text-muted normal-case tracking-normal font-normal">
                        {" "}— {catApps.length}
                      </span>
                    </SectionHeading>
                    <div className="space-y-2">
                      {catApps.map((app) => (
                        <BloatwareItem
                          key={app.package_full_name}
                          app={app}
                          selected={selectedApps.has(app.package_full_name)}
                          onToggle={toggleApp}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* ── Caution banner ───────────────────────────────────────── */}
          {hasCautionSelected && (
            <div className="flex items-start gap-3 p-4 bg-white/[0.03] border border-amber-400/20 rounded-xl mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-text">
                  {t("debloater.cautionBanner.title")}
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  {t("debloater.cautionBanner.message")}
                </p>
              </div>
            </div>
          )}

          {/* ── Remove button ────────────────────────────────────────── */}
          {count > 0 && (
            <Button
              variant="danger"
              onClick={requestConfirm}
              disabled={isRemoving}
              loading={isRemoving}
              className="w-full"
            >
              {t(
                count === 1
                  ? "debloater.removeButton_one"
                  : "debloater.removeButton_other",
                { count }
              )}
            </Button>
          )}
        </>
      </AsyncView>

      {/* ── Removal confirmation modal ───────────────────────────────── */}
      <Modal
        open={confirmOpen}
        title={t(
          count === 1 ? "debloater.modal.title_one" : "debloater.modal.title_other",
          { count }
        )}
        confirmLabel={t(
          count === 1
            ? "debloater.modal.confirm_one"
            : "debloater.modal.confirm_other",
          { count }
        )}
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
                {t("debloater.modal.andMore", {
                  count: selectedAppsList.length - MODAL_PREVIEW_LIMIT,
                })}
              </li>
            )}
          </ul>
          {hasCautionSelected && (
            <div className="flex items-start gap-2 text-[12px] text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{t("debloater.modal.cautionWarning")}</span>
            </div>
          )}
          <p className="text-[11px] text-text-muted">
            {t("debloater.modal.disclaimer")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
