import { FolderX, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCleanerFlow } from "../../hooks/useCleanerFlow";
import { useUiStore } from "../../stores/uiStore";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";
import { TabBar, type TabDef } from "../shared/TabBar";
import { CleaningOverlay } from "./CleaningOverlay";
import { EmptyFoldersView } from "./EmptyFoldersView";
import { ResultsScreen } from "./ResultsScreen";
import { ScanningScreen } from "./ScanningScreen";
import { SelectScreen } from "./SelectScreen";
import { StepDots } from "./StepDots";
import { SuccessScreen } from "./SuccessScreen";

type CleanerTab = "files" | "empty_folders";

export function CleanerView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CleanerTab>("files");

  const {
    selectedCategories,
    scanSummary,
    cleanResult,
    isCleaning,
    error,
    scanProgress,
    toggleCategory,
    selectAllCategories,
    deselectAllCategories,
    scan,
    clean,
    cancelScan,
    reset,
    phase,
    stepMap,
    confirmBeforeCleaning,
  } = useCleanerFlow();

  const { setActiveView } = useUiStore();

  const TABS: TabDef<CleanerTab>[] = [
    { id: "files", label: t("cleaner.tabs.files"), Icon: Trash2 },
    { id: "empty_folders", label: t("cleaner.tabs.emptyFolders"), Icon: FolderX },
  ];

  // Hide tabs while the file cleaner is actively scanning/cleaning.
  const showTabs = phase === "select" || activeTab === "empty_folders";

  return (
    <div>
      {showTabs && (
        <TabBar
          tabs={TABS}
          active={activeTab}
          onChange={(id) => {
            setActiveTab(id);
            if (id === "files") reset();
          }}
          className="px-6 xl:px-8"
        />
      )}

      {/* ── Files tab ── */}
      {activeTab === "files" && (
        <>
          {phase !== "select" && (
            <StepDots
              current={stepMap?.[phase] ?? 1}
              total={4}
              label={t("cleaner.step", { current: stepMap?.[phase] ?? 1, total: 4 })}
            />
          )}

          {error && (
            <div className="space-y-2 px-8 pt-2">
              <ErrorMessage message={error} />
              {phase === "select" && (
                <Button variant="ghost" size="sm" onClick={scan}>
                  {t("cleaner.scan.retryScan")}
                </Button>
              )}
            </div>
          )}

          {phase === "select" && (
            <SelectScreen
              selectedCategories={selectedCategories}
              onToggle={toggleCategory}
              onSelectAll={selectAllCategories}
              onDeselectAll={deselectAllCategories}
              onScan={scan}
            />
          )}

          {phase === "scanning" && (
            <ScanningScreen
              selectedCategories={selectedCategories}
              scanProgress={scanProgress}
              onCancel={cancelScan}
            />
          )}

          {phase === "results" && scanSummary && (
            <ResultsScreen
              scanSummary={scanSummary}
              isCleaning={isCleaning}
              onClean={clean}
              onRescan={reset}
              confirmBeforeCleaning={confirmBeforeCleaning}
            />
          )}

          {phase === "success" && cleanResult && (
            <SuccessScreen
              cleanResult={cleanResult}
              scanSummary={scanSummary}
              onDashboard={() => {
                reset();
                setActiveView("dashboard");
              }}
              onDebloater={() => {
                reset();
                setActiveView("debloater");
              }}
              onScanAgain={reset}
            />
          )}

          {isCleaning && <CleaningOverlay />}
        </>
      )}

      {/* ── Empty Folders tab ── */}
      {activeTab === "empty_folders" && <EmptyFoldersView />}
    </div>
  );
}
