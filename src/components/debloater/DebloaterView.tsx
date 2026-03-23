import { AlertTriangle, CheckCircle2, CheckSquare2, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MODAL_PREVIEW_LIMIT } from "../../constants/ui";
import { useAsyncState } from "../../hooks/useAsyncState";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { useDebloater } from "../../hooks/useDebloater";
import { useUiStore } from "../../stores/uiStore";
import type { BloatCategory } from "../../types/debloater";
import { Header } from "../layout/Header";
import { ActionCard } from "../shared/ActionCard";
import { AsyncView } from "../shared/AsyncView";
import { Button } from "../shared/Button";
import { CautionBanner } from "../shared/CautionBanner";
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
    return (apps ?? []).filter((app) => {
      if (safetyFilter === "safe" && app.safety_level !== "safe") return false;
      if (safetyFilter === "caution" && app.safety_level === "safe") return false;
      if (!q) return true;
      return (app?.name ?? "").toLowerCase().includes(q) || (app?.description ?? "").toLowerCase().includes(q);
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
    () => (apps ?? []).some((a) => selectedApps.has(a.package_full_name) && a.safety_level !== "safe"),
    [apps, selectedApps],
  );

  const selectedAppsList = useMemo(
    () => (apps ?? []).filter((a) => selectedApps.has(a.package_full_name)),
    [apps, selectedApps],
  );

  const count = selectedApps.size;
  const appsStatus = useAsyncState(isLoading, error, (apps?.length ?? 0) === 0);

  // ── Success screen ──────────────────────────────────────────────────────
  if (lastRemovalCount !== null) {
    return (
      <div className="flex flex-col items-center p-6 text-center xl:p-8">
        <div className="mb-4 flex h-16 w-16 animate-scale-in items-center justify-center rounded-full bg-green/[0.15]">
          <CheckCircle2 className="h-9 w-9 text-green" />
        </div>
        <h1 className="mb-1 font-bold text-[22px] text-text">{t("debloater.success.title")}</h1>
        <p className="mb-6 text-[12px] text-text-muted">
          {t("debloater.success.subtitle", { count: lastRemovalCount })}
        </p>

        <Button onClick={() => setLastRemovalCount(null)} className="mb-3 w-full">
          {t("debloater.success.backToList")}
        </Button>

        <div className="w-full">
          <SectionHeading className="text-left">{t("debloater.success.nextStep")}</SectionHeading>
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green/[0.15]">
              <CheckCircle2 className="h-7 w-7 text-green" />
            </div>
            <p className="mb-1 font-semibold text-[17px] text-text">{t("debloater.empty.title")}</p>
            <p className="text-[13px] text-text-muted">{t("debloater.empty.message")}</p>
          </div>
        }
      >
        {/* ── Search bar ──────────────────────────────────────────── */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("debloater.searchPlaceholder")}
            className="h-9 w-full rounded-[10px] border border-white/[0.07] bg-white/[0.04] pr-3 pl-9 text-[13px] text-text transition-colors duration-150 placeholder:text-text-muted/50 focus:border-white/[0.15] focus:bg-white/[0.06] focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-muted hover:text-text"
              aria-label={t("debloater.clearSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── Safety filter pills ─────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-1.5">
          {(["all", "safe", "caution"] as SafetyFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSafetyFilter(f)}
              className={`h-7 rounded-full px-3 font-semibold text-[11px] transition-all duration-150 ${
                safetyFilter === f
                  ? "border border-accent/30 bg-accent/15 text-accent"
                  : "border border-white/[0.06] bg-white/[0.04] text-text-muted hover:bg-white/[0.07] hover:text-text/80"
              }`}
            >
              {t(`debloater.filter.${f}`)}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-text-muted">
            {t("debloater.filter.count", { visible: visibleApps?.length ?? 0, total: apps?.length ?? 0 })}
          </span>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading className="mb-0">{t("debloater.sectionTitle")}</SectionHeading>
          {count === (apps?.length ?? 0) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="gap-1.5 rounded-full px-3.5 font-medium text-[11px] tracking-wide hover:bg-white/[0.05]"
            >
              <X className="h-3.5 w-3.5" />
              {t("debloater.clearAll")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={selectAllApps}
              className="gap-1.5 rounded-full border-white/[0.10] bg-white/[0.05] px-3.5 font-medium text-[11px] tracking-wide hover:border-white/[0.16] hover:bg-white/[0.09]"
            >
              <CheckSquare2 className="h-3.5 w-3.5 text-text" />
              {t("debloater.selectAll")}
            </Button>
          )}
        </div>

        {/* ── Selection summary ────────────────────────────────────── */}
        {count > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/[0.06] p-3">
            <p className="flex-1 font-semibold text-[13px] text-text">
              {t("debloater.selected", { count })}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              aria-label={t("debloater.clearSelection")}
            >
              <X className="h-3.5 w-3.5" />
              {t("debloater.clearSelection")}
            </Button>
          </div>
        )}

        {/* ── App list grouped by category ─────────────────────────── */}
        {(visibleApps?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Search className="mb-2 h-7 w-7 text-text-tertiary" />
            <p className="text-[13px] text-text-muted">{t("debloater.noResults")}</p>
          </div>
        ) : (
          <div className="mb-6 space-y-5">
            {CATEGORY_ORDER.map((cat) => {
              const catApps = groupedApps.get(cat);
              if (!catApps) return null;
              return (
                <section key={cat}>
                  <SectionHeading>
                    {t(`debloater.categories.${cat}`)}
                    <span className="font-normal text-text-muted normal-case tracking-normal">
                      {" "}
                      — {catApps.length}
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
          <CautionBanner
            title={t("debloater.cautionBanner.title")}
            message={t("debloater.cautionBanner.message")}
            className="mb-4"
          />
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
            {t("debloater.removeButton", { count })}
          </Button>
        )}
      </AsyncView>

      {/* ── Removal confirmation modal ───────────────────────────────── */}
      <Modal
        open={confirmOpen}
        title={t("debloater.modal.title", { count })}
        confirmLabel={t("debloater.modal.confirm", { count })}
        confirmVariant="danger"
        onConfirm={handleRemove}
        onCancel={cancelRemove}
        loading={isRemoving}
      >
        <div className="space-y-3">
          <ul className="space-y-1">
            {selectedAppsList?.slice(0, MODAL_PREVIEW_LIMIT).map((app) => (
              <li key={app.package_full_name} className="text-[14px] text-text">
                • {app.name}
              </li>
            ))}
            {(selectedAppsList?.length ?? 0) > MODAL_PREVIEW_LIMIT && (
              <li className="text-[14px] text-text-muted">
                {t("debloater.modal.andMore", {
                  count: (selectedAppsList?.length ?? 0) - MODAL_PREVIEW_LIMIT,
                })}
              </li>
            )}
          </ul>
          {hasCautionSelected && (
            <div className="flex items-start gap-2 text-[12px] text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>{t("debloater.modal.cautionWarning")}</span>
            </div>
          )}
          <p className="text-[11px] text-text-muted">{t("debloater.modal.disclaimer")}</p>
        </div>
      </Modal>
    </div>
  );
}
