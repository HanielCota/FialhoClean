import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

/* ─── Custom SVG icons ─────────────────────────────────────────────────────
   Each renders inside an 8×8 viewBox. Stroke colour is injected via `color`
   so it inherits from the parent's `style={{ color }}`. */

function IconMinimize() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <line
        x1="1" y1="6" x2="7" y2="6"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      />
    </svg>
  );
}

function IconMaximize() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <rect
        x="1" y="1" width="6" height="6"
        rx="1"
        stroke="currentColor" strokeWidth="1.5"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
      <line
        x1="1.5" y1="1.5" x2="6.5" y2="6.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      />
      <line
        x1="6.5" y1="1.5" x2="1.5" y2="6.5"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      />
    </svg>
  );
}

/* ─── Button definitions ────────────────────────────────────────────────── */

const TRAFFIC_LIGHTS = [
  {
    key:       "minimize" as const,
    bg:        "#febc2e",
    iconColor: "#7a5c00",
    Icon:      IconMinimize,
  },
  {
    key:       "maximize" as const,
    bg:        "#28c840",
    iconColor: "#0f5217",
    Icon:      IconMaximize,
  },
  {
    key:       "close" as const,
    bg:        "#ff5f57",
    iconColor: "#7a1a15",
    Icon:      IconClose,
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export function TitleBar() {
  const win = getCurrentWindow();
  const { t } = useTranslation();

  const handleAction = async (key: (typeof TRAFFIC_LIGHTS)[number]["key"]) => {
    if (key === "close")    { await win.close();          return; }
    if (key === "minimize") { await win.minimize();       return; }
    await win.toggleMaximize();
  };

  return (
    <div
      data-tauri-drag-region
      className="relative h-10 flex-shrink-0 border-b border-white/[0.06] bg-sidebar flex items-center justify-end px-4"
    >
      {/* Título à esquerda */}
      <span className="pointer-events-none absolute left-4 text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary select-none">
        {t("app.name")}
      </span>

      {/* Botões — à direita, sem herdar drag-region */}
      <div className="relative flex items-center gap-[7px]">
        {TRAFFIC_LIGHTS.map(({ key, bg, iconColor, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => void handleAction(key)}
            className="focus-ring-tight group flex h-[14px] w-[14px] items-center justify-center rounded-full transition-transform duration-150 active:scale-90"
            style={{ backgroundColor: bg }}
            title={t(`titlebar.${key}`)}
            aria-label={t(`titlebar.${key}`)}
          >
            <span
              className="opacity-0 transition-opacity duration-100 group-hover:opacity-100 flex items-center justify-center"
              style={{ color: iconColor }}
            >
              <Icon />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
