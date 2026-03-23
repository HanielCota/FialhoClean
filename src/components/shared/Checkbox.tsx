interface CheckboxProps {
  checked: boolean;
  size?: "sm" | "md"; // sm = w-4 h-4, md = w-5 h-5
  shape?: "square" | "circle";
  className?: string;
}

export function Checkbox({
  checked,
  size = "sm",
  shape = "square",
  className = "",
}: CheckboxProps) {
  const isMd = size === "md";
  const sizeClasses = isMd ? "w-5 h-5" : "w-4 h-4";
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded";
  const svgSize = isMd ? "w-3 h-3" : "w-2.5 h-2.5";

  return (
    <div
      aria-hidden="true"
      className={`${sizeClasses} ${shapeClass} flex flex-shrink-0 items-center justify-center border transition-all duration-150 ${
        checked ? "border-accent bg-accent text-on-accent" : "border-white/25 bg-transparent"
      } ${className}`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" className={`${svgSize} text-on-accent`} fill="none">
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
