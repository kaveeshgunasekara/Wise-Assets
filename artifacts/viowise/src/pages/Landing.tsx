import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";

export default function Landing() {
  const heroImgRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect and track prefers-reduced-motion, update live if OS setting changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Parallax for the static image fallback (reduced-motion path only)
  useEffect(() => {
    if (reducedMotion || !heroImgRef.current) return;
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

        {/* Static poster / fallback image — always rendered underneath.
            When the video is ready and motion is allowed it fades behind
            the video; when reduced-motion is on it's all that shows. */}
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

        {/* Video background — only when motion is allowed.
            The browser shows the poster until it can start playing,
            so no JS opacity gate is needed — simpler and more reliable.
            poster="/hero-connection.jpeg" handles the pre-load state. */}
        {!reducedMotion && (
          <video
            src="/hero-video.mp4"
            poster="/hero-connection.jpeg"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              opacity: 0.82,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Overlay — keeps headline and buttons readable over the moving video.
            Stronger centre fade than the static version to account for the
            video's richer colours and motion. */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: [
              "radial-gradient(ellipse 70% 80% at 50% 48%, rgba(247,245,251,0.88) 0%, rgba(247,245,251,0.70) 30%, rgba(247,245,251,0.35) 60%, rgba(247,245,251,0.08) 100%)",
              "linear-gradient(to bottom, rgba(247,245,251,0.35) 0%, transparent 25%, transparent 75%, rgba(247,245,251,0.35) 100%)",
            ].join(", "),
          }}
          aria-hidden="true"
        />

        {/* SVG connection ripple — only shown in static/reduced-motion mode
            since the video already provides animated connection lines */}
        {reducedMotion && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
              <defs>
                <radialGradient id="heroGlowStatic" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#53409B" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#53409B" stopOpacity="0"    />
                </radialGradient>
              </defs>
              <ellipse cx="400" cy="260" rx="72" ry="72" fill="url(#heroGlowStatic)" />
              <circle cx="400" cy="260" r="110" fill="none" stroke="#53409B" strokeWidth="1"   opacity="0.08" />
              <circle cx="400" cy="260" r="180" fill="none" stroke="#53409B" strokeWidth="0.8" opacity="0.05" />
              <circle cx="400" cy="260" r="255" fill="none" stroke="#53409B" strokeWidth="0.6" opacity="0.03" />
            </svg>
          </div>
        )}

        {/* Hero text + CTAs — always above every background layer */}
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
