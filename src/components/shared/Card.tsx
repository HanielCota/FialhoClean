import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card border border-white/[0.06] rounded-xl ${padded ? "p-4" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
