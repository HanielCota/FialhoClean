import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";

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
        <Icon className={`w-4 h-4 ${isAccent ? "text-on-accent" : "text-accent"}`} />
      </div>
      <div className="flex-1">
        <p className={`text-[14px] font-semibold ${isAccent ? "text-on-accent" : "text-text"}`}>
          {title}
        </p>
        <p className={`text-[13px] ${isAccent ? "text-on-accent/72" : "text-text-muted"}`}>
          {description}
        </p>
      </div>
      <ChevronRight
        className={`w-4 h-4 transition-colors ${
          isAccent
            ? "text-on-accent/65 group-hover:text-on-accent"
            : "text-text-muted group-hover:text-text"
        }`}
      />
    </button>
  );
}
