import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Shield,
  Trash2,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { DISK_HEALTH_CRITICAL, USAGE_CRITICAL, USAGE_WARNING } from "../../constants/thresholds";
import { useAsyncState } from "../../hooks/useAsyncState";
import { useSystemInfo } from "../../hooks/useSystemInfo";
import { formatBytes, formatPercent } from "../../lib/format";
import { useCleanerStore } from "../../stores/cleanerStore";
import { useUiStore } from "../../stores/uiStore";
import { AsyncView } from "../shared/AsyncView";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getHealthKey(diskPct: number): {
  key: "good" | "better" | "attention";
  color: "green" | "orange" | "red";
} {
  if (diskPct >= DISK_HEALTH_CRITICAL) return { key: "attention", color: "red" };
  if (diskPct >= USAGE_WARNING) return { key: "better", color: "orange" };
  return { key: "good", color: "green" };
}

/* ─── StatCard ────────────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  title,
  main,
  sub,
  progress,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  main: string;
  sub: string;
  progress?: number;
}) {
  const { t } = useTranslation();
  const pct = progress ?? 0;
  const barColor =
    pct >= USAGE_CRITICAL ? "bg-red" : pct >= USAGE_WARNING ? "bg-orange" : "bg-accent/60";

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.06] bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
          {title}
        </span>
      </div>
      <p className="font-bold text-[17px] leading-tight text-text">{main}</p>
      <p className="mt-0.5 text-[11px] text-text-muted">{sub}</p>
      {progress !== undefined && (
        <div
          className="mt-auto pt-3"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={t("dashboard.stats.storageUsed", { pct })}
        >
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── StepCard ────────────────────────────────────────────────────────────── */

function StepCard({
  step,
  icon: Icon,
  title,
  description,
  ctaLabel,
  isDone,
  onClick,
}: {
  step: number;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ctaLabel: string;
  isDone?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 transition-all duration-150 ${
        isDone
          ? "border-green/[0.18] bg-green/[0.05]"
          : "border-white/[0.06] bg-card hover:border-white/[0.10] hover:bg-card-hover"
      }`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
            isDone ? "bg-green/[0.15]" : "bg-white/[0.07]"
          }`}
        >
          {isDone ? (
            <Check className="h-3.5 w-3.5 text-green" />
          ) : (
            <span className="font-bold text-[12px] text-text-muted">{step}</span>
          )}
        </div>
        <Icon className={`h-4 w-4 flex-shrink-0 ${isDone ? "text-green" : "text-text-muted"}`} />
        <p
          className={`font-semibold text-[13px] leading-tight ${
            isDone ? "text-green" : "text-text"
          }`}
        >
          {title}
        </p>
      </div>

      <p className="mb-4 flex-1 text-[12px] leading-relaxed text-text-muted">{description}</p>

      <button
        type="button"
        onClick={onClick}
        className={`focus-ring h-9 w-full rounded-xl font-semibold text-[13px] transition-all duration-150 active:scale-[0.98] ${
          isDone
            ? "border border-white/[0.08] text-text-muted hover:border-white/[0.14] hover:text-text"
            : "bg-accent text-on-accent hover:bg-accent-hover"
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

/* ─── SectionLabel ────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
      {children}
    </p>
  );
}

/* ─── DashboardView ───────────────────────────────────────────────────────── */

export function DashboardView() {
  const { systemInfo, diskUsage, isLoading, error, refresh } = useSystemInfo();
  const { cleanResult } = useCleanerStore();
  const { setActiveView, setPendingQuickScan } = useUiStore();
  const { t } = useTranslation();

  const primaryDisk = diskUsage?.[0];
  const diskPct = primaryDisk ? formatPercent(primaryDisk.used_bytes, primaryDisk.total_bytes) : 0;
  const health = getHealthKey(diskPct);
  const ramPct = systemInfo
    ? formatPercent(systemInfo.ram_used_bytes, systemInfo.ram_total_bytes)
    : 0;

  const statsStatus = useAsyncState(isLoading, error, !systemInfo);
  const cleanDone = cleanResult !== null && cleanResult !== undefined;

  const handleQuickClean = () => {
    setPendingQuickScan(true);
    setActiveView("cleaner");
  };

  const HealthIcon =
    health.color === "green"
      ? CheckCircle2
      : health.color === "orange"
        ? AlertTriangle
        : AlertCircle;

  const healthIconClass =
    health.color === "green"
      ? "text-green"
      : health.color === "orange"
        ? "text-orange"
        : "text-red";

  const healthIconBg =
    health.color === "green"
      ? "bg-green/[0.12]"
      : health.color === "orange"
        ? "bg-orange/[0.12]"
        : "bg-red/[0.12]";

  return (
    <div className="flex flex-col gap-6 p-5">
      {/* ══════════════════════════════════════════
          FAIXA 1 — STATUS DO PC
      ══════════════════════════════════════════ */}
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-card px-5 py-4">
        {/* Ícone */}
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${healthIconBg}`}
        >
          {isLoading && !systemInfo ? (
            <RefreshCw className="h-5 w-5 animate-spin text-text-tertiary" />
          ) : (
            <HealthIcon className={`h-5 w-5 ${healthIconClass}`} />
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[16px] leading-tight text-text">
            {isLoading && !systemInfo
              ? t("dashboard.healthChecking")
              : t(`dashboard.health.${health.key}`)}
          </p>
          {!isLoading && (
            <p className="text-[12px] text-text-muted">
              {t(`dashboard.healthDesc.${health.key}`)}
              {cleanResult && (
                <span className="text-text-tertiary">
                  {" · "}
                  {t("dashboard.lastCleaned", { size: formatBytes(cleanResult.freed_bytes ?? 0) })}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Botão Quick Clean + Refresh */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            aria-label={isLoading ? t("common.refreshing") : t("dashboard.refresh")}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-all duration-150 hover:bg-white/[0.06] hover:text-text-muted disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleQuickClean}
            className="focus-ring flex h-9 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-[13px] text-on-accent transition-all duration-150 hover:bg-accent-hover active:scale-[0.98]"
          >
            <Zap className="h-3.5 w-3.5" />
            {t("dashboard.quickClean.title")}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FAIXA 2 — O QUE FAZER (PASSOS GUIADOS)
      ══════════════════════════════════════════ */}
      <div>
        <SectionLabel>{t("dashboard.steps.title")}</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          <StepCard
            step={1}
            icon={Trash2}
            title={t("dashboard.steps.clean.title")}
            description={
              cleanDone
                ? t("dashboard.steps.clean.done", {
                    size: formatBytes(cleanResult?.freed_bytes ?? 0),
                  })
                : t("dashboard.steps.clean.desc")
            }
            ctaLabel={
              cleanDone ? t("dashboard.steps.clean.ctaDone") : t("dashboard.steps.clean.cta")
            }
            isDone={cleanDone}
            onClick={handleQuickClean}
          />
          <StepCard
            step={2}
            icon={Shield}
            title={t("dashboard.steps.apps.title")}
            description={t("dashboard.steps.apps.desc")}
            ctaLabel={t("dashboard.steps.apps.cta")}
            onClick={() => setActiveView("debloater")}
          />
          <StepCard
            step={3}
            icon={Zap}
            title={t("dashboard.steps.speed.title")}
            description={t("dashboard.steps.speed.desc")}
            ctaLabel={t("dashboard.steps.speed.cta")}
            onClick={() => setActiveView("optimizer")}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FAIXA 3 — STATUS DO SISTEMA
      ══════════════════════════════════════════ */}
      <div>
        <SectionLabel>{t("dashboard.sections.systemStatus")}</SectionLabel>
        <AsyncView
          status={statsStatus}
          skeleton={
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-shimmer rounded-2xl border border-white/[0.06] bg-card"
                />
              ))}
            </div>
          }
          error={
            <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-card p-4">
              <ErrorMessage message={t("dashboard.systemError")} />
              <Button variant="ghost" size="sm" onClick={refresh}>
                {t("common.retry")}
              </Button>
            </div>
          }
          empty={null}
        >
          <div className="grid grid-cols-4 gap-3">
            {primaryDisk && (
              <StatCard
                icon={HardDrive}
                title={t("dashboard.stats.storage")}
                main={t("dashboard.stats.storageFree", {
                  size: formatBytes(primaryDisk.total_bytes - primaryDisk.used_bytes),
                })}
                sub={t("dashboard.stats.storageUsed", { pct: diskPct })}
                progress={diskPct}
              />
            )}
            {systemInfo && (
              <>
                <StatCard
                  icon={MemoryStick}
                  title={t("dashboard.stats.memory")}
                  main={formatBytes(systemInfo.ram_used_bytes)}
                  sub={t("dashboard.stats.memoryOf", {
                    total: formatBytes(systemInfo.ram_total_bytes),
                  })}
                  progress={ramPct}
                />
                <StatCard
                  icon={Cpu}
                  title={t("dashboard.stats.cpu")}
                  main={t("dashboard.stats.cpuUsage", { pct: systemInfo.cpu_usage.toFixed(0) })}
                  sub={t("dashboard.stats.cpuSub")}
                  progress={systemInfo.cpu_usage}
                />
                <StatCard
                  icon={Clock}
                  title={t("dashboard.stats.uptime")}
                  main={(() => {
                    const s = systemInfo.uptime_seconds;
                    const d = Math.floor(s / 86400);
                    const h = Math.floor((s % 86400) / 3600);
                    const m = Math.floor((s % 3600) / 60);
                    if (d > 0)
                      return t("dashboard.stats.uptimeDhm", { days: d, hours: h, minutes: m });
                    if (h > 0) return t("dashboard.stats.uptimeHm", { hours: h, minutes: m });
                    return t("dashboard.stats.uptimeM", { minutes: m });
                  })()}
                  sub={systemInfo.hostname}
                />
              </>
            )}
          </div>
        </AsyncView>
      </div>
    </div>
  );
}
