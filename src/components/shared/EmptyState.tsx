import type { ComponentType, ReactNode } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title?: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  if (!Icon) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Icon className="h-10 w-10 text-text-tertiary" />
      {title && <p className="font-semibold text-[17px] text-text">{title}</p>}
      <p className="text-[14px] text-text-muted">{message}</p>
      {action ?? null}
    </div>
  );
}
