import { useTranslation } from "react-i18next";
import { getSafetyVariant } from "../../lib/safety";
import type { ServiceAction, ServiceInfo } from "../../types/optimizer";
import { Badge } from "../shared/Badge";
import { Button } from "../shared/Button";
import { ItemRow } from "../shared/ItemRow";

interface ServiceItemProps {
  service: ServiceInfo;
  onAction: (name: string, action: ServiceAction) => void;
}

export function ServiceItem({ service, onAction }: ServiceItemProps) {
  const { t } = useTranslation();

  const statusColor: "success" | "error" | "default" =
    service.status === "running"
      ? "success"
      : service.status === "stopped"
      ? "error"
      : "default";

  const safetyVariant = getSafetyVariant(service.safety_level);

  const statusLabel =
    service.status === "running"
      ? t('optimizer.service.status.running')
      : service.status === "stopped"
      ? t('optimizer.service.status.stopped')
      : service.status === "paused"
      ? t('optimizer.service.status.paused')
      : t('optimizer.service.status.unknown');

  const safetyLabel =
    service.safety_level === "not_recommended"
      ? t('optimizer.service.notRecommended')
      : service.safety_level === "safe"
      ? t('common.safe')
      : t('common.caution');

  return (
    <ItemRow
      title={
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium text-text">{service.display_name}</p>
          <Badge label={statusLabel} variant={statusColor} />
          <Badge label={safetyLabel} variant={safetyVariant} />
        </div>
      }
      subtitle={service.name}
      trailing={
        <div className="flex gap-2">
          {service.status === "running" ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAction(service.name, "stop")}
              aria-label={t('optimizer.service.stopAria', { name: service.display_name })}
            >
              {t('optimizer.service.stop')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAction(service.name, "start")}
              aria-label={t('optimizer.service.startAria', { name: service.display_name })}
            >
              {t('optimizer.service.start')}
            </Button>
          )}
          {service.start_type !== "disabled" ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onAction(service.name, "disable")}
              aria-label={t('optimizer.service.disableAria', { name: service.display_name })}
            >
              {t('optimizer.service.disable')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAction(service.name, "enable")}
              aria-label={t('optimizer.service.enableAria', { name: service.display_name })}
            >
              {t('optimizer.service.enable')}
            </Button>
          )}
        </div>
      }
    />
  );
}
