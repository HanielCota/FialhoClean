import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useUiStore } from "../stores/uiStore";

export function useScheduledTasks() {
  const { scheduledTasks, setScheduledTasks } = useOptimizerStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tasks = await optimizerService.getScheduledTasks();
      setScheduledTasks(tasks);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, [setScheduledTasks]);

  useEffect(() => { void load(); }, [load]);

  const toggleTask = useCallback(
    async (taskPath: string, enabled: boolean) => {
      try {
        await optimizerService.setScheduledTaskEnabled(taskPath, enabled);
        setScheduledTasks(
          scheduledTasks.map((t) =>
            t.task_path === taskPath
              ? { ...t, state: enabled ? "Ready" : "Disabled" }
              : t
          )
        );
        addToast(
          enabled ? t("optimizer.toast.taskEnabled") : t("optimizer.toast.taskDisabled"),
          "success"
        );
      } catch (err) {
        addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, scheduledTasks, setScheduledTasks, t]
  );

  return { tasks: scheduledTasks, isLoading, error, load, toggleTask };
}
