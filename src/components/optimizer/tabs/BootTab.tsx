import { Moon, Zap } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncState } from "../../../hooks/useAsyncState";
import type { HibernateSettings, StartupItem as StartupItemType } from "../../../types/optimizer";
import { AsyncView } from "../../shared/AsyncView";
import { Card } from "../../shared/Card";
import { SectionHeading } from "../../shared/SectionHeading";
import { SkeletonItem } from "../../shared/SkeletonItem";
import { Toggle } from "../../shared/Toggle";
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
            <div className="flex items-start gap-4">
              <Moon className="h-5 w-5 flex-shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p id={hibernateLabelId} className="font-semibold text-[15px] text-text">
                  {t("optimizer.hibernate.title")}
                </p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {t("optimizer.hibernate.description")}
                </p>
              </div>
              <div className="mt-0.5 flex-shrink-0">
                <Toggle
                  checked={hibernateSettings.hibernate_enabled}
                  onChange={onSetHibernate}
                  aria-labelledby={hibernateLabelId}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <Zap className="h-5 w-5 flex-shrink-0 text-text-muted" />
              <div className="min-w-0 flex-1">
                <p id={fastStartupLabelId} className="font-semibold text-[15px] text-text">
                  {t("optimizer.fastStartup.title")}
                </p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {t("optimizer.fastStartup.description")}
                </p>
              </div>
              <div className="mt-0.5 flex-shrink-0">
                <Toggle
                  checked={hibernateSettings.fast_startup_enabled}
                  onChange={onSetFastStartup}
                  aria-labelledby={fastStartupLabelId}
                />
              </div>
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
              {" "}
              — {t("optimizer.sections.startupCount", { count: startupItems.length })}
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
              <Zap className="h-10 w-10 text-text-tertiary" />
              <p className="text-[14px] text-text-muted">{t("optimizer.startup.empty")}</p>
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
