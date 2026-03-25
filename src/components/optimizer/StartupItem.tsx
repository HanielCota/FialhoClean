import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { StartupItem as StartupItemType } from "../../types/optimizer";
import { ItemRow } from "../shared/ItemRow";
import { Toggle } from "../shared/Toggle";

interface StartupItemProps {
  item: StartupItemType;
  onToggle: (name: string, keyPath: string, enabled: boolean) => void;
}

type ImpactLevel = "slow" | "medium" | "fast";

const SLOW_KEYWORDS = [
  "discord",
  "steam",
  "epicgames",
  "epic games",
  "spotify",
  "onedrive",
  "dropbox",
  "googledrivesync",
  "googledrive",
  "teams",
  "zoom",
  "skype",
  "battle.net",
  "battlenet",
  "origin",
  "uplay",
  "ubisoft",
  "adobe",
  "acrotray",
  "jusched",
  "javaw",
  "malwarebytes",
  "mcafee",
  "norton",
  "avast",
  "avg ",
];

const FAST_PATHS = ["system32", "syswow64", "\\windows\\", "/windows/"];

function getStartupImpact(item: StartupItemType): ImpactLevel {
  const str = `${item?.name ?? ""} ${item?.command ?? ""}`.toLowerCase();
  if (SLOW_KEYWORDS.some((k) => str.includes(k))) return "slow";
  if (FAST_PATHS.some((p) => str.includes(p))) return "fast";
  return "medium";
}

const IMPACT_CONFIG: Record<ImpactLevel, { dot: string; text: string }> = {
  slow: { dot: "bg-red", text: "text-red" },
  medium: { dot: "bg-orange", text: "text-orange" },
  fast: { dot: "bg-green", text: "text-green" },
};

export const StartupItem = memo(function StartupItem({ item, onToggle }: StartupItemProps) {
  const { t } = useTranslation();
  const impact = getStartupImpact(item);
  const cfg = IMPACT_CONFIG[impact];

  const impactLabel =
    impact === "slow"
      ? t("optimizer.startup.impactSlow")
      : impact === "fast"
        ? t("optimizer.startup.impactFast")
        : t("optimizer.startup.impactMedium");

  return (
    <ItemRow
      title={item.name}
      subtitle={item.command}
      trailing={
        <>
          {/* Source badge */}
          <span className="text-[13px] text-text-muted/50">
            {item.source === "hkey_current_user"
              ? t("optimizer.startup.user")
              : t("optimizer.startup.system")}
          </span>

          {/* Startup impact pill */}
          <span
            className={`hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 font-medium text-[12px] sm:flex ${cfg.text}`}
            title={t("optimizer.startup.impactAria")}
          >
            <span className={`h-2 w-2 rounded-full ${cfg.dot} flex-shrink-0`} />
            {impactLabel}
          </span>

          <Toggle
            checked={item?.enabled ?? false}
            onChange={(enabled) => onToggle(item.name, item.key_path, enabled)}
            aria-label={item?.name ?? ""}
          />
        </>
      }
    />
  );
});
