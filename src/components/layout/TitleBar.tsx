import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTranslation } from "react-i18next";

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
        x1="1.5"
        y1="1.5"
        x2="8.5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
      <line
        x1="8.5"
        y1="1.5"
        x2="1.5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function TitleBar() {
  const win = getCurrentWindow();
  const { t } = useTranslation();

  const handle = async (key: "minimize" | "maximize" | "close") => {
    if (key === "close") {
      await win.close();
      return;
    }
    if (key === "minimize") {
      await win.minimize();
      return;
    }
    await win.toggleMaximize();
  };

  return (
    <div
      data-tauri-drag-region
      className="flex h-9 flex-shrink-0 items-center justify-end bg-sidebar"
    >
      <button
        type="button"
        onClick={() => void handle("minimize")}
        title={t("titlebar.minimize")}
        aria-label={t("titlebar.minimize")}
        className="flex h-full w-11 items-center justify-center text-white/20 transition-colors duration-100 hover:bg-white/[0.06] hover:text-white/60 active:bg-white/[0.04]"
      >
        <IconMinimize />
      </button>
      <button
        type="button"
        onClick={() => void handle("maximize")}
        title={t("titlebar.maximize")}
        aria-label={t("titlebar.maximize")}
        className="flex h-full w-11 items-center justify-center text-white/20 transition-colors duration-100 hover:bg-white/[0.06] hover:text-white/60 active:bg-white/[0.04]"
      >
        <IconMaximize />
      </button>
      <button
        type="button"
        onClick={() => void handle("close")}
        title={t("titlebar.close")}
        aria-label={t("titlebar.close")}
        className="flex h-full w-11 items-center justify-center text-white/20 transition-colors duration-100 hover:bg-[#c42b1c] hover:text-white active:bg-[#a32318]"
      >
        <IconClose />
      </button>
    </div>
  );
}
