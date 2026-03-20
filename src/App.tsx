import { useEffect, useState } from "react";
import { DashboardView } from "./components/dashboard/DashboardView";
import { CleanerView } from "./components/cleaner/CleanerView";
import { OptimizerView } from "./components/optimizer/OptimizerView";
import { DebloaterView } from "./components/debloater/DebloaterView";
import { SettingsView } from "./components/settings/SettingsView";
import { Sidebar } from "./components/layout/Sidebar";
import { PageContainer } from "./components/layout/PageContainer";
import { TitleBar } from "./components/layout/TitleBar";
import { ToastContainer } from "./components/shared/ToastContainer";
import { useUiStore } from "./stores/uiStore";

// Keeps each view mounted after its first visit so that navigating away and
// back doesn't re-trigger data fetches (useEffect on mount). The hidden class
// (display:none) keeps unmounted-looking views alive in the background.
export default function App() {
  const { activeView } = useUiStore();
  const [everVisited, setEverVisited] = useState(
    () => new Set([activeView])
  );

  useEffect(() => {
    setEverVisited((prev) => {
      if (prev.has(activeView)) return prev;
      const next = new Set(prev);
      next.add(activeView);
      return next;
    });
  }, [activeView]);

  const hide = (view: string) =>
    activeView !== view ? "hidden" : undefined;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <PageContainer>
          {everVisited.has("dashboard") && (
            <div className={hide("dashboard")}>
              <DashboardView />
            </div>
          )}
          {everVisited.has("cleaner") && (
            <div className={hide("cleaner")}>
              <CleanerView />
            </div>
          )}
          {everVisited.has("optimizer") && (
            <div className={hide("optimizer")}>
              <OptimizerView />
            </div>
          )}
          {everVisited.has("debloater") && (
            <div className={hide("debloater")}>
              <DebloaterView />
            </div>
          )}
          {everVisited.has("settings") && (
            <div className={hide("settings")}>
              <SettingsView />
            </div>
          )}
        </PageContainer>
      </div>
      <ToastContainer />
    </div>
  );
}
