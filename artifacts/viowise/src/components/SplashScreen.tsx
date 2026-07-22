import { useState, useEffect } from "react";

const SPLASH_KEY = "vw:splash";

type Phase = "visible" | "fading" | "done";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>(() =>
    sessionStorage.getItem(SPLASH_KEY) ? "done" : "visible",
  );

  useEffect(() => {
    if (phase !== "visible") return;
    sessionStorage.setItem(SPLASH_KEY, "1");
    const t1 = setTimeout(() => setPhase("fading"), 2200); // start fade-out at 2.2 s
    const t2 = setTimeout(() => setPhase("done"), 2900);   // unmount at 2.9 s
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        // Deeper violet at edges, luminous centre for a lit-from-within feel
        background:
          "radial-gradient(ellipse at 50% 44%, #7560D4 0%, #53409B 46%, #2F2163 100%)",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      {/* Outer ambient glow — slow breathe, wide spread */}
      <div className="splash-glow-outer" />
      {/* Inner concentrated glow — tighter, brighter, creates the "lit" centre */}
      <div className="splash-glow-inner" />

      {/* Logo: icon + wordmark drift up together */}
      <div className="splash-logo">
        {/* Favicon two-rect icon — fills lightened for legibility on dark violet bg */}
        <svg width="58" height="58" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="6" y="8" width="38" height="26" rx="13" fill="rgba(255,255,255,0.52)"/>
          <rect x="22" y="16" width="36" height="34" rx="14" fill="white"/>
          <path d="M26 49L26 59L36 49Z" fill="white"/>
        </svg>

        <span
          style={{
            color: "white",
            fontFamily: "var(--app-font-sans)",
            fontWeight: 600,
            fontSize: "clamp(2rem, 5.5vw, 2.75rem)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          VIOWISE
        </span>
      </div>

      {/* Tagline — drifts in a beat after the logo */}
      <p className="splash-tagline">Connecting Generations</p>

      {/* Thin divider — appears last, a quiet final flourish */}
      <div className="splash-line" />
    </div>
  );
}
