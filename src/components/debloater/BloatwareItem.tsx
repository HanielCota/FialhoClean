import { memo } from "react";
import { useTranslation } from "react-i18next";
import { getSafetyVariant } from "../../lib/safety";
import type { AppInfo } from "../../types/debloater";
import { Badge } from "../shared/Badge";
import { Checkbox } from "../shared/Checkbox";
import { ItemRow } from "../shared/ItemRow";

interface BloatwareItemProps {
  app: AppInfo;
  selected: boolean;
  onToggle: (packageFullName: string) => void;
}

export const BloatwareItem = memo(function BloatwareItem({
  app,
  selected,
  onToggle,
}: BloatwareItemProps) {
  const { t } = useTranslation();

  const safetyVariant = getSafetyVariant(app?.safety_level);

  const safetyLabel =
    app?.safety_level === "safe"
      ? t("common.safe")
      : app?.safety_level === "caution"
        ? t("common.caution")
        : t("common.dangerous");

  return (
    <ItemRow
      as="button"
      role="checkbox"
      aria-checked={selected}
      onClick={() => onToggle(app.package_full_name)}
      className={`cursor-pointer border transition-all duration-150 ${
        selected ? "border-accent/20 bg-accent/5" : "border-white/5 bg-card hover:border-white/10"
      }`}
      leading={<Checkbox checked={selected} />}
      title={
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 flex-[1_1_140px] truncate font-medium text-[14px] text-text">
            {app.name}
          </span>
          <Badge label={safetyLabel} variant={safetyVariant} />
        </div>
      }
      subtitle={app.description}
    />
  );
});
