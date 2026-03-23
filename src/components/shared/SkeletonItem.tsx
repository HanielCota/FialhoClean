interface SkeletonItemProps {
  height?: string;
}

export function SkeletonItem({ height = "h-16" }: SkeletonItemProps) {
  return (
    <div className={`${height} animate-shimmer rounded-xl border border-white/[0.06] bg-card`} />
  );
}
