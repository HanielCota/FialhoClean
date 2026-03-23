import { Moon, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAsyncState } from "../../../hooks/useAsyncState";
import type { HibernateSettings, StartupItem as StartupItemType } from "../../../types/optimizer";
import { AsyncView } from "../../shared/AsyncView";
import { EmptyState } from "../../shared/EmptyState";
import { SectionHeading } from "../../shared/SectionHeading";
import { SkeletonItem } from "../../shared/SkeletonItem";
import { ToggleSetting } from "../../shared/ToggleSetting";
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
  const startupStatus = useAsyncState(isLoading, null, startupItems.length === 0);

  return (
    <div className="space-y-7">
      <section>
        <SectionHeading>{t("optimizer.sections.sleepSettings")}</SectionHeading>
        <div className="space-y-2">
          <ToggleSetting
            icon={Moon}
            title={t("optimizer.hibernate.title")}
            description={t("optimizer.hibernate.description")}
            checked={hibernateSettings.hibernate_enabled}
            onChange={onSetHibernate}
          />
          <ToggleSetting
            icon={Zap}
            title={t("optimizer.fastStartup.title")}
            description={t("optimizer.fastStartup.description")}
            checked={hibernateSettings.fast_startup_enabled}
            onChange={onSetFastStartup}
          />
        </div>
      </section>

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
          empty={<EmptyState icon={Zap} message={t("optimizer.startup.empty")} />}
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
