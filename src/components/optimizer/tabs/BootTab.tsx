import { Moon, Zap } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { HibernateSettings, StartupItem as StartupItemType } from "../../../types/optimizer";
import { useAsyncState } from "../../../hooks/useAsyncState";
import { Card } from "../../shared/Card";
import { SectionHeading } from "../../shared/SectionHeading";
import { SkeletonItem } from "../../shared/SkeletonItem";
import { Toggle } from "../../shared/Toggle";
import { AsyncView } from "../../shared/AsyncView";
import { StartupItem } from "../StartupItem";

interface BootTabProps {
  hibernateSettings: HibernateSettings;
  startupItems: StartupItemType[];
  isLoading: boolean;
  onSetHibernate: (enabled: boolean) => void;
  onSetFastStartup: (enabled: boolean) => void;
  onToggleStartup: (name: string, keyPath: string, enabled: boolean) => void;
}

export function BootTab({
  hibernateSettings,
  startupItems,
  isLoading,
  onSetHibernate,
  onSetFastStartup,
  onToggleStartup,
}: BootTabProps) {
  const { t } = useTranslation();
  const hibernateLabelId = useId();
  const fastStartupLabelId = useId();

  const startupStatus = useAsyncState(isLoading, null, startupItems.length === 0);

  return (
    <div className="space-y-7">
      {/* Sleep & Boot */}
      <section>
        <SectionHeading>{t("optimizer.sections.sleepSettings")}</SectionHeading>
        <div className="space-y-2">
          <Card>
            <div className="flex items-center gap-4">
              <Moon className="w-5 h-5 text-text-muted flex-shrink-0" />
              <div className="flex-1">
                <p id={hibernateLabelId} className="text-[15px] font-semibold text-text">
                  {t("optimizer.hibernate.title")}
                </p>
                <p className="text-[13px] text-text-muted mt-1">
                  {t("optimizer.hibernate.description")}
                </p>
              </div>
              <Toggle
                checked={hibernateSettings.hibernate_enabled}
                onChange={onSetHibernate}
                aria-labelledby={hibernateLabelId}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <Zap className="w-5 h-5 text-text-muted flex-shrink-0" />
              <div className="flex-1">
                <p id={fastStartupLabelId} className="text-[15px] font-semibold text-text">
                  {t("optimizer.fastStartup.title")}
                </p>
                <p className="text-[13px] text-text-muted mt-1">
                  {t("optimizer.fastStartup.description")}
                </p>
              </div>
              <Toggle
                checked={hibernateSettings.fast_startup_enabled}
                onChange={onSetFastStartup}
                aria-labelledby={fastStartupLabelId}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Startup Programs */}
      <section>
        <SectionHeading>
          {t("optimizer.sections.startupPrograms")}
          {startupItems.length > 0 && (
            <span className="text-text-muted normal-case tracking-normal">
              {" "}—{" "}
              {t("optimizer.sections.startupCount", { count: startupItems.length })}
            </span>
          )}
        </SectionHeading>
        <AsyncView
          status={startupStatus}
          skeleton={
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <SkeletonItem key={i} height="h-[70px]" />
              ))}
            </div>
          }
          empty={
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Zap className="w-10 h-10 text-text-tertiary" />
              <p className="text-[14px] text-text-muted">
                {t("optimizer.startup.empty")}
              </p>
            </div>
          }
        >
          <div className="space-y-2">
            {startupItems.map((item) => (
              <StartupItem
                key={`${item.key_path}-${item.name}`}
                item={item}
                onToggle={onToggleStartup}
              />
            ))}
          </div>
        </AsyncView>
      </section>
    </div>
  );
}
