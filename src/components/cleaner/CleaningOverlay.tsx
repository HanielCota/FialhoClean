import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

/* Three orbiting dots — each is a zero-size wrapper that rotates around the
   center; the visible dot is offset via marginLeft so it traces a circle. */
const ORBIT_DOTS = [
  { size: "w-2 h-2", opacity: "bg-white/75", radius: 54, duration: "4s", delay: "0s" },
  { size: "w-1.5 h-1.5", opacity: "bg-white/50", radius: 62, duration: "6s", delay: "-2.5s" },
  { size: "w-1 h-1", opacity: "bg-white/35", radius: 46, duration: "3.5s", delay: "-1.2s" },
] as const;

/* Ripple rings — three concentric circles that expand outward and fade. */
const RIPPLE_DELAYS = ["0s", "0.8s", "1.6s"] as const;

export function CleaningOverlay() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-busy="true"
      className="fixed inset-0 z-40 flex animate-fade-in flex-col items-center justify-center gap-8 bg-background/95"
    >
      {/* ── Animation stage ── */}
      <div className="relative flex h-44 w-44 items-center justify-center">
        {/* Ripple rings */}
        {RIPPLE_DELAYS.map((delay, i) => (
          <div
            key={i}
            className="pointer-events-none absolute inset-0 animate-ripple-out rounded-full border border-white/20"
            style={{ animationDelay: delay }}
          />
        ))}

        {/* Outer rotating dashed ring */}
        <div className="pointer-events-none absolute inset-3 animate-rotate-slow rounded-full border border-white/[0.16] border-dashed" />

        {/* Inner counter-rotating ring */}
        <div className="pointer-events-none absolute inset-7 animate-rotate-slow-reverse rounded-full border border-white/[0.10] border-dotted" />

        {/* Orbiting dots */}
        {ORBIT_DOTS.map(({ size, opacity, radius, duration, delay }, i) => (
          <div
            key={i}
            className="pointer-events-none absolute"
            style={{
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              animation: `orbit ${duration} linear infinite ${delay}`,
            }}
          >
            <div
              className={`rounded-full ${size} ${opacity}`}
              style={{
                marginLeft: `${radius}px`,
                marginTop: "-4px",
                boxShadow: i === 0 ? "0 0 8px rgba(255,255,255,0.45)" : undefined,
              }}
            />
          </div>
        ))}

        {/* Central glow disc */}
        <div className="pointer-events-none absolute inset-[30px] animate-glow-pulse rounded-full bg-white/[0.04]" />

        {/* Central icon */}
        <div className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.07]">
          <Sparkles className="h-7 w-7 text-white/90" />
        </div>
      </div>

      {/* ── Text ── */}
      <div className="space-y-1.5 text-center">
        <p className="font-semibold text-[17px] text-text tracking-tight">
          {t("cleaner.cleaning.title")}
        </p>
        <p className="text-[13px] text-text-muted">{t("cleaner.cleaning.subtitle")}</p>
      </div>

      {/* ── Pulsing progress dots ── */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-white/35"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
