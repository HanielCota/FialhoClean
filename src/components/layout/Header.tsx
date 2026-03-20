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
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-[22px] font-bold text-text">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? t('common.refreshing') : t('common.refresh')}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition-all duration-150 hover:bg-white/5 hover:text-text disabled:opacity-40"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
