import type { ReactNode } from "react";
import type { AsyncStatus } from "../../hooks/useAsyncState";

interface AsyncViewProps {
  status: AsyncStatus;
  skeleton: ReactNode;
  empty?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}

/**
 * Renders one of four slots based on async status.
 * Pair with useAsyncState() for the status value.
 */
export function AsyncView({ status, skeleton, empty, error, children }: AsyncViewProps) {
  if (status === "loading") return <>{skeleton}</>;
  if (status === "error") return <>{error ?? null}</>;
  if (status === "empty") return <>{empty ?? null}</>;
  return <>{children}</>;
}
