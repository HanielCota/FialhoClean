import { useCallback, useRef, useState } from "react";

/**
 * Encapsulates the open/close state for a destructive-action confirmation modal.
 * Eliminates the `useState(false)` + inline open/confirm/cancel boilerplate.
 *
 * @param action - Async or sync function to call after the user confirms.
 */
export function useConfirmModal(action: () => void | Promise<void>) {
  const [isOpen, setIsOpen] = useState(false);
  const actionRef = useRef(action);
  actionRef.current = action;

  const request = useCallback(() => setIsOpen(true), []);

  const confirm = useCallback(async () => {
    setIsOpen(false);
    try {
      await actionRef.current();
    } catch {
      // Error handling is the caller's responsibility via the action itself.
      // The modal's job is only to gate confirmation — swallow here to avoid
      // unhandled rejections if the action already handles its own errors.
    }
  }, []);

  const cancel = useCallback(() => setIsOpen(false), []);

  return { isOpen, request, confirm, cancel };
}
