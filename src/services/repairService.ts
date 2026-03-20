import { invoke } from "../lib/invoke";
import type { RepairResult } from "../types/repair";

export const repairService = {
  runSfc: () => invoke<RepairResult>("run_sfc"),
  runDism: () => invoke<RepairResult>("run_dism"),
  createRestorePoint: (description: string) =>
    invoke<void>("create_restore_point", { description }),
};
