import { AlertTriangle, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ServiceAction, ServiceInfo } from "../../../types/optimizer";
import { ServiceItem } from "../ServiceItem";

interface ServicesTabProps {
  services: ServiceInfo[];
  onAction: (name: string, action: ServiceAction) => void;
}

export function ServicesTab({ services, onAction }: ServicesTabProps) {
  const { t } = useTranslation();
  const [showExpert, setShowExpert] = useState(false);

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Settings2 className="h-10 w-10 text-text-tertiary" />
        <p className="text-[14px] text-text-muted">{t("optimizer.services.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Expert warning banner */}
      {!showExpert ? (
        <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[14px] text-text">
              {t("optimizer.expertWarning.title")}
            </p>
            <p className="mt-1 text-[13px] text-text-muted">
              {t("optimizer.expertWarning.message")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowExpert(true)}
            className="focus-ring mt-0.5 flex flex-shrink-0 items-center gap-1.5 rounded-md font-semibold text-[13px] text-accent transition-colors hover:text-accent-hover"
            aria-label={t("optimizer.expertWarning.showAria")}
          >
            {t("optimizer.expertWarning.show")}
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {services.map((svc) => (
              <ServiceItem key={svc.name} service={svc} onAction={onAction} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowExpert(false)}
            className="focus-ring mt-1 flex items-center gap-1.5 rounded-md text-[13px] text-text-muted transition-colors hover:text-text"
          >
            <ChevronUp className="h-4 w-4" />
            {t("optimizer.expertWarning.hide")}
          </button>
        </>
      )}
    </div>
  );
}
