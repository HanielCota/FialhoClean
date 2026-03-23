import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface CautionBannerProps {
  title?: string;
  message: string | ReactNode;
  className?: string;
}

export function CautionBanner({ title, message, className = "" }: CautionBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-amber-400/20 bg-white/[0.03] p-4 ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
      <div className="min-w-0">
        {title && <p className="font-semibold text-[13px] text-text">{title}</p>}
        {typeof message === "string" ? (
          <p className={`text-[13px] text-text-muted ${title ? "mt-0.5" : ""}`}>{message}</p>
        ) : (
          message
        )}
      </div>
    </div>
  );
}
