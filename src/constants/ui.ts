/** Max app entries shown in the debloater confirmation modal before "…and N more". */
export const MODAL_PREVIEW_LIMIT = 6;

/** Auto-dismiss durations (ms) for each toast type. */
export const TOAST_DURATIONS = {
  error: 6000,
  warning: 5000,
  success: 4000,
  info: 4000,
} as const;
