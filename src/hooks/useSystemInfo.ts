import { useCallback, useEffect, useRef, useState } from "react";
import { sanitizeError } from "../lib/errors";
import { systemService } from "../services/systemService";
import type { DiskUsage, SystemInfo } from "../types/system";

interface SystemInfoState {
  systemInfo: SystemInfo | null;
  diskUsage: DiskUsage[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const AUTO_REFRESH_INTERVAL = 5000; // 5 seconds

export function useSystemInfo(autoRefresh = true): SystemInfoState {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [diskUsage, setDiskUsage] = useState<DiskUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const [info, disks] = await Promise.all([
        systemService.getSystemInfo(),
        systemService.getDiskUsage(),
      ]);
      setSystemInfo(info);
      setDiskUsage(disks);
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Silent background refresh (no loading spinner)
  const silentRefresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [info, disks] = await Promise.all([
        systemService.getSystemInfo(),
        systemService.getDiskUsage(),
      ]);
      setSystemInfo(info);
      setDiskUsage(disks);
    } catch {
      // silent – don't show error for background refresh
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => void silentRefresh(), AUTO_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [autoRefresh, silentRefresh]);

  return { systemInfo, diskUsage, isLoading, error, refresh };
}
