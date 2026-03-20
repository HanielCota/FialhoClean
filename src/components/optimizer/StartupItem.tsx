import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { StartupItem as StartupItemType } from "../../types/optimizer";
import { ItemRow } from "../shared/ItemRow";
import { Toggle } from "../shared/Toggle";

interface StartupItemProps {
  item: StartupItemType;
  onToggle: (name: string, keyPath: string, enabled: boolean) => void;
}

export const StartupItem = memo(function StartupItem({
  item,
  onToggle,
}: StartupItemProps) {
  const { t } = useTranslation();

  return (
    <ItemRow
      title={item.name}
      subtitle={item.command}
      trailing={
        <>
          <span className="text-[12px] text-text-muted/50">
            {item.source === "hkey_current_user" ? t('optimizer.startup.user') : t('optimizer.startup.system')}
          </span>
          <Toggle
            checked={item.enabled}
            onChange={(enabled) => onToggle(item.name, item.key_path, enabled)}
            aria-label={item.name}
          />
        </>
      }
    />
  );
});
