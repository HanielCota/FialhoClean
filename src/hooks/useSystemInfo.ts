import { useCallback, useEffect, useState } from "react";
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

export function useSystemInfo(): SystemInfoState {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [diskUsage, setDiskUsage] = useState<DiskUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { systemInfo, diskUsage, isLoading, error, refresh };
}
