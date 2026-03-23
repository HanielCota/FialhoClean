import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useNotify } from "./useNotify";

export function useSystemTweaks() {
  const { hibernateSettings, networkSettings, gpuSettings, privacySettings } = useOptimizerStore();
  const notify = useNotify();

  const { isLoading, error: rawError } = useQuery({
    queryKey: ["system-tweaks"],
    queryFn: async () => {
      const [hibernateResult, networkResult, gpuResult, privacyResult] = await Promise.all([
        optimizerService.getHibernateSettings(),
        optimizerService.getNetworkSettings(),
        optimizerService.getGpuSettings(),
        optimizerService.getPrivacySettings(),
      ]);
      const state = useOptimizerStore.getState();
      state.setHibernateSettings(hibernateResult);
      state.setNetworkSettings(networkResult);
      state.setGpuSettings(gpuResult);
      state.setPrivacySettings(privacyResult);
      return { hibernateResult, networkResult, gpuResult, privacyResult };
    },
  });

  const error = rawError ? sanitizeError(rawError) : null;

  const setHibernate = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setHibernate(enabled);
        const current = useOptimizerStore.getState().hibernateSettings;
        if (!current) return;
        useOptimizerStore
          .getState()
          .setHibernateSettings({ ...current, hibernate_enabled: enabled });
        notify(
          enabled ? "optimizer.toast.hibernateEnabled" : "optimizer.toast.hibernateDisabled",
          "success",
        );
      } catch (err) {
        notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  const setFastStartup = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setFastStartup(enabled);
        const current = useOptimizerStore.getState().hibernateSettings;
        if (!current) return;
        useOptimizerStore
          .getState()
          .setHibernateSettings({ ...current, fast_startup_enabled: enabled });
        notify(
          enabled ? "optimizer.toast.fastStartupEnabled" : "optimizer.toast.fastStartupDisabled",
          "success",
        );
      } catch (err) {
        notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  const applyGameMode = useCallback(async () => {
    try {
      await optimizerService.applyGameModePreset();
      notify("optimizer.toast.gameModeApplied", "success");
    } catch (err) {
      notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
    }
  }, [notify]);

  const setNetworkOptimized = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setNetworkOptimized(enabled);
        useOptimizerStore.getState().setNetworkSettings({ network_throttling_disabled: enabled });
        notify(
          enabled ? "optimizer.toast.networkOptimized" : "optimizer.toast.networkRestored",
          "success",
        );
      } catch (err) {
        notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  const setGpuHags = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setGpuHags(enabled);
        useOptimizerStore.getState().setGpuSettings({ hags_enabled: enabled });
        notify(enabled ? "optimizer.toast.hagsEnabled" : "optimizer.toast.hagsDisabled", "success");
      } catch (err) {
        notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  const setPrivacy = useCallback(
    async (key: string, disabled: boolean) => {
      try {
        await optimizerService.setPrivacySetting(key, disabled);
        const current = useOptimizerStore.getState().privacySettings;
        if (!current) return;
        useOptimizerStore
          .getState()
          .setPrivacySettings({ ...current, [`${key}_disabled`]: disabled });
        notify(
          disabled ? "optimizer.toast.privacyEnabled" : "optimizer.toast.privacyDisabled",
          "success",
        );
      } catch (err) {
        notify("optimizer.toast.tweakFailed", "error", { msg: sanitizeError(err) });
      }
    },
    [notify],
  );

  return {
    hibernateSettings,
    networkSettings,
    gpuSettings,
    privacySettings,
    isLoading,
    error,
    setHibernate,
    setFastStartup,
    applyGameMode,
    setNetworkOptimized,
    setGpuHags,
    setPrivacy,
  };
}
