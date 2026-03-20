import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useUiStore } from "../stores/uiStore";
import type { ScheduledTask } from "../types/optimizer";

export function useScheduledTasks() {
  const { addToast } = useUiStore();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await optimizerService.getScheduledTasks();
      setTasks(result);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleTask = useCallback(
    async (taskPath: string, enabled: boolean) => {
      try {
        await optimizerService.setScheduledTaskEnabled(taskPath, enabled);
        setTasks((prev) =>
          prev.map((task) =>
            task.task_path === taskPath
              ? { ...task, state: enabled ? "Ready" : "Disabled" }
              : task
          )
        );
        addToast(
          t(enabled ? "optimizer.toast.taskEnabled" : "optimizer.toast.taskDisabled"),
          "success"
        );
      } catch (err) {
        addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, t]
  );

  return { tasks, isLoading, error, load, toggleTask };
}
