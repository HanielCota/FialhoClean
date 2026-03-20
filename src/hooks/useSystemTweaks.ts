import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeError } from "../lib/errors";
import { optimizerService } from "../services/optimizerService";
import { useUiStore } from "../stores/uiStore";
import type { HibernateSettings, NetworkSettings } from "../types/optimizer";

const DEFAULT_HIBERNATE: HibernateSettings = {
  hibernate_enabled: false,
  fast_startup_enabled: false,
};

const DEFAULT_NETWORK: NetworkSettings = {
  network_throttling_disabled: false,
};

export function useSystemTweaks() {
  const { addToast } = useUiStore();
  const { t } = useTranslation();

  const [hibernateSettings, setHibernateSettings] =
    useState<HibernateSettings>(DEFAULT_HIBERNATE);
  const [networkSettings, setNetworkSettings] =
    useState<NetworkSettings>(DEFAULT_NETWORK);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hibernate, network] = await Promise.all([
        optimizerService.getHibernateSettings(),
        optimizerService.getNetworkSettings(),
      ]);
      setHibernateSettings(hibernate);
      setNetworkSettings(network);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setHibernate = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setHibernate(enabled);
        setHibernateSettings((prev) => ({ ...prev, hibernate_enabled: enabled }));
        addToast(
          t(enabled ? "optimizer.toast.hibernateEnabled" : "optimizer.toast.hibernateDisabled"),
          "success"
        );
      } catch (err) {
        addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, t]
  );

  const setFastStartup = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setFastStartup(enabled);
        setHibernateSettings((prev) => ({ ...prev, fast_startup_enabled: enabled }));
        addToast(
          t(
            enabled
              ? "optimizer.toast.fastStartupEnabled"
              : "optimizer.toast.fastStartupDisabled"
          ),
          "success"
        );
      } catch (err) {
        addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, t]
  );

  const applyGameMode = useCallback(async () => {
    try {
      await optimizerService.applyGameModePreset();
      addToast(t("optimizer.toast.gameModeApplied"), "success");
    } catch (err) {
      addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
    }
  }, [addToast, t]);

  const setNetworkOptimized = useCallback(
    async (enabled: boolean) => {
      try {
        await optimizerService.setNetworkOptimized(enabled);
        setNetworkSettings({ network_throttling_disabled: enabled });
        addToast(
          t(
            enabled
              ? "optimizer.toast.networkOptimized"
              : "optimizer.toast.networkRestored"
          ),
          "success"
        );
      } catch (err) {
        addToast(t("optimizer.toast.tweakFailed", { msg: sanitizeError(err) }), "error");
      }
    },
    [addToast, t]
  );

  return {
    hibernateSettings,
    networkSettings,
    isLoading,
    error,
    load,
    setHibernate,
    setFastStartup,
    applyGameMode,
    setNetworkOptimized,
  };
}
