import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  initialFocus?: "cancel" | "confirm";
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function Modal({
  open,
  title,
  children,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  loading = false,
  initialFocus = "cancel",
}: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const dialog = dialogRef.current;
    const target =
      initialFocus === "confirm" ? confirmRef.current ?? dialog : cancelRef.current ?? dialog;
    target?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialog) return;

      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [initialFocus, loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onCancel}
      />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={loading}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.10] bg-card-elevated p-6 shadow-[0_8px_32px_rgba(0,0,0,0.7)] animate-slide-up"
      >
        <h2 id={titleId} className="mb-3 text-[17px] font-semibold text-text">
          {title}
        </h2>
        <div id={descriptionId} className="mb-6 space-y-2 text-[14px] text-text-muted">
          {children}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            ref={confirmRef}
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            className="w-full"
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
          <Button
            ref={cancelRef}
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="w-full"
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
