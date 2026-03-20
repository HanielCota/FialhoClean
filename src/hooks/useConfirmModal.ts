import { useState } from "react";

/**
 * Encapsulates the open/close state for a destructive-action confirmation modal.
 * Eliminates the `useState(false)` + inline open/confirm/cancel boilerplate.
 *
 * @param action - Async or sync function to call after the user confirms.
 */
export function useConfirmModal(action: () => void | Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);

  const request = () => setIsOpen(true);

  const confirm = async () => {
    setIsOpen(false);
    await action();
  };

  const cancel = () => setIsOpen(false);

  return { isOpen, request, confirm, cancel };
}
