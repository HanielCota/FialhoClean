import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";
import type { ToastType } from "../../stores/uiStore";

function iconFor(type: ToastType) {
  if (type === "success") return <CheckCircle className="w-4 h-4 text-green flex-shrink-0" />;
  if (type === "error") return <AlertCircle className="w-4 h-4 text-red flex-shrink-0" />;
  if (type === "warning") return <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0" />;
  return <Info className="w-4 h-4 text-blue flex-shrink-0" />;
}

function roleFor(type: ToastType) {
  return type === "error" || type === "warning" ? "alert" : "status";
}

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore();
  const { t } = useTranslation();

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-5 z-50 flex w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={roleFor(toast.type)}
          aria-live={toast.type === "error" || toast.type === "warning" ? "assertive" : "polite"}
          aria-atomic="true"
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-card-elevated px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.5)] animate-slide-down"
        >
          {iconFor(toast.type)}
          <p className="flex-1 text-[14px] text-text">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            type="button"
            className="focus-ring rounded-md p-0.5 text-text-muted transition-colors hover:text-text"
            aria-label={t('common.dismiss')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
