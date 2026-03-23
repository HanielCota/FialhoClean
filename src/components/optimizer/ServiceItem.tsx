import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getSafetyVariant } from "../../lib/safety";
import type { ServiceAction, ServiceInfo } from "../../types/optimizer";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { ItemRow } from "../shared/ItemRow";

interface ServiceItemProps {
  service: ServiceInfo;
  onAction: (name: string, action: ServiceAction) => Promise<void> | void;
}

export function ServiceItem({ service, onAction }: ServiceItemProps) {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<ServiceAction | null>(null);

  const handleAction = async (action: ServiceAction) => {
    setPendingAction(action);
    try {
      await onAction(service.name, action);
    } finally {
      setPendingAction(null);
    }
  };

  const isBusy = pendingAction !== null;

  const statusColor: "success" | "error" | "default" =
    service.status === "running" ? "success" : service.status === "stopped" ? "error" : "default";

  const safetyVariant = getSafetyVariant(service.safety_level);

  const statusLabel =
    service.status === "running"
      ? t("optimizer.service.status.running")
      : service.status === "stopped"
        ? t("optimizer.service.status.stopped")
        : service.status === "paused"
          ? t("optimizer.service.status.paused")
          : t("optimizer.service.status.unknown");

  const safetyLabel =
    service.safety_level === "not_recommended"
      ? t("optimizer.service.notRecommended")
      : service.safety_level === "safe"
        ? t("common.safe")
        : t("common.caution");

  return (
    <ItemRow
      title={
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-medium text-[15px] text-text">{service.display_name}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge label={statusLabel} variant={statusColor} />
            <Badge label={safetyLabel} variant={safetyVariant} />
          </div>
          {service.description ? (
            <p className="text-[13px] text-text-muted leading-relaxed">{service.description}</p>
          ) : (
            <p className="text-[13px] text-text-muted/60">{service.name}</p>
          )}
        </div>
      }
      subtitle={undefined}
      trailing={
        <div className="flex flex-wrap justify-end gap-2">
          {service.status === "running" ? (
            <Button
              size="sm"
              variant="secondary"
              loading={pendingAction === "stop"}
              disabled={isBusy}
              onClick={() => void handleAction("stop")}
              aria-label={t("optimizer.service.stopAria", { name: service.display_name })}
            >
              {t("optimizer.service.stop")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              loading={pendingAction === "start"}
              disabled={isBusy}
              onClick={() => void handleAction("start")}
              aria-label={t("optimizer.service.startAria", { name: service.display_name })}
            >
              {t("optimizer.service.start")}
            </Button>
          )}
          {service.start_type !== "disabled" ? (
            <Button
              size="sm"
              variant="danger"
              loading={pendingAction === "disable"}
              disabled={isBusy}
              onClick={() => void handleAction("disable")}
              aria-label={t("optimizer.service.disableAria", { name: service.display_name })}
            >
              {t("optimizer.service.disable")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              loading={pendingAction === "enable"}
              disabled={isBusy}
              onClick={() => void handleAction("enable")}
              aria-label={t("optimizer.service.enableAria", { name: service.display_name })}
            >
              {t("optimizer.service.enable")}
            </Button>
          )}
        </div>
      }
    />
  );
}
