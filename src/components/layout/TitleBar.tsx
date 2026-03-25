import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

/* ─── SVG icons — Windows 11 geometry ──────────────────────────────────────
   10×10 viewBox with sharp, clean strokes matching the Windows 11 Fluent style.
   Color inherits from parent via currentColor. */

function IconMinimize() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <line
        x1="1"
        y1="7"
        x2="9"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.25"
      />
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
      <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
      <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
    </svg>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function TitleBar() {
  const win = getCurrentWindow();
  const { t } = useTranslation();

  const handleAction = async (key: "minimize" | "maximize" | "close") => {
    if (!win) return;
    if (key === "close") { await win.close(); return; }
    if (key === "minimize") { await win.minimize(); return; }
    await win.toggleMaximize();
  };

  return (
    <div
      data-tauri-drag-region
      className="relative flex h-10 flex-shrink-0 items-center justify-end border-b border-white/[0.06] bg-sidebar"
    >
      {/* Window controls — right-aligned, Windows convention */}
      <div className="relative flex h-full items-stretch">
        {/* Minimize */}
        <button
          type="button"
          onClick={() => void handleAction("minimize")}
          title={t("titlebar.minimize")}
          aria-label={t("titlebar.minimize")}
          className="flex h-full w-[46px] items-center justify-center text-text-tertiary transition-colors duration-100 hover:bg-white/[0.07] hover:text-text active:bg-white/[0.04]"
        >
          <IconMinimize />
        </button>

        {/* Maximize / Restore */}
        <button
          type="button"
          onClick={() => void handleAction("maximize")}
          title={t("titlebar.maximize")}
          aria-label={t("titlebar.maximize")}
          className="flex h-full w-[46px] items-center justify-center text-text-tertiary transition-colors duration-100 hover:bg-white/[0.07] hover:text-text active:bg-white/[0.04]"
        >
          <IconMaximize />
        </button>

        {/* Close — red hover, Windows 11 */}
        <button
          type="button"
          onClick={() => void handleAction("close")}
          title={t("titlebar.close")}
          aria-label={t("titlebar.close")}
          className="flex h-full w-[46px] items-center justify-center text-text-tertiary transition-colors duration-100 hover:bg-[#c42b1c] hover:text-white active:bg-[#a32318]"
        >
          <IconClose />
        </button>
      </div>
    </div>
  );
}
