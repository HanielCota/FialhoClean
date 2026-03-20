import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { repairService } from "../services/repairService";
import { useUiStore } from "../stores/uiStore";
import type { RepairResult, RepairStatus, RepairToolId } from "../types/repair";

interface RepairToolState {
  status: RepairStatus;
  result: RepairResult | null;
}

const initialState: RepairToolState = { status: "idle", result: null };

export function useRepair() {
  const { addToast } = useUiStore();
  const { t } = useTranslation();

  const [sfc, setSfc] = useState<RepairToolState>(initialState);
  const [dism, setDism] = useState<RepairToolState>(initialState);
  const [restorePoint, setRestorePoint] = useState<RepairStatus>("idle");

  const runSfc = useCallback(async () => {
    setSfc({ status: "running", result: null });
    try {
      const result = await repairService.runSfc();
      setSfc({ status: result.success ? "success" : "error", result });
      addToast(
        result.success ? t("repair.toast.sfcSuccess") : t("repair.toast.sfcFailed"),
        result.success ? "success" : "error"
      );
    } catch (err) {
      const msg = sanitizeError(err);
      setSfc({ status: "error", result: { success: false, output: msg } });
      addToast(t("repair.toast.sfcFailed"), "error");
    }
  }, [addToast, t]);

  const runDism = useCallback(async () => {
    setDism({ status: "running", result: null });
    try {
      const result = await repairService.runDism();
      setDism({ status: result.success ? "success" : "error", result });
      addToast(
        result.success ? t("repair.toast.dismSuccess") : t("repair.toast.dismFailed"),
        result.success ? "success" : "error"
      );
    } catch (err) {
      const msg = sanitizeError(err);
      setDism({ status: "error", result: { success: false, output: msg } });
      addToast(t("repair.toast.dismFailed"), "error");
    }
  }, [addToast, t]);

  const createRestorePoint = useCallback(async (description: string) => {
    setRestorePoint("running");
    try {
      await repairService.createRestorePoint(description);
      setRestorePoint("success");
      addToast(t("repair.toast.restorePointCreated"), "success");
    } catch (err) {
      setRestorePoint("error");
      addToast(t("repair.toast.restorePointFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, t]);

  const resetTool = useCallback((tool: RepairToolId) => {
    if (tool === "sfc") setSfc(initialState);
    else if (tool === "dism") setDism(initialState);
    else setRestorePoint("idle");
  }, []);

  return { sfc, dism, restorePoint, runSfc, runDism, createRestorePoint, resetTool };
}
