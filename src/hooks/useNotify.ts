import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { TOAST_DURATIONS } from "../constants/ui";

type ToastType = "success" | "error" | "warning" | "info";
type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

export function useNotify() {
  const { t } = useTranslation();
  const tRef = useRef<TranslateFn>(t as TranslateFn);
  tRef.current = t as TranslateFn;

  return useCallback((key: string, type: ToastType, params?: Record<string, unknown>) => {
    const message = tRef.current(key, params);
    const duration = TOAST_DURATIONS[type];

    switch (type) {
      case "success":
        toast.success(message, { duration });
        break;
      case "error":
        toast.error(message, { duration });
        break;
      case "warning":
        toast.warning(message, { duration });
        break;
      case "info":
        toast.info(message, { duration });
        break;
    }
  }, []);
}
