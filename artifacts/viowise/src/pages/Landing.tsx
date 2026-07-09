import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";

export default function Landing() {
  const heroImgRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scroll parallax — hero image moves at ~30% of scroll speed.
  // Direct DOM mutation (no setState) keeps it off the React render cycle.
  useEffect(() => {
    if (reducedMotion) return;

    const onScroll = () => {
      if (!heroImgRef.current) return;
      heroImgRef.current.style.backgroundPositionY = `calc(50% + ${window.scrollY * 0.3}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="relative px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/sign-in" className="px-4 py-2 font-medium text-foreground hover:text-primary transition-colors">Sign in</Link>
          <AccessibilityControl />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="flex-1 relative flex flex-col items-center justify-center min-h-[540px]">

        {/* Background image — parallax driven by scroll via ref */}
        <div
          ref={heroImgRef}
          className="absolute inset-0 opacity-[0.72]"
          style={{
            backgroundImage: "url('/hero-connection.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center 50%",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
        />

        {/* Overlay — wide radial white fade so faces stay visible at edges */}
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 65% 75% at 50% 48%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0.40) 65%, rgba(255,255,255,0.10) 100%)",
              "linear-gradient(to bottom, rgba(248,247,255,0.30) 0%, transparent 30%, transparent 70%, rgba(248,247,255,0.30) 100%)",
            ].join(", "),
          }}
          aria-hidden="true"
        />

        {/* Connection ripple SVG — only when motion is allowed.
            Three concentric rings that slowly pulse outward from the hero
            centre, evoking the idea of connection radiating between people.
            All strokes are very low opacity so they read as texture, not UI. */}
        {!reducedMotion && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 800 520"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0 w-full h-full"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* Soft violet radial glow at the centre */}
                <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#53409B" stopOpacity="0.13" />
                  <stop offset="100%" stopColor="#53409B" stopOpacity="0"    />
                </radialGradient>
              </defs>

              {/* Central soft glow — slow breathe */}
              <ellipse cx="400" cy="260" rx="72" ry="72" fill="url(#heroGlow)">
                <animate
                  attributeName="rx" values="68;78;68"
                  dur="5s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
                <animate
                  attributeName="ry" values="68;78;68"
                  dur="5s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
                <animate
                  attributeName="opacity" values="0.7;1;0.7"
                  dur="5s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
              </ellipse>

              {/* Ring 1 — nearest, most visible */}
              <circle cx="400" cy="260" r="110" fill="none" stroke="#53409B" strokeWidth="1">
                <animate
                  attributeName="r" values="106;118;106"
                  dur="5s" begin="0s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
                <animate
                  attributeName="opacity" values="0.05;0.14;0.05"
                  dur="5s" begin="0s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
              </circle>

              {/* Ring 2 — mid distance, offset timing */}
              <circle cx="400" cy="260" r="180" fill="none" stroke="#53409B" strokeWidth="0.8">
                <animate
                  attributeName="r" values="175;190;175"
                  dur="6.5s" begin="1.2s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
                <animate
                  attributeName="opacity" values="0.03;0.09;0.03"
                  dur="6.5s" begin="1.2s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
              </circle>

              {/* Ring 3 — outermost, barely perceptible */}
              <circle cx="400" cy="260" r="255" fill="none" stroke="#53409B" strokeWidth="0.6">
                <animate
                  attributeName="r" values="248;266;248"
                  dur="8s" begin="2.6s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
                <animate
                  attributeName="opacity" values="0.02;0.06;0.02"
                  dur="8s" begin="2.6s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                />
              </circle>
            </svg>
          </div>
        )}

        {/* Content — staggered entrance, each element rises 12-16px and fades in */}
        <div className="relative z-10 flex flex-col items-center text-center px-8 py-20 max-w-4xl mx-auto w-full">
          <span
            className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-6 animate-hero-in"
            style={{ "--hero-delay": "0ms" } as React.CSSProperties}
          >
            CONNECTING GENERATIONS
          </span>

          <h1
            className="text-[56px] leading-tight font-serif font-normal italic text-foreground mb-6 animate-hero-in"
            style={{ "--hero-delay": "100ms" } as React.CSSProperties}
          >
            Your experience is someone's answer.
          </h1>

          <p
            className="text-[20px] text-foreground/80 mb-12 max-w-2xl animate-hero-in"
            style={{ "--hero-delay": "220ms" } as React.CSSProperties}
          >
            Real conversations between generations, guided by AI — never replaced by it.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl animate-hero-in"
            style={{ "--hero-delay": "350ms" } as React.CSSProperties}
          >
            <Link
              href="/sign-up"
              className="btn-action flex-1 bg-primary text-white text-[18px] font-medium py-4 px-6 rounded-xl shadow-lg
                         hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-xl
                         active:scale-[0.98] transition-all duration-150"
            >
              I want to share my wisdom
            </Link>
            <Link
              href="/sign-up"
              className="btn-action flex-1 bg-white text-primary text-[18px] font-medium py-4 px-6 rounded-xl border border-primary/20 shadow-lg
                         hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 hover:shadow-xl
                         active:scale-[0.98] transition-all duration-150"
            >
              I want to learn from experience
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="py-8 text-center text-foreground/60 text-[16px] flex items-center justify-center gap-2 z-10 relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Every member is ID-verified. Calls are never recorded.
      </footer>
    </div>
  );
}
