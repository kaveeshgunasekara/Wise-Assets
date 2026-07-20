import { useState, useEffect } from "react";

const SPLASH_KEY = "vw:splash";

type Phase = "visible" | "fading" | "done";

export default function SplashScreen() {
  // Skip immediately if already shown this session
  const [phase, setPhase] = useState<Phase>(() =>
    sessionStorage.getItem(SPLASH_KEY) ? "done" : "visible",
  );

  useEffect(() => {
    if (phase !== "visible") return;
    sessionStorage.setItem(SPLASH_KEY, "1");
    const t1 = setTimeout(() => setPhase("fading"), 2000); // start fade-out at 2 s
    const t2 = setTimeout(() => setPhase("done"), 2500);   // unmount at 2.5 s
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
        gap: "1.25rem",
        // Subtle radial gradient: lighter violet at center, deeper at edges
        background:
          "radial-gradient(ellipse at 50% 42%, #6B52C8 0%, #53409B 48%, #372A75 100%)",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 500ms ease-in-out",
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      {/* Soft ambient glow behind the logo — barely perceptible, adds depth */}
      <div className="splash-glow" />

      {/* Logo: icon + wordmark — animates in as one unit */}
      <div className="splash-logo">
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        <span
          style={{
            color: "white",
            fontFamily: "var(--app-font-sans)",
            fontWeight: 600,
            fontSize: "clamp(1.6rem, 4vw, 2.1rem)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          VIOWISE
        </span>
      </div>

      {/* Tagline — fades in slightly after the logo */}
      <p className="splash-tagline">Connecting Generations</p>
    </div>
  );
}
