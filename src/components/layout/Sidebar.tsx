import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  SlidersHorizontal,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";

type ViewId = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair";

const NAV_ITEMS: { id: ViewId; icon: ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "cleaner", icon: Trash2 },
  { id: "optimizer", icon: Zap },
  { id: "debloater", icon: Shield },
  { id: "repair", icon: Wrench },
];

function NavButton({
  isActive,
  collapsed,
  label,
  onClick,
  onKeyDown,
  ariaCurrent,
  children,
}: {
  isActive: boolean;
  collapsed: boolean;
  label: string;
  onClick: () => void;
  onKeyDown?: React.KeyboardEventHandler;
  ariaCurrent?: "page" | undefined;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-current={ariaCurrent}
      title={collapsed ? label : undefined}
      className={`focus-ring group relative flex w-full items-center rounded-lg text-left transition-colors duration-150 ${
        collapsed ? "justify-center px-0 py-[9px]" : "gap-3 px-3 py-[7px]"
      } ${
        isActive
          ? "bg-white/[0.07] text-white"
          : "text-white/38 hover:bg-white/[0.05] hover:text-white/70"
      }`}
    >
      {/* Left active bar */}
      {isActive && (
        <span
          className="absolute top-[18%] left-0 h-[64%] w-[3px] rounded-r-full bg-white/55"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar } = useUiStore();
  const { t } = useTranslation();

  const navConfig: Record<ViewId | "settings", { label: string }> = {
    dashboard: { label: t("nav.dashboard") },
    cleaner: { label: t("nav.cleaner") },
    optimizer: { label: t("nav.optimizer") },
    debloater: { label: t("nav.debloater") },
    repair: { label: t("nav.repair") },
    settings: { label: t("settings.title") },
  };

  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={`relative flex flex-shrink-0 flex-col bg-sidebar transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Right border */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/[0.06]" />

      {/* ── Nav ── */}
      <div className="flex flex-1 flex-col gap-0 px-2 py-2">
        <nav className="flex flex-1 flex-col gap-px" aria-label={t("nav.label")}>
          {NAV_ITEMS.map(({ id, icon: Icon }) => {
            const isActive = activeView === id;
            const { label } = navConfig[id];

            return (
              <NavButton
                key={id}
                isActive={isActive}
                collapsed={collapsed}
                label={label}
                ariaCurrent={isActive ? "page" : undefined}
                onClick={() => setActiveView(id)}
              >
                <Icon className={`flex-shrink-0 ${collapsed ? "h-[17px] w-[17px]" : "h-4 w-4"}`} />
                {!collapsed && (
                  <span className="truncate font-medium text-[13px] leading-snug tracking-[-0.01em]">
                    {label}
                  </span>
                )}
              </NavButton>
            );
          })}
        </nav>

        {/* ── Footer: settings + collapse toggle ── */}
        <div className="flex flex-col gap-px border-white/[0.05] border-t pt-2">
          {/* Settings */}
          {(() => {
            const isActive = activeView === "settings";
            const label = navConfig.settings.label;
            return (
              <NavButton
                isActive={isActive}
                collapsed={collapsed}
                label={label}
                ariaCurrent={isActive ? "page" : undefined}
                onClick={() => setActiveView("settings")}
              >
                <SlidersHorizontal
                  className={`flex-shrink-0 ${collapsed ? "h-[17px] w-[17px]" : "h-4 w-4"}`}
                />
                {!collapsed && (
                  <span className="truncate font-medium text-[13px] leading-snug tracking-[-0.01em]">
                    {label}
                  </span>
                )}
              </NavButton>
            );
          })()}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            className={`focus-ring group relative flex w-full items-center rounded-lg text-white/22 transition-colors duration-150 hover:bg-white/[0.05] hover:text-white/50 ${
              collapsed ? "justify-center px-0 py-[9px]" : "gap-3 px-3 py-[7px]"
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[17px] w-[17px] flex-shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 flex-shrink-0" />
                <span className="truncate font-medium text-[13px] leading-snug tracking-[-0.01em]">
                  {t("sidebar.collapse")}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
