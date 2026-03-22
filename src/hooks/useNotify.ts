import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { TFunction } from "i18next";
import { TOAST_DURATIONS } from "../constants/ui";

type ToastType = "success" | "error" | "warning" | "info";

export function useNotify() {
  const { t } = useTranslation();
  const tRef = useRef<TFunction>(t);
  tRef.current = t;

  return useCallback(
    (key: string, type: ToastType, params?: Record<string, unknown>) => {
      const message = (tRef.current as any)(key, params ?? {});
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
    },
    []
  );
}
