import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  LayoutDashboard,
  Settings,
  Shield,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";

/* ─── Window control icons — Windows 11 Fluent geometry ─────────────────── */

function IconMinimize() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <line x1="1" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function IconMaximize() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <line
        x1="1.5" y1="1.5" x2="8.5" y2="8.5"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="square"
      />
      <line
        x1="8.5" y1="1.5" x2="1.5" y2="8.5"
        stroke="currentColor" strokeWidth="1.25" strokeLinecap="square"
      />
    </svg>
  );
}

/* ─── Nav items config ───────────────────────────────────────────────────── */

type ViewId = "dashboard" | "cleaner" | "optimizer" | "debloater" | "repair" | "settings";

const NAV_ITEMS: { id: Exclude<ViewId, "settings">; icon: ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", icon: LayoutDashboard },
  { id: "cleaner", icon: Trash2 },
  { id: "optimizer", icon: Zap },
  { id: "debloater", icon: Shield },
  { id: "repair", icon: Wrench },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export function TitleBar() {
  const win = getCurrentWindow();
  const { t } = useTranslation();
  const { activeView, setActiveView } = useUiStore();

  const handleWin = async (key: "minimize" | "maximize" | "close") => {
    if (key === "close") { await win.close(); return; }
    if (key === "minimize") { await win.minimize(); return; }
    await win.toggleMaximize();
  };

  const labels: Record<ViewId, string> = {
    dashboard: t("nav.dashboard"),
    cleaner: t("nav.cleaner"),
    optimizer: t("nav.optimizer"),
    debloater: t("nav.debloater"),
    repair: t("nav.repair"),
    settings: t("settings.title"),
  };

  return (
    <div
      data-tauri-drag-region
      className="flex h-11 flex-shrink-0 items-stretch border-b border-white/[0.06] bg-sidebar"
    >
      {/* App name */}
      <div
        data-tauri-drag-region
        className="flex select-none items-center pl-4 pr-5"
      >
        <span className="pointer-events-none font-semibold text-[12px] tracking-tight text-white/28">
          FialhoClean
        </span>
      </div>

      {/* ── Navigation items ── */}
      <nav aria-label={t("nav.label")} className="flex items-stretch gap-px">
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center gap-[7px] px-3.5 text-[12.5px] font-medium tracking-[-0.01em] transition-colors duration-150 ${
                isActive
                  ? "text-white"
                  : "text-white/35 hover:text-white/62"
              }`}
            >
              <Icon
                className={`h-[13px] w-[13px] flex-shrink-0 transition-colors duration-150 ${
                  isActive ? "text-white/70" : "text-white/28 group-hover:text-white/50"
                }`}
              />
              {labels[id]}
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[1.5px] rounded-t-full bg-white/45"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Drag spacer ── */}
      <div className="flex-1" data-tauri-drag-region />

      {/* ── Settings ── */}
      <button
        type="button"
        onClick={() => setActiveView("settings")}
        aria-current={activeView === "settings" ? "page" : undefined}
        title={labels.settings}
        aria-label={labels.settings}
        className={`relative flex items-center justify-center px-3.5 transition-colors duration-150 ${
          activeView === "settings"
            ? "text-white"
            : "text-white/35 hover:text-white/62"
        }`}
      >
        <Settings className="h-[14px] w-[14px]" />
        {activeView === "settings" && (
          <span
            className="absolute bottom-0 left-2 right-2 h-[1.5px] rounded-t-full bg-white/45"
            aria-hidden="true"
          />
        )}
      </button>

      {/* ── Divider ── */}
      <div className="my-[10px] w-px bg-white/[0.07]" />

      {/* ── Window controls ── */}
      <div className="flex h-full items-stretch">
        <button
          type="button"
          onClick={() => void handleWin("minimize")}
          title={t("titlebar.minimize")}
          aria-label={t("titlebar.minimize")}
          className="flex h-full w-11 items-center justify-center text-text-tertiary transition-colors duration-100 hover:bg-white/[0.07] hover:text-text active:bg-white/[0.04]"
        >
          <IconMinimize />
        </button>
        <button
          type="button"
          onClick={() => void handleWin("maximize")}
          title={t("titlebar.maximize")}
          aria-label={t("titlebar.maximize")}
          className="flex h-full w-11 items-center justify-center text-text-tertiary transition-colors duration-100 hover:bg-white/[0.07] hover:text-text active:bg-white/[0.04]"
        >
          <IconMaximize />
        </button>
        <button
          type="button"
          onClick={() => void handleWin("close")}
          title={t("titlebar.close")}
          aria-label={t("titlebar.close")}
          className="flex h-full w-11 items-center justify-center text-text-tertiary transition-colors duration-100 hover:bg-[#c42b1c] hover:text-white active:bg-[#a32318]"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
