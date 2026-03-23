import type { ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  if (!children) {
    return null;
  }

  return (
    <h2
      className={`mb-4 font-semibold text-[12px] text-text-muted uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </h2>
  );
}
