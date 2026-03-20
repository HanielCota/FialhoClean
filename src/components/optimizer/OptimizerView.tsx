import { Flame, Power, Settings2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOptimizer } from "../../hooks/useOptimizer";
import { ErrorMessage } from "../shared/ErrorMessage";
import { Header } from "../layout/Header";
import { TabBar, type TabDef } from "../shared/TabBar";
import { BootTab } from "./tabs/BootTab";
import { PerformanceTab } from "./tabs/PerformanceTab";
import { PrivacyTab } from "./tabs/PrivacyTab";
import { ServicesTab } from "./tabs/ServicesTab";

type OptimizerTab = "performance" | "boot" | "privacy" | "services";

export function OptimizerView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<OptimizerTab>("performance");

  const {
    startupItems,
    services,
    powerPlans,
    isLoading,
    error,
    visualEffectsPerformanceMode,
    hibernateSettings,
    networkSettings,
    scheduledTasks,
    loadAll,
    toggleStartup,
    changeServiceStatus,
    changePowerPlan,
    setVisualEffects,
    applyUltimatePerformance,
    setHibernate,
    setFastStartup,
    applyGameMode,
    setNetworkOptimized,
    toggleScheduledTask,
  } = useOptimizer();

  const TABS: TabDef<OptimizerTab>[] = [
    { id: "performance", label: t("optimizer.tabs.performance"), Icon: Flame },
    { id: "boot",        label: t("optimizer.tabs.boot"),        Icon: Power },
    { id: "privacy",     label: t("optimizer.tabs.privacy"),     Icon: ShieldCheck },
    { id: "services",    label: t("optimizer.tabs.services"),    Icon: Settings2 },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="px-6 xl:px-8 pt-6 xl:pt-8 flex-shrink-0">
        <Header
          title={t("optimizer.title")}
          subtitle={t("optimizer.subtitle")}
          onRefresh={loadAll}
          isRefreshing={isLoading}
        />

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Tab bar */}
        <TabBar
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
          className="mt-2"
        />
      </div>

      {/* Scrollable tab content */}
      <div className="flex-1 overflow-y-auto px-6 xl:px-8 py-6">
        {activeTab === "performance" && (
          <PerformanceTab
            powerPlans={powerPlans}
            visualEffectsPerformanceMode={visualEffectsPerformanceMode}
            onChangePowerPlan={changePowerPlan}
            onSetVisualEffects={setVisualEffects}
            onApplyGameMode={applyGameMode}
            onApplyUltimatePerformance={applyUltimatePerformance}
          />
        )}

        {activeTab === "boot" && (
          <BootTab
            hibernateSettings={hibernateSettings}
            startupItems={startupItems}
            isLoading={isLoading}
            onSetHibernate={setHibernate}
            onSetFastStartup={setFastStartup}
            onToggleStartup={toggleStartup}
          />
        )}

        {activeTab === "privacy" && (
          <PrivacyTab
            networkSettings={networkSettings}
            scheduledTasks={scheduledTasks}
            onSetNetworkOptimized={setNetworkOptimized}
            onToggleScheduledTask={toggleScheduledTask}
          />
        )}

        {activeTab === "services" && (
          <ServicesTab
            services={services}
            onAction={changeServiceStatus}
          />
        )}
      </div>
    </div>
  );
}
