import { useEffect, useState } from "react";
import { CleanerView } from "./components/cleaner/CleanerView";
import { DashboardView } from "./components/dashboard/DashboardView";
import { DebloaterView } from "./components/debloater/DebloaterView";
import { PageContainer } from "./components/layout/PageContainer";
import { Sidebar } from "./components/layout/Sidebar";
import { TitleBar } from "./components/layout/TitleBar";
import { OptimizerView } from "./components/optimizer/OptimizerView";
import { RepairView } from "./components/repair/RepairView";
import { SettingsView } from "./components/settings/SettingsView";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { ToastContainer } from "./components/shared/ToastContainer";
import { useUiStore } from "./stores/uiStore";

// Keeps each view mounted after its first visit so that navigating away and
// back doesn't re-trigger data fetches (useEffect on mount). The hidden class
// (display:none) keeps unmounted-looking views alive in the background.
export default function App() {
  const { activeView } = useUiStore();
  const [everVisited, setEverVisited] = useState(() => new Set([activeView]));

  useEffect(() => {
    setEverVisited((prev) => {
      if (prev.has(activeView)) return prev;
      const next = new Set(prev);
      next.add(activeView);
      return next;
    });
  }, [activeView]);

  const hide = (view: string) => (activeView !== view ? "hidden" : undefined);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <PageContainer>
          {everVisited.has("dashboard") && (
            <div className={hide("dashboard")}>
              <ErrorBoundary key="dashboard">
                <DashboardView />
              </ErrorBoundary>
            </div>
          )}
          {everVisited.has("cleaner") && (
            <div className={hide("cleaner")}>
              <ErrorBoundary key="cleaner">
                <CleanerView />
              </ErrorBoundary>
            </div>
          )}
          {everVisited.has("optimizer") && (
            <div className={hide("optimizer")}>
              <ErrorBoundary key="optimizer">
                <OptimizerView />
              </ErrorBoundary>
            </div>
          )}
          {everVisited.has("debloater") && (
            <div className={hide("debloater")}>
              <ErrorBoundary key="debloater">
                <DebloaterView />
              </ErrorBoundary>
            </div>
          )}
          {everVisited.has("repair") && (
            <div className={hide("repair")}>
              <ErrorBoundary key="repair">
                <RepairView />
              </ErrorBoundary>
            </div>
          )}
          {everVisited.has("settings") && (
            <div className={hide("settings")}>
              <ErrorBoundary key="settings">
                <SettingsView />
              </ErrorBoundary>
            </div>
          )}
        </PageContainer>
      </div>
      <ToastContainer />
    </div>
  );
}
