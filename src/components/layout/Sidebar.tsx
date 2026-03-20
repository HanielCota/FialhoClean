import { LayoutDashboard, Shield, SlidersHorizontal, Trash2, Wrench, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";

const NAV_ITEMS = [
  { id: "dashboard" as const, icon: LayoutDashboard },
  { id: "cleaner" as const, icon: Trash2 },
  { id: "optimizer" as const, icon: Zap },
  { id: "debloater" as const, icon: Shield },
  { id: "repair" as const, icon: Wrench },
];

export function Sidebar() {
  const { activeView, setActiveView } = useUiStore();
  const { t } = useTranslation();

  const navLabels: Record<"dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings", string> = {
    dashboard: t("nav.dashboard"),
    cleaner: t("nav.cleaner"),
    optimizer: t("nav.optimizer"),
    debloater: t("nav.debloater"),
    repair: t("nav.repair"),
    settings: t("settings.title"),
  };

  return (
    <aside className="w-56 flex-shrink-0 border-r border-white/[0.06] bg-sidebar">
      <div className="flex h-full flex-col px-3 pb-4 pt-4">

        {/* Nav label */}
        <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
          {t("nav.label")}
        </p>

        {/* Nav items */}
        <nav className="flex-1">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(({ id, icon: Icon }) => {
              const isActive = activeView === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveView(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`focus-ring group flex h-9 w-full items-center gap-3 rounded-[10px] px-2.5 text-left transition-all duration-150 ${
                    isActive
                      ? "bg-accent/[0.13] text-accent"
                      : "text-text-muted hover:bg-white/[0.04] hover:text-text"
                  }`}
                >
                  <Icon
                    className={`h-[15px] w-[15px] flex-shrink-0 transition-colors duration-150 ${
                      isActive ? "text-accent" : "text-text-tertiary group-hover:text-text-muted"
                    }`}
                  />
                  <span className="truncate text-[15px] font-medium tracking-[-0.01em]">
                    {navLabels[id]}
                  </span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent/70" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Settings footer */}
        <div className="border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setActiveView("settings")}
            aria-current={activeView === "settings" ? "page" : undefined}
            title={t("settings.title")}
            aria-label={t("settings.title")}
            className={`focus-ring group flex h-9 w-full items-center gap-3 rounded-[10px] px-2.5 text-left transition-all duration-150 ${
              activeView === "settings"
                ? "bg-accent/[0.13] text-accent"
                : "text-text-muted hover:bg-white/[0.04] hover:text-text"
            }`}
          >
            <SlidersHorizontal
              className={`h-[15px] w-[15px] flex-shrink-0 transition-colors duration-150 ${
                activeView === "settings"
                  ? "text-accent"
                  : "text-text-tertiary group-hover:text-text-muted"
              }`}
            />
            <span className="truncate text-[13px] font-medium tracking-[-0.01em]">
              {t("settings.title")}
            </span>
            {activeView === "settings" && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent/70" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
