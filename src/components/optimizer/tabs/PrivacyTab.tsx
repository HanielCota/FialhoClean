import { CalendarClock, ChevronDown, ChevronUp, Info, Network } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NetworkSettings, PrivacySettings, ScheduledTask } from "../../../types/optimizer";
import { Card } from "../../shared/Card";
import { SectionHeading } from "../../shared/SectionHeading";
import { Toggle } from "../../shared/Toggle";

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
  const networkLabelId = useId();
  const [showTasks, setShowTasks] = useState(false);

  const disabledCount = scheduledTasks.filter(
    (task) => task.state === "Disabled"
  ).length;

  return (
    <div className="space-y-7">
      {/* Network Optimizer */}
      <section>
        <SectionHeading>{t("optimizer.sections.network")}</SectionHeading>
        <Card>
          <div className="flex items-center gap-4">
            <Network className="w-5 h-5 text-text-muted flex-shrink-0" />
            <div className="flex-1">
              <p id={networkLabelId} className="text-[15px] font-semibold text-text">
                {t("optimizer.network.title")}
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                {t("optimizer.network.description")}
              </p>
            </div>
            <Toggle
              checked={networkSettings.network_throttling_disabled}
              onChange={onSetNetworkOptimized}
              aria-labelledby={networkLabelId}
            />
          </div>
        </Card>
      </section>

      {/* Privacy Tweaks */}
      <section>
        <SectionHeading>{t("optimizer.sections.privacyTweaks")}</SectionHeading>
        <div className="space-y-2">
          {(
            [
              { key: "telemetry",        title: t("optimizer.privacy.telemetry.title"),       desc: t("optimizer.privacy.telemetry.description"),       value: privacySettings.telemetry_disabled },
              { key: "bing_search",      title: t("optimizer.privacy.bingSearch.title"),      desc: t("optimizer.privacy.bingSearch.description"),      value: privacySettings.bing_search_disabled },
              { key: "advertising_id",   title: t("optimizer.privacy.advertisingId.title"),   desc: t("optimizer.privacy.advertisingId.description"),   value: privacySettings.advertising_id_disabled },
              { key: "activity_history", title: t("optimizer.privacy.activityHistory.title"), desc: t("optimizer.privacy.activityHistory.description"), value: privacySettings.activity_history_disabled },
              { key: "location",         title: t("optimizer.privacy.location.title"),        desc: t("optimizer.privacy.location.description"),        value: privacySettings.location_disabled },
            ] as const
          ).map(({ key, title, desc, value }) => (
            <Card key={key}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-text">{title}</p>
                  <p className="text-[13px] text-text-muted mt-1">{desc}</p>
                </div>
                <Toggle
                  checked={value}
                  onChange={(v) => onSetPrivacy(key, v)}
                  aria-label={title}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Scheduled Tasks */}
      {scheduledTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading className="mb-0">
              {t("optimizer.sections.scheduledTasks")}
              {disabledCount > 0 && (
                <span className="text-text-muted normal-case tracking-normal">
                  {" "}—{" "}
                  {t("optimizer.tasks.disabledCount", { count: disabledCount })}
                </span>
              )}
            </SectionHeading>
            <span className="text-[12px] font-semibold text-text-muted uppercase tracking-widest">
              {t("optimizer.sections.telemetry")}
            </span>
          </div>

          {!showTasks ? (
            <div className="flex items-start gap-4 p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <Info className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-text">
                  {t("optimizer.tasksWarning.title")}
                </p>
                <p className="text-[13px] text-text-muted mt-1">
                  {t("optimizer.tasksWarning.message")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTasks(true)}
                className="focus-ring mt-0.5 flex flex-shrink-0 items-center gap-1.5 rounded-md text-[13px] font-semibold text-accent transition-colors hover:text-accent-hover"
              >
                {t("optimizer.tasksWarning.show")}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {scheduledTasks.map((task) => {
                  const isEnabled = task.state !== "Disabled";
                  return (
                    <div
                      key={task.task_path}
                      className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-card px-5 py-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-text truncate">
                          {task.name}
                        </p>
                        {task.description && (
                          <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
                        <span
                          className={`text-[12px] font-medium ${
                            isEnabled ? "text-emerald-400" : "text-text-muted/50"
                          }`}
                        >
                          {isEnabled
                            ? t("optimizer.task.enabled")
                            : t("optimizer.task.disabled")}
                        </span>
                        <Toggle
                          checked={isEnabled}
                          onChange={(v) =>
                            onToggleScheduledTask(task.task_path, v)
                          }
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
                <ChevronUp className="w-4 h-4" />
                {t("optimizer.tasksWarning.hide")}
              </button>
            </>
          )}
        </section>
      )}

      {/* Empty state if tasks haven't loaded yet */}
      {scheduledTasks.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarClock className="w-10 h-10 text-text-tertiary" />
          <p className="text-[14px] text-text-muted">
            {t("optimizer.tasks.empty")}
          </p>
        </div>
      )}
    </div>
  );
}
