import { useTranslation } from "react-i18next";
import { useCleanerFlow } from "../../hooks/useCleanerFlow";
import { useUiStore } from "../../stores/uiStore";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";
import { CleaningOverlay } from "./CleaningOverlay";
import { ResultsScreen } from "./ResultsScreen";
import { ScanningScreen } from "./ScanningScreen";
import { SelectScreen } from "./SelectScreen";
import { StepDots } from "./StepDots";
import { SuccessScreen } from "./SuccessScreen";

export function CleanerView() {
  const { t } = useTranslation();
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

  return (
    <div>
      <StepDots
        current={stepMap[phase]}
        total={4}
        label={t("cleaner.step", { current: stepMap[phase], total: 4 })}
      />

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
    </div>
  );
}
