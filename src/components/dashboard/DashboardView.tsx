import {
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  Minus,
  MemoryStick,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useCleanerStore } from "../../stores/cleanerStore";
import { useUiStore } from "../../stores/uiStore";
import { useSystemInfo } from "../../hooks/useSystemInfo";
import { useAsyncState } from "../../hooks/useAsyncState";
import { formatBytes, formatPercent, formatUptime } from "../../lib/format";
import { DISK_HEALTH_CRITICAL, USAGE_CRITICAL, USAGE_WARNING } from "../../constants/thresholds";
import { ActionCard } from "../shared/ActionCard";
import { AsyncView } from "../shared/AsyncView";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";
import { SectionHeading } from "../shared/SectionHeading";

function relativeDate(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function HealthDot({ color }: { color: "green" | "orange" | "red" }) {
  const cls =
    color === "green"
      ? "bg-green"
      : color === "orange"
      ? "bg-orange"
      : "bg-red";
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`}
      aria-hidden="true"
    />
  );
}

function getHealthKey(
  diskPct: number
): { key: "good" | "better" | "attention"; color: "green" | "orange" | "red" } {
  if (diskPct >= DISK_HEALTH_CRITICAL) return { key: "attention", color: "red" };
  if (diskPct >= USAGE_WARNING) return { key: "better", color: "orange" };
  return { key: "good", color: "green" };
}

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
    pct >= USAGE_CRITICAL ? "bg-red" : pct >= USAGE_WARNING ? "bg-orange" : "bg-accent";

  return (
    <div className="bg-card border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-text-muted" />
        <span className="text-[13px] font-medium text-text-muted">{title}</span>
      </div>
      <p className="text-[17px] font-semibold text-text mb-0.5">{main}</p>
      <p className="text-[12px] text-text-muted mb-2">{sub}</p>
      {progress !== undefined && (
        <div
          className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuetext={t("dashboard.stats.storageUsed", { pct })}
        >
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function DashboardView() {
  const { systemInfo, diskUsage, isLoading, error, refresh } = useSystemInfo();
  const { cleanResult, cleanHistory } = useCleanerStore();
  const { setActiveView, setPendingQuickScan } = useUiStore();
  const { t } = useTranslation();

  const primaryDisk = diskUsage[0];
  const diskPct = primaryDisk
    ? formatPercent(primaryDisk.used_bytes, primaryDisk.total_bytes)
    : 0;
  const health = getHealthKey(diskPct);

  const ramPct = systemInfo
    ? formatPercent(systemInfo.ram_used_bytes, systemInfo.ram_total_bytes)
    : 0;

  const statsStatus = useAsyncState(isLoading, error, !systemInfo);

  const handleQuickClean = () => {
    setPendingQuickScan(true);
    setActiveView("cleaner");
  };

  const recentHistory = cleanHistory.slice(0, 5);

  return (
    <div className="p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-[28px] font-bold text-text leading-tight">
          {t("dashboard.healthIntro")}
        </p>
        {isLoading && !systemInfo ? (
          <p className="text-[22px] font-bold text-text-muted mt-1">
            {t("dashboard.healthChecking")}
          </p>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <HealthDot color={health.color} />
            <p
              className={`text-[22px] font-bold ${
                health.color === "green"
                  ? "text-green"
                  : health.color === "orange"
                  ? "text-orange"
                  : "text-red"
              }`}
            >
              {t(`dashboard.health.${health.key}`)}
            </p>
          </div>
        )}
        {cleanResult && (
          <p className="text-[12px] text-text-muted mt-1">
            {t("dashboard.lastCleaned", { size: formatBytes(cleanResult.freed_bytes) })}
          </p>
        )}
      </div>

      <ActionCard
        icon={Zap}
        title={t("dashboard.quickClean.title")}
        description={t("dashboard.quickClean.description")}
        onClick={handleQuickClean}
      />

      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeading className="mb-0">
            {t("dashboard.sections.systemStatus")}
          </SectionHeading>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            aria-label={isLoading ? t("common.refreshing") : t("dashboard.refresh")}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-white/5 hover:text-text disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <AsyncView
          status={statsStatus}
          skeleton={
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-card border border-white/[0.06] rounded-xl animate-shimmer"
                />
              ))}
            </div>
          }
          error={
            <div className="space-y-2">
              <ErrorMessage message={t("dashboard.systemError")} />
              <Button variant="ghost" size="sm" onClick={refresh}>
                {t("common.retry")}
              </Button>
            </div>
          }
          empty={null}
        >
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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
                  sub={t("dashboard.stats.memoryOf", { total: formatBytes(systemInfo.ram_total_bytes) })}
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
                  main={formatUptime(systemInfo.uptime_seconds)}
                  sub={systemInfo.hostname}
                />
              </>
            )}
          </div>
        </AsyncView>
      </div>

      <div>
        <SectionHeading>{t("dashboard.sections.recentActivity")}</SectionHeading>
        <div>
          {recentHistory.length > 0 ? (
            <div className="space-y-0">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-white/[0.06]">
                  <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-text">
                      {t("dashboard.activity.cleaned", {
                        size: formatBytes(entry.freed_bytes),
                        files: entry.deleted_count.toLocaleString(),
                      })}
                    </p>
                    <p className="text-[12px] text-text-muted/60">
                      {relativeDate(entry.date)} · {entry.categories.length} {entry.categories.length === 1 ? "category" : "categories"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : cleanResult ? (
            <div className="flex items-center gap-3 py-3 border-b border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-green flex-shrink-0" />
              <p className="text-[14px] text-text">
                {t("dashboard.activity.cleaned", {
                  size: formatBytes(cleanResult.freed_bytes),
                  files: cleanResult.deleted_count.toLocaleString(),
                })}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-3 border-b border-white/[0.06]">
              <Minus className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              <p className="text-[14px] text-text-muted">
                {t("dashboard.activity.empty")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
