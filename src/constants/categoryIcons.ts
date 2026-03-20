import type { ComponentType } from "react";
import { AlertCircle, Clock, FileText, FileWarning, Gamepad2, Globe, HardDrive, Image, Layers, MessageSquare, Music, Network, RotateCcw, Share2, Trash2, Zap } from "lucide-react";
import type { CleanCategory } from "../types/cleaner";

export const CATEGORY_ICONS: Record<
  CleanCategory,
  ComponentType<{ className?: string }>
> = {
  temp_files: Trash2,
  browser_cache: Globe,
  recycle_bin: RotateCcw,
  old_logs: FileText,
  prefetch: Zap,
  windows_update_cache: HardDrive,
  delivery_optimization: Share2,
  windows_error_reports: AlertCircle,
  thumbnail_cache: Image,
  icon_cache: Layers,
  memory_dumps: FileWarning,
  discord_cache: MessageSquare,
  spotify_cache: Music,
  steam_cache: Gamepad2,
  recent_files: Clock,
  dns_cache: Network,
};
