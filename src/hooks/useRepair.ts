import { useCallback, useState } from "react";
import { sanitizeError } from "../lib/errors";
import { repairService } from "../services/repairService";
import type { RepairResult, RepairStatus, RepairToolId } from "../types/repair";
import { useNotify } from "./useNotify";

interface RepairToolState {
  status: RepairStatus;
  result: RepairResult | null;
}

const initialState: RepairToolState = { status: "idle", result: null };

export function useRepair() {
  const notify = useNotify();

  const [sfc, setSfc] = useState<RepairToolState>(initialState);
  const [dism, setDism] = useState<RepairToolState>(initialState);
  const [restorePoint, setRestorePoint] = useState<RepairStatus>("idle");

  const runSfc = useCallback(async () => {
    setSfc({ status: "running", result: null });
    try {
      const result = await repairService.runSfc();
      setSfc({ status: result.success ? "success" : "error", result });
      notify(
        result.success ? "repair.toast.sfcSuccess" : "repair.toast.sfcFailed",
        result.success ? "success" : "error"
      );
    } catch (err) {
      const msg = sanitizeError(err);
      setSfc({ status: "error", result: { success: false, output: msg } });
      notify("repair.toast.sfcFailed", "error");
    }
  }, [notify]);

  const runDism = useCallback(async () => {
    setDism({ status: "running", result: null });
    try {
      const result = await repairService.runDism();
      setDism({ status: result.success ? "success" : "error", result });
      notify(
        result.success ? "repair.toast.dismSuccess" : "repair.toast.dismFailed",
        result.success ? "success" : "error"
      );
    } catch (err) {
      const msg = sanitizeError(err);
      setDism({ status: "error", result: { success: false, output: msg } });
      notify("repair.toast.dismFailed", "error");
    }
  }, [notify]);

  const createRestorePoint = useCallback(async (description: string) => {
    setRestorePoint("running");
    try {
      await repairService.createRestorePoint(description);
      setRestorePoint("success");
      notify("repair.toast.restorePointCreated", "success");
    } catch (err) {
      setRestorePoint("error");
      notify("repair.toast.restorePointFailed", "error", { msg: sanitizeError(err) });
    }
  }, [notify]);

  const resetTool = useCallback((tool: RepairToolId) => {
    if (tool === "sfc") setSfc(initialState);
    else if (tool === "dism") setDism(initialState);
    else setRestorePoint("idle");
  }, []);

  return { sfc, dism, restorePoint, runSfc, runDism, createRestorePoint, resetTool };
}
