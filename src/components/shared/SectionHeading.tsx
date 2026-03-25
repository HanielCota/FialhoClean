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
      className={`mb-3 font-semibold text-[12px] text-text-tertiary uppercase tracking-[0.10em] ${className}`}
    >
      {children}
    </h2>
  );
}
