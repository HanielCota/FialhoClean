import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

/* Three orbiting dots — each is a zero-size wrapper that rotates around the
   center; the visible dot is offset via marginLeft so it traces a circle. */
const ORBIT_DOTS = [
  { size: "w-2 h-2",   opacity: "bg-white/75", radius: 54, duration: "4s",   delay: "0s"   },
  { size: "w-1.5 h-1.5", opacity: "bg-white/50", radius: 62, duration: "6s",   delay: "-2.5s" },
  { size: "w-1 h-1",   opacity: "bg-white/35", radius: 46, duration: "3.5s", delay: "-1.2s" },
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
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background/88 backdrop-blur-md animate-fade-in"
    >
      {/* ── Animation stage ── */}
      <div className="relative w-44 h-44 flex items-center justify-center">

        {/* Ripple rings */}
        {RIPPLE_DELAYS.map((delay, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-white/20 animate-ripple-out pointer-events-none"
            style={{ animationDelay: delay }}
          />
        ))}

        {/* Outer rotating dashed ring */}
        <div className="absolute inset-3 rounded-full border border-dashed border-white/[0.16] animate-rotate-slow pointer-events-none" />

        {/* Inner counter-rotating ring */}
        <div className="absolute inset-7 rounded-full border border-dotted border-white/[0.10] animate-rotate-slow-reverse pointer-events-none" />

        {/* Orbiting dots */}
        {ORBIT_DOTS.map(({ size, opacity, radius, duration, delay }, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
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
        <div className="absolute inset-[30px] rounded-full bg-white/[0.04] animate-glow-pulse pointer-events-none" />

        {/* Central icon */}
        <div className="relative z-10 w-[68px] h-[68px] rounded-full bg-white/[0.07] border border-white/[0.14] flex items-center justify-center shadow-[0_0_36px_rgba(255,255,255,0.07)]">
          <Sparkles className="w-7 h-7 text-white/90" />
        </div>
      </div>

      {/* ── Text ── */}
      <div className="text-center space-y-1.5">
        <p className="text-[17px] font-semibold text-text tracking-tight">
          {t("cleaner.cleaning.title")}
        </p>
        <p className="text-[13px] text-text-muted">
          {t("cleaner.cleaning.subtitle")}
        </p>
      </div>

      {/* ── Pulsing progress dots ── */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/35 animate-pulse-dot"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
