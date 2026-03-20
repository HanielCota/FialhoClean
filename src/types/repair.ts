export interface RepairResult {
  success: boolean;
  output: string;
}

export type RepairToolId = "sfc" | "dism" | "restore_point";

export type RepairStatus = "idle" | "running" | "success" | "error";
