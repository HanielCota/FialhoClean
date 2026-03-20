import { AlertTriangle, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOptimizer } from "../../hooks/useOptimizer";
import { useAsyncState } from "../../hooks/useAsyncState";
import { Card } from "../shared/Card";
import { ErrorMessage } from "../shared/ErrorMessage";
import { Header } from "../layout/Header";
import { AsyncView } from "../shared/AsyncView";
import { SectionHeading } from "../shared/SectionHeading";
import { SkeletonItem } from "../shared/SkeletonItem";
import { Toggle } from "../shared/Toggle";
import { ServiceItem } from "./ServiceItem";
import { StartupItem } from "./StartupItem";

export function OptimizerView() {
  const { t } = useTranslation();
  const {
    startupItems,
    services,
    powerPlans,
    isLoading,
    error,
    visualEffectsPerformanceMode,
    loadAll,
    toggleStartup,
    changeServiceStatus,
    changePowerPlan,
    setVisualEffects,
  } = useOptimizer();

  const [showExpertMode, setShowExpertMode] = useState(false);
  const visualEffectsLabelId = useId();

  const activePlan = powerPlans.find((p) => p.is_active);
  const startupStatus = useAsyncState(isLoading, null, startupItems.length === 0);

  return (
    <div className="p-6 xl:p-8">
      <Header
        title={t('optimizer.title')}
        subtitle={t('optimizer.subtitle')}
        onRefresh={loadAll}
        isRefreshing={isLoading}
      />

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="space-y-6">
        {/* Power Mode */}
        {powerPlans.length > 0 && (
          <section>
            <SectionHeading>{t('optimizer.sections.powerMode')}</SectionHeading>
            <div className="flex gap-2 flex-wrap">
              {powerPlans.map((plan) => (
                <button
                  key={plan.guid}
                  type="button"
                  onClick={() => changePowerPlan(plan.guid)}
                  aria-pressed={plan.is_active}
                  className={`focus-ring flex h-11 items-center gap-2 rounded-[10px] border px-4 text-[14px] font-semibold transition-all duration-150 ${
                    plan.is_active
                      ? "bg-accent/10 text-accent border-accent/30"
                      : "bg-card text-text-muted border-white/[0.06] hover:text-text hover:bg-card-hover"
                  }`}
                >
                  {plan.is_active && <Zap className="w-3.5 h-3.5" />}
                  {plan.name}
                </button>
              ))}
            </div>
            {activePlan && (
              <p className="text-[12px] text-text-muted mt-2">
                {t('optimizer.activePlan', { name: activePlan.name })}
              </p>
            )}
          </section>
        )}

        {/* Visual Effects */}
        <section>
          <SectionHeading>{t('optimizer.sections.visualEffects')}</SectionHeading>
          <Card>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p id={visualEffectsLabelId} className="text-[14px] font-semibold text-text">
                  {t('optimizer.visualEffects.title')}
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  {t('optimizer.visualEffects.description')}
                </p>
              </div>
              <Toggle
                checked={visualEffectsPerformanceMode}
                onChange={(v) => setVisualEffects(v)}
                aria-labelledby={visualEffectsLabelId}
              />
            </div>
          </Card>
        </section>

        {/* Startup Programs */}
        <section>
          <SectionHeading>
            {t('optimizer.sections.startupPrograms')}
            {startupItems.length > 0 && (
              <span className="text-text-muted normal-case tracking-normal">
                {" "}— {t('optimizer.sections.startupCount', { count: startupItems.length })}
              </span>
            )}
          </SectionHeading>
          <AsyncView
            status={startupStatus}
            skeleton={
              <div className="space-y-2">
                {[0, 1, 2].map((i) => <SkeletonItem key={i} height="h-14" />)}
              </div>
            }
            empty={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Zap className="w-8 h-8 text-text-tertiary" />
                <p className="text-[13px] text-text-muted">{t('optimizer.startup.empty')}</p>
              </div>
            }
          >
            <div className="space-y-2">
              {startupItems.map((item) => (
                <StartupItem
                  key={`${item.key_path}-${item.name}`}
                  item={item}
                  onToggle={toggleStartup}
                />
              ))}
            </div>
          </AsyncView>
        </section>

        {/* Background Services — Expert Mode */}
        {services.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionHeading className="mb-0">
                {t('optimizer.sections.backgroundServices')}
              </SectionHeading>
              <span className="text-[11px] font-semibold text-orange uppercase tracking-widest">
                {t('optimizer.sections.expertMode')}
              </span>
            </div>

            {!showExpertMode ? (
              <div className="flex items-start gap-3 p-4 bg-orange/[0.07] border border-orange/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-text">
                    {t('optimizer.expertWarning.title')}
                  </p>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    {t('optimizer.expertWarning.message')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExpertMode(true)}
                  className="focus-ring mt-0.5 flex flex-shrink-0 items-center gap-1 rounded-md text-[12px] font-semibold text-accent transition-colors hover:text-accent-hover"
                  aria-label={t('optimizer.expertWarning.showAria')}
                >
                  {t('optimizer.expertWarning.show')}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <ServiceItem
                      key={svc.name}
                      service={svc}
                      onAction={changeServiceStatus}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowExpertMode(false)}
                  className="focus-ring mt-3 flex items-center gap-1 rounded-md text-[12px] text-text-muted transition-colors hover:text-text"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  {t('optimizer.expertWarning.hide')}
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
