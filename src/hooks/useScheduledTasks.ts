import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useNotify } from "./useNotify";

export function useScheduledTasks() {
  const { scheduledTasks } = useOptimizerStore();
  const notify = useNotify();

  const {
    isLoading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ["scheduled-tasks"],
    queryFn: async () => {
      const tasks = await optimizerService.getScheduledTasks();
      useOptimizerStore.getState().setScheduledTasks(tasks);
      return tasks;
    },
  });

  const error = rawError ? sanitizeError(rawError) : null;

  const toggleTask = useCallback(
    async (taskPath: string, enabled: boolean) => {
      try {
        await optimizerService.setScheduledTaskEnabled(taskPath, enabled);
        const current = useOptimizerStore.getState().scheduledTasks;
        useOptimizerStore
          .getState()
          .setScheduledTasks(
            current.map((task) =>
              task.task_path === taskPath
                ? { ...task, state: enabled ? "Ready" : "Disabled" }
                : task,
            ),
          );
        notify(enabled ? "optimizer.toast.taskEnabled" : "optimizer.toast.taskDisabled", "success");
      } catch (err) {
        notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  return { tasks: scheduledTasks, isLoading, error, load: refetch, toggleTask };
}
