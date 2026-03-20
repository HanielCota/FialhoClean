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
      (p.guid.toLowerCase() === ULTIMATE_PERF_GUID ||
        p.name.toLowerCase().includes("ultimate"))
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
          <div className="flex gap-2 flex-wrap">
            {powerPlans.map((plan) => (
              <button
                key={plan.guid}
                type="button"
                onClick={() => onChangePowerPlan(plan.guid)}
                aria-pressed={plan.is_active}
                className={`focus-ring flex h-12 items-center gap-2 rounded-[10px] border px-5 text-[14px] font-semibold transition-all duration-150 ${
                  plan.is_active
                    ? "bg-accent/10 text-accent border-accent/30"
                    : "bg-card text-text-muted border-white/[0.06] hover:text-text hover:bg-card-hover"
                }`}
              >
                {plan.is_active && <Zap className="w-4 h-4" />}
                {plan.name}
              </button>
            ))}
          </div>
          {activePlan && (
            <p className="text-[13px] text-text-muted mt-2.5">
              {t("optimizer.activePlan", { name: activePlan.name })}
            </p>
          )}
        </section>
      )}

      {/* Visual Effects */}
      <section>
        <SectionHeading>{t("optimizer.sections.visualEffects")}</SectionHeading>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p id={visualLabelId} className="text-[15px] font-semibold text-text">
                {t("optimizer.visualEffects.title")}
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {t("optimizer.visualEffects.description")}
              </p>
            </div>
            <Toggle
              checked={visualEffectsPerformanceMode}
              onChange={onSetVisualEffects}
              aria-labelledby={visualLabelId}
            />
          </div>
        </Card>
      </section>

      {/* GPU HAGS */}
      <section>
        <SectionHeading>{t("optimizer.sections.gpuScheduling")}</SectionHeading>
        <Card>
          <div className="flex items-center gap-4">
            <Monitor className="w-5 h-5 text-text-muted flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-text">
                {t("optimizer.gpuHags.title")}
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {t("optimizer.gpuHags.description")}
              </p>
            </div>
            <Toggle
              checked={gpuSettings.hags_enabled}
              onChange={onSetGpuHags}
              aria-label={t("optimizer.gpuHags.title")}
            />
          </div>
        </Card>
      </section>

      {/* RAM Optimizer */}
      <section>
        <SectionHeading>{t("optimizer.sections.ramOptimizer")}</SectionHeading>
        <Card>
          <div className="flex items-center gap-4">
            <MemoryStick className="w-5 h-5 text-text-muted flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-text">
                {t("optimizer.ramOptimizer.title")}
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {t("optimizer.ramOptimizer.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onOptimizeRam()}
              disabled={isOptimizingRam}
              className="focus-ring flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-5 h-10 text-[14px] font-semibold text-text-muted hover:text-text hover:bg-white/[0.07] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizingRam ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              ) : (
                <MemoryStick className="w-4 h-4" />
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
          <div className="flex items-center gap-4">
            <Flame className="w-5 h-5 text-text-muted flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-text">
                {t("optimizer.gameMode.title")}
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {t("optimizer.gameMode.description")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleApplyGameMode()}
              className={`focus-ring flex items-center gap-2 rounded-[10px] border px-5 h-10 text-[14px] font-semibold transition-all duration-200 ${
                gameModeApplied
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-accent/10 border-accent/30 text-accent hover:bg-accent/15"
              }`}
            >
              {gameModeApplied
                ? t("optimizer.gameMode.applied")
                : t("optimizer.gameMode.apply")}
            </button>
          </div>
        </Card>
      </section>

      {/* Ultimate Performance */}
      <section>
        <SectionHeading>{t("optimizer.ultimatePerformance.title")}</SectionHeading>
        <Card className={ultimateIsActive ? "border-accent/20 bg-accent/[0.04]" : undefined}>
          <div className="flex items-center gap-4">
            <BatteryCharging
              className={`w-5 h-5 flex-shrink-0 ${
                ultimateIsActive ? "text-accent" : "text-text-muted"
              }`}
            />
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-text">
                {t("optimizer.ultimatePerformance.title")}
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {t("optimizer.ultimatePerformance.description")}
              </p>
            </div>
            {ultimateIsActive ? (
              <span className="flex items-center gap-1.5 rounded-[8px] border border-accent/30 bg-accent/10 px-4 h-10 text-[14px] font-semibold text-accent">
                <Zap className="w-4 h-4" />
                {t("optimizer.ultimatePerformance.active")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleApplyUltimatePerformance()}
                disabled={ultimateApplying}
                className="focus-ring flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/10 px-5 h-10 text-[14px] font-semibold text-accent hover:bg-accent/15 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ultimateApplying ? (
                  <span className="w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                ) : (
                  <BatteryCharging className="w-4 h-4" />
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
