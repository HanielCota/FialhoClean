import { useTranslation } from "react-i18next";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "caution" | "info";
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const { t } = useTranslation();

  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-white/5 text-text-muted",
    success: "bg-green/[0.15] text-green",
    warning: "bg-orange/[0.15] text-orange",
    error: "bg-red/[0.15] text-red",
    caution: "bg-orange/[0.15] text-orange",
    info: "bg-blue/[0.15] text-blue",
  };

  const ariaLabelMap: Partial<Record<NonNullable<BadgeProps["variant"]>, string>> = {
    success: t("common.safety.safe"),
    caution: t("common.safety.caution"),
    error: t("common.safety.danger"),
  };

  const ariaLabel = ariaLabelMap[variant] ?? label;

  return (
    <span
      role="status"
      className={`inline-flex h-5 items-center rounded px-2 font-semibold text-[11px] ${variants[variant] ?? variants.default}`}
      aria-label={ariaLabel}
    >
      {label}
    </span>
  );
}
