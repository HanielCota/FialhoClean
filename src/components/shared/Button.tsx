import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    className = "",
    type,
    ...props
  },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-150 select-none disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const variants = {
    primary:
      "bg-accent text-on-accent shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-accent-hover active:scale-[0.98]",
    secondary:
      "border border-white/[0.08] bg-white/[0.06] text-text hover:border-white/[0.12] hover:bg-white/[0.09] active:scale-[0.98]",
    danger:
      "border border-red/25 bg-red/[0.16] text-red hover:bg-red/[0.24] hover:border-red/35 active:scale-[0.98]",
    ghost: "text-text-muted hover:bg-white/[0.05] hover:text-text active:scale-[0.98]",
  };

  const sizes = {
    sm: "h-9 px-3 text-[12px]",
    md: "h-11 px-4 text-[14px]",
    lg: "h-12 px-5 text-[15px]",
  };

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
