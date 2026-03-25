import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeError } from "../lib/errors";
import { repairService } from "../services/repairService";
import type { RepairResult, RepairStatus, RepairToolId } from "../types/repair";
import { useNotify } from "./useNotify";

export interface RepairToolState {
  status: RepairStatus;
  result: RepairResult | null;
  elapsedSeconds: number;
}

const initialState: RepairToolState = { status: "idle", result: null, elapsedSeconds: 0 };

/** Format seconds into "Xm Ys" or "Xs". */
export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Tick elapsed seconds while status === "running". */
function useElapsedTimer(
  status: RepairStatus,
  setElapsed: (updater: (prev: RepairToolState) => RepairToolState) => void,
  _key: "sfc" | "dism",
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, setElapsed]);
}

export function useRepair() {
  const notify = useNotify();

  const [sfc, setSfc] = useState<RepairToolState>(initialState);
  const [dism, setDism] = useState<RepairToolState>(initialState);
  const [restorePoint, setRestorePoint] = useState<RepairStatus>("idle");
  const [rpElapsed, setRpElapsed] = useState(0);

  useElapsedTimer(sfc.status, setSfc, "sfc");
  useElapsedTimer(dism.status, setDism, "dism");

  // Elapsed timer for restore point
  const rpIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (restorePoint === "running") {
      rpIntervalRef.current = setInterval(() => {
        setRpElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (rpIntervalRef.current) {
        clearInterval(rpIntervalRef.current);
        rpIntervalRef.current = null;
      }
    };
  }, [restorePoint]);

  const runSfc = useCallback(async () => {
    setSfc({ status: "running", result: null, elapsedSeconds: 0 });
    try {
      const result = await repairService.runSfc();
      setSfc((prev) => ({
        status: result.success ? "success" : "error",
        result,
        elapsedSeconds: prev.elapsedSeconds,
      }));
      notify(
        result.success ? "repair.toast.sfcSuccess" : "repair.toast.sfcFailed",
        result.success ? "success" : "error",
      );
    } catch (err) {
      const msg = sanitizeError(err);
      setSfc((prev) => ({
        status: "error",
        result: { success: false, output: msg },
        elapsedSeconds: prev.elapsedSeconds,
      }));
      notify("repair.toast.sfcFailed", "error");
    }
  }, [notify]);

  const runDism = useCallback(async () => {
    setDism({ status: "running", result: null, elapsedSeconds: 0 });
    try {
      const result = await repairService.runDism();
      setDism((prev) => ({
        status: result.success ? "success" : "error",
        result,
        elapsedSeconds: prev.elapsedSeconds,
      }));
      notify(
        result.success ? "repair.toast.dismSuccess" : "repair.toast.dismFailed",
        result.success ? "success" : "error",
      );
    } catch (err) {
      const msg = sanitizeError(err);
      setDism((prev) => ({
        status: "error",
        result: { success: false, output: msg },
        elapsedSeconds: prev.elapsedSeconds,
      }));
      notify("repair.toast.dismFailed", "error");
    }
  }, [notify]);

  const createRestorePoint = useCallback(
    async (description: string) => {
      setRestorePoint("running");
      setRpElapsed(0);
      try {
        await repairService.createRestorePoint(description);
        setRestorePoint("success");
        notify("repair.toast.restorePointCreated", "success");
      } catch (err) {
        setRestorePoint("error");
        notify("repair.toast.restorePointFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  const resetTool = useCallback((tool: RepairToolId) => {
    if (tool === "sfc") {
      setSfc(initialState);
      return;
    }
    if (tool === "dism") {
      setDism(initialState);
      return;
    }
    setRestorePoint("idle");
    setRpElapsed(0);
  }, []);

  return {
    sfc,
    dism,
    restorePoint,
    rpElapsed,
    runSfc,
    runDism,
    createRestorePoint,
    resetTool,
  };
}
