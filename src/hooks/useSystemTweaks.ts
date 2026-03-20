import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useOptimizerStore } from "../stores/optimizerStore";
import { useUiStore } from "../stores/uiStore";

export function useSystemTweaks() {
  const {
    hibernateSettings,
    networkSettings,
    gpuSettings,
    privacySettings,
    setHibernateSettings,
    setNetworkSettings,
    setGpuSettings,
    setPrivacySettings,
  } = useOptimizerStore();
  const { addToast } = useUiStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hib, net, gpu, priv] = await Promise.all([
        optimizerService.getHibernateSettings(),
        optimizerService.getNetworkSettings(),
        optimizerService.getGpuSettings(),
        optimizerService.getPrivacySettings(),
      ]);
      setHibernateSettings(hib);
      setNetworkSettings(net);
      setGpuSettings(gpu);
      setPrivacySettings(priv);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, [setHibernateSettings, setNetworkSettings, setGpuSettings, setPrivacySettings]);

  useEffect(() => { void load(); }, [load]);

  const setHibernate = useCallback(async (enabled: boolean) => {
    try {
      await optimizerService.setHibernate(enabled);
      setHibernateSettings({ ...hibernateSettings, hibernate_enabled: enabled });
      addToast(
        enabled ? t("optimizer.toast.hibernateEnabled") : t("optimizer.toast.hibernateDisabled"),
        "success"
      );
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, hibernateSettings, setHibernateSettings, t]);

  const setFastStartup = useCallback(async (enabled: boolean) => {
    try {
      await optimizerService.setFastStartup(enabled);
      setHibernateSettings({ ...hibernateSettings, fast_startup_enabled: enabled });
      addToast(
        enabled ? t("optimizer.toast.fastStartupEnabled") : t("optimizer.toast.fastStartupDisabled"),
        "success"
      );
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, hibernateSettings, setHibernateSettings, t]);

  const applyGameMode = useCallback(async () => {
    try {
      await optimizerService.applyGameModePreset();
      addToast(t("optimizer.toast.gameModeApplied"), "success");
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, t]);

  const setNetworkOptimized = useCallback(async (enabled: boolean) => {
    try {
      await optimizerService.setNetworkOptimized(enabled);
      setNetworkSettings({ network_throttling_disabled: enabled });
      addToast(
        enabled ? t("optimizer.toast.networkOptimized") : t("optimizer.toast.networkRestored"),
        "success"
      );
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, setNetworkSettings, t]);

  const setGpuHags = useCallback(async (enabled: boolean) => {
    try {
      await optimizerService.setGpuHags(enabled);
      setGpuSettings({ hags_enabled: enabled });
      addToast(
        enabled ? t("optimizer.toast.hagsEnabled") : t("optimizer.toast.hagsDisabled"),
        "success"
      );
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, setGpuSettings, t]);

  const setPrivacy = useCallback(async (key: string, disabled: boolean) => {
    try {
      await optimizerService.setPrivacySetting(key, disabled);
      setPrivacySettings({ ...privacySettings, [`${key}_disabled`]: disabled });
      addToast(
        disabled ? t("optimizer.toast.privacyEnabled") : t("optimizer.toast.privacyDisabled"),
        "success"
      );
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, privacySettings, setPrivacySettings, t]);

  return {
    hibernateSettings,
    networkSettings,
    gpuSettings,
    privacySettings,
    isLoading,
    error,
    load,
    setHibernate,
    setFastStartup,
    applyGameMode,
    setNetworkOptimized,
    setGpuHags,
    setPrivacy,
  };
}
