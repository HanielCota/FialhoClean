import * as Dialog from "@radix-ui/react-dialog";
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

export function Modal({
  open,
  title,
  children,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  loading = false,
}: ModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !loading) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-6 z-50 mx-auto w-[calc(100%-2rem)] max-w-sm animate-slide-up rounded-2xl border border-white/[0.10] bg-card-elevated p-6 shadow-[0_8px_32px_rgba(0,0,0,0.7)] focus:outline-none"
          aria-busy={loading}
          onEscapeKeyDown={loading ? (e) => e.preventDefault() : undefined}
          onPointerDownOutside={loading ? (e) => e.preventDefault() : undefined}
        >
          <Dialog.Title className="mb-3 font-semibold text-[17px] text-text">{title}</Dialog.Title>
          <Dialog.Description asChild>
            <div className="mb-6 space-y-2 text-[14px] text-text-muted">{children}</div>
          </Dialog.Description>
          <div className="flex flex-col gap-2">
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              loading={loading}
              className="w-full"
            >
              {confirmLabel ?? t("common.confirm")}
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={loading} className="w-full">
              {t("common.cancel")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
