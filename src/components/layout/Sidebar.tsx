import { LayoutDashboard, Settings, Shield, Trash2, Wrench, Zap } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";

type ViewId = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings";

const NAV_ITEMS: {
  id: Exclude<ViewId, "settings">;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "cleaner", icon: Trash2 },
  { id: "optimizer", icon: Zap },
  { id: "debloater", icon: Shield },
  { id: "repair", icon: Wrench },
];

export function Sidebar() {
  const { activeView, setActiveView } = useUiStore();
  const { t } = useTranslation();

  const labels: Record<ViewId, string> = {
    dashboard: t("nav.dashboard"),
    cleaner: t("nav.cleaner"),
    optimizer: t("nav.optimizer"),
    debloater: t("nav.debloater"),
    repair: t("nav.repair"),
    settings: t("settings.title"),
  };

  return (
    <aside className="relative flex w-52 flex-shrink-0 flex-col bg-sidebar">
      {/* Right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/[0.05]" />

      {/* ── App header ── */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-[7px] bg-white/[0.09]">
          <span className="select-none font-bold text-[11px] text-white/60 leading-none">F</span>
        </div>
        <span className="select-none font-semibold text-[13px] text-white/60 tracking-[-0.02em]">
          FialhoClean
        </span>
      </div>

      {/* ── Section label ── */}
      <p className="px-4 pt-1 pb-1 font-semibold text-[10px] text-white/20 uppercase tracking-[0.07em]">
        {t("nav.label")}
      </p>

      {/* ── Main nav ── */}
      <nav className="flex flex-1 flex-col gap-px px-2" aria-label={t("nav.label")}>
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              aria-current={isActive ? "page" : undefined}
              className={`group focus-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left transition-colors duration-150 ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
              }`}
            >
              <Icon
                className={`h-[20px] w-[20px] flex-shrink-0 transition-colors duration-150 ${
                  isActive ? "text-white/70" : "text-white/25 group-hover:text-white/50"
                }`}
              />
              <span className="font-medium text-[13px] leading-tight tracking-[-0.01em]">
                {labels[id]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-2 pt-2 pb-3">
        <div className="mb-2 h-px bg-white/[0.05]" />
        {(() => {
          const isActive = activeView === "settings";
          return (
            <button
              type="button"
              onClick={() => setActiveView("settings")}
              aria-current={isActive ? "page" : undefined}
              className={`focus-ring group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left transition-colors duration-150 ${
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
              }`}
            >
              <Settings
                className={`h-[20px] w-[20px] flex-shrink-0 transition-colors duration-150 ${
                  isActive ? "text-white/70" : "text-white/25 group-hover:text-white/50"
                }`}
              />
              <span className="font-medium text-[13px] leading-tight tracking-[-0.01em]">
                {labels.settings}
              </span>
            </button>
          );
        })()}
      </div>
    </aside>
  );
}
