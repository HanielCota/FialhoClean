export function StepDots({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label: string;
}) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 pt-3 pb-1"
      role="status"
      aria-label={label}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i + 1 === current
              ? "w-4 h-1.5 bg-accent"
              : i + 1 < current
              ? "w-1.5 h-1.5 bg-accent/40"
              : "w-1.5 h-1.5 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}
