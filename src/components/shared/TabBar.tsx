import type { ElementType } from "react";

export interface TabDef<T extends string = string> {
  id: T;
  label: string;
  Icon: ElementType<{ className?: string }>;
}

interface TabBarProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: TabBarProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex items-end gap-1 border-b border-white/[0.06] ${className}`}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`
              focus-ring group relative flex items-center gap-2 px-4 pb-4 pt-2
              text-[14px] font-semibold transition-colors duration-150
              ${isActive ? "text-text" : "text-text-muted hover:text-text/80"}
            `}
          >
            <Icon
              className={`w-4 h-4 flex-shrink-0 transition-colors duration-150 ${
                isActive ? "text-accent" : "text-text-muted group-hover:text-text/60"
              }`}
            />
            {label}
            {/* Active indicator bar */}
            <span
              className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all duration-200 ${
                isActive ? "bg-accent opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
