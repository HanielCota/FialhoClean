import { CalendarClock, ChevronDown, ChevronUp, Info, Network } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { NetworkSettings, PrivacySettings, ScheduledTask } from "../../../types/optimizer";
import { EmptyState } from "../../shared/EmptyState";
import { SectionHeading } from "../../shared/SectionHeading";
import { Toggle } from "../../shared/Toggle";
import { ToggleSetting } from "../../shared/ToggleSetting";

interface PrivacyTabProps {
  networkSettings: NetworkSettings;
  scheduledTasks: ScheduledTask[];
  privacySettings: PrivacySettings;
  onSetNetworkOptimized: (enabled: boolean) => void;
  onToggleScheduledTask: (taskPath: string, enabled: boolean) => void;
  onSetPrivacy: (key: string, disabled: boolean) => void;
}

export function PrivacyTab({
  networkSettings,
  scheduledTasks,
  privacySettings,
  onSetNetworkOptimized,
  onToggleScheduledTask,
  onSetPrivacy,
}: PrivacyTabProps) {
  const { t } = useTranslation();
  const [showTasks, setShowTasks] = useState(false);

  const disabledCount = (scheduledTasks ?? []).filter((task) => task.state === "Disabled").length;

  const privacyToggles = [
    {
      key: "telemetry",
      title: t("optimizer.privacy.telemetry.title"),
      description: t("optimizer.privacy.telemetry.description"),
      checked: privacySettings?.telemetry_disabled ?? false,
    },
    {
      key: "bing_search",
      title: t("optimizer.privacy.bingSearch.title"),
      description: t("optimizer.privacy.bingSearch.description"),
      checked: privacySettings?.bing_search_disabled ?? false,
    },
    {
      key: "advertising_id",
      title: t("optimizer.privacy.advertisingId.title"),
      description: t("optimizer.privacy.advertisingId.description"),
      checked: privacySettings?.advertising_id_disabled ?? false,
    },
    {
      key: "activity_history",
      title: t("optimizer.privacy.activityHistory.title"),
      description: t("optimizer.privacy.activityHistory.description"),
      checked: privacySettings?.activity_history_disabled ?? false,
    },
    {
      key: "location",
      title: t("optimizer.privacy.location.title"),
      description: t("optimizer.privacy.location.description"),
      checked: privacySettings?.location_disabled ?? false,
    },
  ] as const;

  return (
    <div className="space-y-7">
      {/* Network Optimizer */}
      <section>
        <SectionHeading>{t("optimizer.sections.network")}</SectionHeading>
        <ToggleSetting
          icon={Network}
          title={t("optimizer.network.title")}
          description={t("optimizer.network.description")}
          checked={networkSettings?.network_throttling_disabled ?? false}
          onChange={onSetNetworkOptimized}
        />
      </section>

      {/* Privacy Tweaks */}
      <section>
        <SectionHeading>{t("optimizer.sections.privacyTweaks")}</SectionHeading>
        <div className="space-y-2">
          {privacyToggles.map(({ key, title, description, checked }) => (
            <ToggleSetting
              key={key}
              title={title}
              description={description}
              checked={checked}
              onChange={(value) => onSetPrivacy(key, value)}
            />
          ))}
        </div>
      </section>

      {/* Scheduled Tasks */}
      {(scheduledTasks?.length ?? 0) > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionHeading className="mb-0">
              {t("optimizer.sections.scheduledTasks")}
              {disabledCount > 0 && (
                <span className="text-text-muted normal-case tracking-normal">
                  {" "}
                  — {t("optimizer.tasks.disabledCount", { count: disabledCount })}
                </span>
              )}
            </SectionHeading>
            <span className="font-semibold text-[12px] text-text-muted uppercase tracking-widest">
              {t("optimizer.sections.telemetry")}
            </span>
          </div>

          {!showTasks ? (
            <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[14px] text-text">
                  {t("optimizer.tasksWarning.title")}
                </p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {t("optimizer.tasksWarning.message")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTasks(true)}
                className="focus-ring mt-0.5 flex flex-shrink-0 items-center gap-1.5 rounded-md font-semibold text-[13px] text-accent transition-colors hover:text-accent-hover"
              >
                {t("optimizer.tasksWarning.show")}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {scheduledTasks?.map((task) => {
                  const isEnabled = task.state !== "Disabled";
                  return (
                    <div
                      key={task.task_path}
                      className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-card px-5 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[14px] text-text">{task.name}</p>
                        {task.description && (
                          <p className="mt-1 text-[13px] text-text-muted leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-shrink-0 items-center gap-2.5">
                        <span
                          className={`font-medium text-[12px] ${
                            isEnabled ? "text-emerald-400" : "text-text-muted/50"
                          }`}
                        >
                          {isEnabled ? t("optimizer.task.enabled") : t("optimizer.task.disabled")}
                        </span>
                        <Toggle
                          checked={isEnabled}
                          onChange={(value) => onToggleScheduledTask(task.task_path, value)}
                          aria-label={task.name}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowTasks(false)}
                className="focus-ring mt-3 flex items-center gap-1.5 rounded-md text-[13px] text-text-muted transition-colors hover:text-text"
              >
                <ChevronUp className="h-4 w-4" />
                {t("optimizer.tasksWarning.hide")}
              </button>
            </>
          )}
        </section>
      )}

      {(scheduledTasks?.length ?? 0) === 0 && (
        <EmptyState icon={CalendarClock} message={t("optimizer.tasks.empty")} />
      )}
    </div>
  );
}
