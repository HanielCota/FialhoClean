import { ChevronRight } from "lucide-react";
import type { ComponentType } from "react";

interface ActionCardProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
  tone?: "default" | "accent";
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  className = "",
  tone = "default",
}: ActionCardProps) {
  const isAccent = tone === "accent";

  return (
    <button
      onClick={onClick}
      type="button"
      className={`focus-ring group flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150 active:scale-[0.99] ${
        isAccent
          ? "border-white/[0.08] bg-accent text-on-accent hover:bg-accent-hover"
          : "border-white/[0.06] bg-card hover:border-white/10 hover:bg-card-hover"
      } ${className}`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
          isAccent ? "bg-on-accent/10" : "bg-accent/10"
        }`}
      >
        <Icon className={`h-4 w-4 ${isAccent ? "text-on-accent" : "text-accent"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          title={title}
          className={`truncate font-semibold text-[14px] ${isAccent ? "text-on-accent" : "text-text"}`}
        >
          {title}
        </p>
        <p className={`text-[13px] ${isAccent ? "text-on-accent/72" : "text-text-muted"}`}>
          {description}
        </p>
      </div>
      <ChevronRight
        className={`h-4 w-4 flex-shrink-0 transition-colors ${
          isAccent
            ? "text-on-accent/65 group-hover:text-on-accent"
            : "text-text-muted group-hover:text-text"
        }`}
      />
    </button>
  );
}
