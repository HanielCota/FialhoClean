import type { ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  return (
    <h2
      className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted ${className}`}
    >
      {children}
    </h2>
  );
}
