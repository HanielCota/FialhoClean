import {
  LayoutDashboard,
  Shield,
  SlidersHorizontal,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";

type ViewId = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings";

const NAV_ITEMS: { id: ViewId; icon: ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "cleaner", icon: Trash2 },
  { id: "optimizer", icon: Zap },
  { id: "debloater", icon: Shield },
  { id: "repair", icon: Wrench },
];

export function NavBar() {
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

  const navItem = (id: ViewId, Icon: ComponentType<{ className?: string }>) => {
    const isActive = activeView === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveView(id)}
        aria-current={isActive ? "page" : undefined}
        className={`focus-ring group relative flex h-full items-center gap-2 px-3.5 transition-colors duration-150 ${
          isActive
            ? "text-white"
            : "text-white/38 hover:text-white/65"
        }`}
      >
        <Icon className="h-[14px] w-[14px] flex-shrink-0" />
        <span className={`font-medium text-[12.5px] tracking-[-0.01em] ${isActive ? "" : ""}`}>
          {labels[id]}
        </span>
        {isActive && (
          <span
            className="absolute bottom-0 left-2 right-2 h-[1.5px] rounded-t-full bg-white/55"
            aria-hidden="true"
          />
        )}
      </button>
    );
  };

  return (
    <nav
      aria-label={t("nav.label")}
      className="flex h-10 flex-shrink-0 items-stretch border-b border-white/[0.06] bg-sidebar"
    >
      {/* Main items */}
      <div className="flex flex-1 items-stretch pl-1">
        {NAV_ITEMS.map(({ id, icon: Icon }) => navItem(id, Icon))}
      </div>

      {/* Settings — right-aligned */}
      <div className="flex items-stretch pr-1">
        {navItem("settings", SlidersHorizontal)}
      </div>
    </nav>
  );
}
