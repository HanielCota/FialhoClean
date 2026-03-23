import type { KeyboardEventHandler, MouseEventHandler, ReactNode } from "react";

interface ItemRowProps {
  /** Left slot — status icon, checkbox, etc. */
  leading?: ReactNode;
  /**
   * Main content area title.
   * - When a string, rendered as a <p> with `titleClass` styling.
   * - When ReactNode, rendered directly (use for title + inline badges).
   */
  title: ReactNode;
  /** CSS class for the title text — only applied when `title` is a string. */
  titleClass?: string;
  /** Secondary line of text below the title. */
  subtitle?: string;
  /** Right slot — toggle, buttons, labels, etc. */
  trailing?: ReactNode;
  /**
   * Override the container's background/border/cursor classes.
   * Default: "bg-card border border-white/5"
   * The layout (flex, gap, padding, rounded) is always applied.
   */
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  role?: string;
  "aria-checked"?: boolean;
  tabIndex?: number;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  as?: "div" | "button";
  disabled?: boolean;
}

/**
 * Shared row layout for list items across Optimizer, Debloater, and Cleaner.
 * Eliminates the repeated `flex items-center gap-4 p-3 rounded-xl` skeleton.
 */
export function ItemRow({
  leading,
  title,
  titleClass,
  subtitle,
  trailing,
  className = "bg-card border border-white/[0.06]",
  onClick,
  onKeyDown,
  role,
  "aria-checked": ariaChecked,
  tabIndex,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  as = "div",
  disabled = false,
}: ItemRowProps) {
  const Component = as;

  return (
    <Component
      {...(as === "button" ? { type: "button", disabled } : {})}
      role={role}
      aria-checked={ariaChecked}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`flex items-center gap-4 rounded-xl p-3 ${
        as === "button" ? "focus-ring w-full text-left disabled:cursor-not-allowed" : ""
      } ${className}`}
    >
      {leading !== undefined && <div className="flex flex-shrink-0 items-center">{leading}</div>}

      <div className="min-w-0 flex-1">
        {typeof title === "string" ? (
          <p title={title} className={`truncate font-medium text-[14px] ${titleClass ?? "text-text"}`}>{title}</p>
        ) : (
          title
        )}
        {subtitle && <p title={subtitle} className="mt-0.5 truncate text-[12px] text-text-muted">{subtitle}</p>}
      </div>

      {trailing !== undefined && (
        <div className="flex flex-shrink-0 items-center gap-2">{trailing}</div>
      )}
    </Component>
  );
}
