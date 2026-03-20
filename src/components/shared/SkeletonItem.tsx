interface SkeletonItemProps {
  height?: string;
}

export function SkeletonItem({ height = "h-16" }: SkeletonItemProps) {
  return (
    <div
      className={`${height} bg-card border border-white/[0.06] rounded-xl animate-shimmer`}
    />
  );
}
