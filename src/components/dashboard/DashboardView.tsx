import {
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Minus,
  RefreshCw,
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
import { ActionCard } from "../shared/ActionCard";
import { AsyncView } from "../shared/AsyncView";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";
import { SectionHeading } from "../shared/SectionHeading";

function relativeDate(
  isoDate: string,
  t: ReturnType<typeof import("react-i18next").useTranslation>["t"],
): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return t("dashboard.relative.today");
  if (diffDays === 1) return t("dashboard.relative.yesterday");
  return t("dashboard.relative.daysAgo", { count: diffDays });
}

function HealthDot({ color }: { color: "green" | "orange" | "red" }) {
  const cls = color === "green" ? "bg-green" : color === "orange" ? "bg-orange" : "bg-red";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} aria-hidden="true" />;
}

function getHealthKey(diskPct: number): {
  key: "good" | "better" | "attention";
  color: "green" | "orange" | "red";
} {
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
    <div className="rounded-xl border border-white/[0.06] bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-text-muted" />
        <span className="font-medium text-[13px] text-text-muted">{title}</span>
      </div>
      <p className="mb-0.5 font-semibold text-[17px] text-text">{main}</p>
      <p className="mb-2 text-[12px] text-text-muted">{sub}</p>
      {progress !== undefined && (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
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
  const diskPct = primaryDisk ? formatPercent(primaryDisk.used_bytes, primaryDisk.total_bytes) : 0;
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
    <div className="space-y-6 p-6 xl:p-8">
      <div>
        <p className="font-bold text-[28px] text-text leading-tight">
          {t("dashboard.healthIntro")}
        </p>
        {isLoading && !systemInfo ? (
          <p className="mt-1 font-bold text-[22px] text-text-muted">
            {t("dashboard.healthChecking")}
          </p>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <HealthDot color={health.color} />
            <p
              className={`font-bold text-[22px] ${
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
          <p className="mt-1 text-[12px] text-text-muted">
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
        <div className="mb-3 flex items-center justify-between">
          <SectionHeading className="mb-0">{t("dashboard.sections.systemStatus")}</SectionHeading>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            aria-label={isLoading ? t("common.refreshing") : t("dashboard.refresh")}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-white/5 hover:text-text disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <AsyncView
          status={statsStatus}
          skeleton={
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-shimmer rounded-xl border border-white/[0.06] bg-card"
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
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
                    const totalSeconds = systemInfo.uptime_seconds;
                    const days = Math.floor(totalSeconds / 86400);
                    const hours = Math.floor((totalSeconds % 86400) / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    if (days > 0) return t("dashboard.stats.uptimeDhm", { days, hours, minutes });
                    if (hours > 0) return t("dashboard.stats.uptimeHm", { hours, minutes });
                    return t("dashboard.stats.uptimeM", { minutes });
                  })()}
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
                <div
                  key={entry.id}
                  className="flex items-center gap-3 border-white/[0.06] border-b py-3"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-text">
                      {t("dashboard.activity.cleaned", {
                        size: formatBytes(entry.freed_bytes),
                        files: entry.deleted_count.toLocaleString(),
                      })}
                    </p>
                    <p className="text-[12px] text-text-muted/60">
                      {relativeDate(entry.date, t)} ·{" "}
                      {t("dashboard.activity.category", { count: entry.categories.length })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : cleanResult ? (
            <div className="flex items-center gap-3 border-white/[0.06] border-b py-3">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green" />
              <p className="text-[14px] text-text">
                {t("dashboard.activity.cleaned", {
                  size: formatBytes(cleanResult.freed_bytes),
                  files: cleanResult.deleted_count.toLocaleString(),
                })}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-white/[0.06] border-b py-3">
              <Minus className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <p className="text-[14px] text-text-muted">{t("dashboard.activity.empty")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
