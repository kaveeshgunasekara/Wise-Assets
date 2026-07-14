import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";

export default function Landing() {
  const heroImgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect and track prefers-reduced-motion, update live if OS setting changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Slow the video to 0.75x for a calmer, more luxurious pace
  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = 0.75;
  }, [reducedMotion]);

  // Parallax on the static image (reduced-motion path only)
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
    <div className="min-h-screen relative overflow-hidden flex flex-col">

      {/* ── Full-viewport background layers (behind everything) ─────────── */}

      {/* Static poster / fallback — always present under the video */}
      <div
        ref={heroImgRef}
        className="absolute inset-0 opacity-[0.82]"
        style={{
          backgroundImage: "url('/hero-connection.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center 50%",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Video — full viewport, behind nav + hero + footer.
          Shifted up 8% to push the PixVerse watermark above the visible edge. */}
      {!reducedMotion && (
        <video
          ref={videoRef}
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
            objectPosition: "center 8%",
            opacity: 0.82,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Central text overlay — strengthened so headline and subline stay
          readable across the entire video loop including brighter frames. */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: [
            "radial-gradient(ellipse 80% 60% at 50% 52%, rgba(247,245,251,0.92) 0%, rgba(247,245,251,0.76) 30%, rgba(247,245,251,0.40) 65%, rgba(247,245,251,0.10) 100%)",
          ].join(", "),
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Top gradient scrim — masks the PixVerse watermark corner and keeps
          nav text readable; also dims the edges of the video frame. */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: "120px",
          zIndex: 3,
          background: "linear-gradient(to bottom, rgba(247,245,251,0.72) 0%, rgba(247,245,251,0.30) 60%, rgba(247,245,251,0) 100%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Top-right corner mask — fully opaque in the corner to guarantee
          the PixVerse watermark is invisible across the entire video loop. */}
      <div
        className="absolute top-0 right-0"
        style={{
          width: "380px",
          height: "110px",
          zIndex: 5,
          background: "radial-gradient(ellipse at top right, rgba(247,245,251,1) 0%, rgba(247,245,251,0.95) 25%, rgba(247,245,251,0.70) 55%, rgba(247,245,251,0) 100%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Bottom gradient scrim — softens footer area */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "80px",
          zIndex: 3,
          background: "linear-gradient(to top, rgba(247,245,251,0.55) 0%, rgba(247,245,251,0) 100%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* SVG connection ripple — reduced-motion only */}
      {reducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }} aria-hidden="true">
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

      {/* ── Header — transparent, floats over the video ──────────────────── */}
      <header className="relative px-6 py-4 flex items-center justify-between" style={{ zIndex: 10 }}>
        <div className="flex items-center gap-2 text-primary font-bold tracking-wide uppercase" style={{ fontSize: "1.125rem" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/sign-in" className="px-4 py-2 font-medium text-foreground hover:text-primary transition-colors">Sign in</Link>
          <AccessibilityControl />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center min-h-[540px]" style={{ zIndex: 10, position: "relative" }}>
        <div className="flex flex-col items-center text-center px-8 py-20 max-w-4xl mx-auto w-full">
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
            {/* Primary — solid violet */}
            <Link
              href="/sign-up"
              className="btn-action flex-1 bg-primary text-white text-[18px] font-medium py-4 px-6 rounded-xl shadow-lg
                         hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-xl
                         active:scale-[0.98] transition-all duration-150 text-center"
            >
              I want to share my wisdom
            </Link>

            {/* Secondary — frosted glass so it holds shape over any video frame */}
            <Link
              href="/sign-up"
              className="btn-action flex-1 text-primary text-[18px] font-medium py-4 px-6 rounded-xl border border-white/60 shadow-lg
                         hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 hover:shadow-xl
                         active:scale-[0.98] transition-all duration-150 text-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              I want to learn from experience
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer / trust line ──────────────────────────────────────────── */}
      <footer className="py-8 text-center text-foreground/70 text-[16px] flex items-center justify-center gap-2" style={{ zIndex: 10, position: "relative" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Every member is ID-verified. Calls are never recorded.
      </footer>
    </div>
  );
}
