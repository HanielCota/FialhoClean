import type { ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  return (
    <h2
      className={`mb-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-text-muted ${className}`}
    >
      {children}
    </h2>
  );
}
