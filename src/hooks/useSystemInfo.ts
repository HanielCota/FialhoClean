import { useQuery } from "@tanstack/react-query";
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

export function useSystemInfo(autoRefresh = true): SystemInfoState {
  const {
    data,
    isLoading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ["system-info"],
    queryFn: async () => {
      const [info, disks] = await Promise.all([
        systemService.getSystemInfo(),
        systemService.getDiskUsage(),
      ]);
      return { info, disks };
    },
    refetchInterval: autoRefresh ? 5000 : false,
    staleTime: 2000,
  });

  return {
    systemInfo: data?.info ?? null,
    diskUsage: data?.disks ?? [],
    isLoading: isLoading && !data,
    error: rawError ? sanitizeError(rawError) : null,
    refresh: refetch,
  };
}
