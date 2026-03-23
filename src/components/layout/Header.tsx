import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ title, subtitle, onRefresh, isRefreshing }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="font-bold text-[26px] text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? t("common.refreshing") : t("common.refresh")}
          className="focus-ring flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-text-muted transition-all duration-150 hover:bg-white/5 hover:text-text disabled:opacity-40"
        >
          <RefreshCw className={`h-[18px] w-[18px] ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}
