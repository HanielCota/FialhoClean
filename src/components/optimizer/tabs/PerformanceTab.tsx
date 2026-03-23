import { BatteryCharging, Flame, MemoryStick, Monitor, Zap } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GpuSettings, PowerPlan } from "../../../types/optimizer";
import { Card } from "../../shared/Card";
import { SectionHeading } from "../../shared/SectionHeading";
import { Toggle } from "../../shared/Toggle";

const ULTIMATE_PERF_GUID = "e9a42b02-d5df-448d-aa00-03f14749eb61";

interface PerformanceTabProps {
  powerPlans: PowerPlan[];
  visualEffectsPerformanceMode: boolean;
  gpuSettings: GpuSettings;
  isOptimizingRam: boolean;
  onChangePowerPlan: (guid: string) => void;
  onSetVisualEffects: (enabled: boolean) => void;
  onApplyGameMode: () => Promise<void>;
  onApplyUltimatePerformance: () => Promise<void>;
  onOptimizeRam: () => Promise<void>;
  onSetGpuHags: (enabled: boolean) => void;
}

export function PerformanceTab({
  powerPlans,
  visualEffectsPerformanceMode,
  gpuSettings,
  isOptimizingRam,
  onChangePowerPlan,
  onSetVisualEffects,
  onApplyGameMode,
  onApplyUltimatePerformance,
  onOptimizeRam,
  onSetGpuHags,
}: PerformanceTabProps) {
  const { t } = useTranslation();
  const visualLabelId = useId();
  const [gameModeApplied, setGameModeApplied] = useState(false);
  const [ultimateApplying, setUltimateApplying] = useState(false);

  const activePlan = powerPlans.find((p) => p.is_active);
  const ultimateIsActive = powerPlans.some(
    (p) =>
      p.is_active &&
      (p.guid.toLowerCase() === ULTIMATE_PERF_GUID || p.name.toLowerCase().includes("ultimate")),
  );

  const handleApplyGameMode = async () => {
    await onApplyGameMode();
    setGameModeApplied(true);
    setTimeout(() => setGameModeApplied(false), 3000);
  };

  const handleApplyUltimatePerformance = async () => {
    setUltimateApplying(true);
    try {
      await onApplyUltimatePerformance();
    } finally {
      setUltimateApplying(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Power Mode */}
      {powerPlans.length > 0 && (
        <section>
          <SectionHeading>{t("optimizer.sections.powerMode")}</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {powerPlans.map((plan) => (
              <button
                key={plan.guid}
                type="button"
                onClick={() => onChangePowerPlan(plan.guid)}
                aria-pressed={plan.is_active}
                className={`focus-ring flex h-12 items-center gap-2 rounded-[10px] border px-5 font-semibold text-[14px] transition-all duration-150 ${
                  plan.is_active
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-white/[0.06] bg-card text-text-muted hover:bg-card-hover hover:text-text"
                }`}
              >
                {plan.is_active && <Zap className="h-4 w-4" />}
                {plan.name}
              </button>
            ))}
          </div>
          {activePlan && (
            <p className="mt-2.5 text-[13px] text-text-muted">
              {t("optimizer.activePlan", { name: activePlan.name })}
            </p>
          )}
        </section>
      )}

      {/* Visual Effects */}
      <section>
        <SectionHeading>{t("optimizer.sections.visualEffects")}</SectionHeading>
        <Card>
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p id={visualLabelId} className="font-semibold text-[15px] text-text">
                {t("optimizer.visualEffects.title")}
              </p>
              <p className="mt-1 text-[13px] text-text-muted">
                {t("optimizer.visualEffects.description")}
              </p>
            </div>
            <div className="mt-0.5 flex-shrink-0">
              <Toggle
                checked={visualEffectsPerformanceMode}
                onChange={onSetVisualEffects}
                aria-labelledby={visualLabelId}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* GPU HAGS */}
      <section>
        <SectionHeading>{t("optimizer.sections.gpuScheduling")}</SectionHeading>
        <Card>
          <div className="flex items-start gap-4">
            <Monitor className="h-5 w-5 flex-shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[15px] text-text">{t("optimizer.gpuHags.title")}</p>
              <p className="mt-1 text-[13px] text-text-muted">
                {t("optimizer.gpuHags.description")}
              </p>
            </div>
            <div className="mt-0.5 flex-shrink-0">
              <Toggle
                checked={gpuSettings.hags_enabled}
                onChange={onSetGpuHags}
                aria-label={t("optimizer.gpuHags.title")}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* RAM Optimizer */}
      <section>
        <SectionHeading>{t("optimizer.sections.ramOptimizer")}</SectionHeading>
        <Card>
          <div className="flex items-start gap-4">
            <MemoryStick className="h-5 w-5 flex-shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[15px] text-text">
                {t("optimizer.ramOptimizer.title")}
              </p>
              <p className="mt-1 text-[13px] text-text-muted">
                {t("optimizer.ramOptimizer.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onOptimizeRam()}
              disabled={isOptimizingRam}
              className="focus-ring mt-0.5 flex h-10 flex-shrink-0 items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-5 font-semibold text-[14px] text-text-muted transition-all duration-200 hover:bg-white/[0.07] hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isOptimizingRam ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
              ) : (
                <MemoryStick className="h-4 w-4" />
              )}
              {t("optimizer.ramOptimizer.button")}
            </button>
          </div>
        </Card>
      </section>

      {/* Game Mode */}
      <section>
        <SectionHeading>{t("optimizer.sections.gameMode")}</SectionHeading>
        <Card>
          <div className="flex items-start gap-4">
            <Flame className="h-5 w-5 flex-shrink-0 text-text-muted" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[15px] text-text">{t("optimizer.gameMode.title")}</p>
              <p className="mt-1 text-[13px] text-text-muted">
                {t("optimizer.gameMode.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleApplyGameMode()}
              className={`focus-ring mt-0.5 flex h-10 flex-shrink-0 items-center gap-2 rounded-[10px] border px-5 font-semibold text-[14px] transition-all duration-200 ${
                gameModeApplied
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15"
              }`}
            >
              {gameModeApplied ? t("optimizer.gameMode.applied") : t("optimizer.gameMode.apply")}
            </button>
          </div>
        </Card>
      </section>

      {/* Ultimate Performance */}
      <section>
        <SectionHeading>{t("optimizer.ultimatePerformance.title")}</SectionHeading>
        <Card className={ultimateIsActive ? "border-accent/20 bg-accent/[0.04]" : undefined}>
          <div className="flex items-start gap-4">
            <BatteryCharging
              className={`h-5 w-5 flex-shrink-0 ${
                ultimateIsActive ? "text-accent" : "text-text-muted"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[15px] text-text">
                {t("optimizer.ultimatePerformance.title")}
              </p>
              <p className="mt-1 text-[13px] text-text-muted">
                {t("optimizer.ultimatePerformance.description")}
              </p>
            </div>
            {ultimateIsActive ? (
              <span className="mt-0.5 flex h-10 flex-shrink-0 items-center gap-1.5 rounded-[8px] border border-accent/30 bg-accent/10 px-4 font-semibold text-[14px] text-accent">
                <Zap className="h-4 w-4" />
                {t("optimizer.ultimatePerformance.active")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleApplyUltimatePerformance()}
                disabled={ultimateApplying}
                className="focus-ring mt-0.5 flex h-10 flex-shrink-0 items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-5 font-semibold text-[14px] text-accent transition-all duration-200 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ultimateApplying ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
                ) : (
                  <BatteryCharging className="h-4 w-4" />
                )}
                {t("optimizer.ultimatePerformance.activate")}
              </button>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
