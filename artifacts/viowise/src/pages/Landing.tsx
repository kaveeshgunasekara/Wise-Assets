import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";
import { useApp } from "@/hooks/use-app";

export default function Landing() {
  const heroImgRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { highContrast } = useApp();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = 0.75;
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !heroImgRef.current) return;
    const onScroll = () => {
      if (!heroImgRef.current) return;
      heroImgRef.current.style.backgroundPositionY = `calc(50% + ${window.scrollY * 0.3}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  const showVideo = !reducedMotion && !highContrast;

  return (
    /*
      Outer wrapper has NO overflow:hidden — that was clipping the
      AccessibilityControl dropdown so it never appeared.
      Instead, the background layers live in their own absolute div
      that has overflow:hidden, isolating the video/transform crop
      without affecting any UI element's click or visibility.
    */
    <div className="hero-height" style={{ backgroundColor: "#EDE8F7", position: "relative", display: "flex", flexDirection: "column" }}>

      {/* ── Background container (isolated overflow crop) ─────────────────
          overflow:hidden here clips the scaled video without affecting
          the nav dropdown or any other interactive element.           */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: "-2px",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {/* Static poster / solid fallback */}
        <div
          ref={heroImgRef}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: highContrast ? "none" : "url('/hero-connection.jpeg')",
            backgroundColor: highContrast ? "#F0EDF8" : "transparent",
            backgroundSize: "cover",
            backgroundPosition: "center 50%",
            backgroundRepeat: "no-repeat",
            opacity: highContrast ? 1 : 0.82,
          }}
        />

        {/* Full-screen background video — hero-video.mp4 (iStock).
            No transform: the watermark is in the centre and is masked by
            the radial overlay + the hero text block that sits on top.     */}
        {showVideo && (
          <video
            ref={videoRef}
            src="/hero-video.mp4"
            poster="/hero-connection.jpeg"
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 50%",
              opacity: 0.80,
              pointerEvents: "none",
            }}
          />
        )}

        {/* ── Overlay system: violet-tinted brand depth ────────────────────
            Three layers compose into the final look:
            1. Centre-lit lavender gradient — keeps hero text readable,
               masks the iStock watermark, brightens mid-section.
            2. Edge vignette — deeper brand violet at frame perimeter,
               adds cinematic depth without darkening the text zone.
            3. Watermark suppressor — tight ellipse over dead-centre.   */}

        {/* Layer 1 — Centre-lit branded radial */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: highContrast
              ? "rgba(240,237,248,0.97)"
              : "radial-gradient(ellipse 75% 60% at 50% 52%, rgba(237,232,247,0.86) 0%, rgba(220,215,240,0.65) 28%, rgba(180,165,220,0.28) 62%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Layer 2 — Edge vignette (brand violet, darker at corners) */}
        {!highContrast && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(83,64,155,0.18) 72%, rgba(83,64,155,0.34) 100%)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Layer 3 — Watermark suppressor (tight, high-opacity centre ellipse) */}
        {!highContrast && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 48% 32% at 50% 52%, rgba(237,232,247,0.90) 0%, rgba(220,215,240,0.58) 50%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Top scrim — violet-tinted so the nav area matches the brand depth */}
        {!highContrast && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "120px",
              background: "linear-gradient(to bottom, rgba(220,215,240,0.75) 0%, rgba(220,215,240,0.30) 60%, rgba(220,215,240,0) 100%)",
              pointerEvents: "none",
            }}
          />
        )}


        {/* Bottom scrim — fades the poster's naturally-light bottom region
            into the hero background colour so no pale strip is visible.
            Graduated to solid #EDE8F7 (not transparent) for a clean edge. */}
        {!highContrast && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "100px",
              background: "linear-gradient(to top, #EDE8F7 0%, rgba(237,232,247,0) 100%)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* SVG ripple — reduced-motion only */}
        {reducedMotion && !highContrast && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
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
      </div>
      {/* ── End background container ───────────────────────────────────── */}

      {/* ── Header — outside overflow:hidden so dropdown renders freely ── */}
      <header
        className="relative px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{ zIndex: 20 }}
      >
        <div
          className="flex items-center gap-2 text-primary font-bold tracking-wide uppercase"
          style={{ fontSize: "1.125rem" }}
        >
          <svg width="26" height="26" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect x="6" y="8" width="38" height="26" rx="13" fill="#9B8FCB"/>
            <rect x="22" y="16" width="36" height="34" rx="14" fill="#53409B"/>
            <path d="M26 49L26 59L36 49Z" fill="#53409B"/>
          </svg>
          VIOWISE
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <Link href="/sign-in" className="px-3 sm:px-4 py-2 font-medium text-foreground hover:text-primary transition-colors">
            Sign in
          </Link>
          <AccessibilityControl />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col items-center justify-center min-h-[420px] sm:min-h-[540px]"
        style={{ zIndex: 10, position: "relative" }}
      >
        <div className="flex flex-col items-center text-center px-5 sm:px-8 py-10 sm:py-16 max-w-4xl mx-auto w-full">

          <span
            className="text-primary uppercase tracking-widest font-semibold mb-4 sm:mb-6 animate-hero-in"
            style={{ fontSize: "1rem", "--hero-delay": "0ms" } as React.CSSProperties}
          >
            CONNECTING GENERATIONS
          </span>

          <h1
            className="font-serif font-normal italic text-foreground mb-4 sm:mb-6 animate-hero-in leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw + 1rem, 3.5rem)", "--hero-delay": "100ms" } as React.CSSProperties}
          >
            Your experience is someone's answer.
          </h1>

          <p
            className="text-foreground/80 mb-8 sm:mb-12 max-w-2xl animate-hero-in"
            style={{ fontSize: "clamp(1rem, 1.5vw + 0.5rem, 1.25rem)", "--hero-delay": "220ms" } as React.CSSProperties}
          >
            Real conversations between generations, guided by AI, never replaced by it.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-2xl animate-hero-in"
            style={{ "--hero-delay": "350ms" } as React.CSSProperties}
          >
            {/* Primary — solid violet */}
            <Link
              href="/sign-up"
              className="btn-action flex-1 text-white text-[1.125rem] font-medium py-4 px-6 rounded-xl shadow-lg
                         hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] transition-all duration-150 text-center"
              style={{ backgroundColor: "#53409B" }}
            >
              I want to share my wisdom
            </Link>

            {/* Secondary — near-solid white, explicit violet text */}
            <Link
              href="/sign-up"
              className="btn-action flex-1 text-[1.125rem] font-medium py-4 px-6 rounded-xl shadow-lg
                         hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] transition-all duration-150 text-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                color: "#53409B",
                border: "1.5px solid rgba(83,64,155,0.25)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#53409B";
                (e.currentTarget as HTMLElement).style.color = "#ffffff";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.95)";
                (e.currentTarget as HTMLElement).style.color = "#53409B";
              }}
            >
              I want to learn from experience
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer / trust line ──────────────────────────────────────────── */}
      <footer
        className="py-5 text-center text-[0.95rem] flex items-center justify-center gap-2 w-full"
        style={{
          zIndex: 10,
          position: "relative",
          color: "var(--foreground)",
          textShadow: "0 1px 4px rgba(247,245,251,0.9), 0 0 12px rgba(247,245,251,0.7)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Every member is ID-verified. Calls are never recorded.
      </footer>
    </div>
  );
}
