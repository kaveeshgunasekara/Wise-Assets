import { Link } from "wouter";
import { useApp } from "@/hooks/use-app";
import AccessibilityControl from "@/components/AccessibilityControl";

export default function Landing() {
  const { setRole } = useApp();

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
      {/* Image is a background layer; text sits on top via z-index */}
      <main className="flex-1 relative flex flex-col items-center justify-center min-h-[540px]">
        {/* Background image — dimmed to ~72% opacity so it reads as elegant
            backdrop rather than competing foreground imagery */}
        <div
          className="absolute inset-0 opacity-[0.72]"
          style={{
            backgroundImage: "url('/hero-connection.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
        />

        {/* Overlay — wide radial: near-opaque white at the text zone (center),
            fading gently so faces remain softly visible at the periphery.
            Also a subtle top-to-bottom fade to anchor the footer edge. */}
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

        {/* Content — sits above both layers; generous vertical padding so text
            is well clear of the portrait bubbles on all screen sizes */}
        <div className="relative z-10 flex flex-col items-center text-center px-8 py-20 max-w-4xl mx-auto w-full">
          <span className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-6">CONNECTING GENERATIONS</span>
          <h1 className="text-[56px] leading-tight font-serif font-normal italic text-foreground mb-6">
            Your experience is someone's answer.
          </h1>
          <p className="text-[20px] text-foreground/80 mb-12 max-w-2xl">
            Real conversations between generations, guided by AI — never replaced by it.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
            <Link
              href="/sign-up"
              onClick={() => setRole("mentor")}
              className="flex-1 bg-primary text-white text-[18px] font-medium py-4 px-6 rounded-xl hover:bg-primary-hover transition-colors shadow-lg"
            >
              I want to share my wisdom
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setRole("learner")}
              className="flex-1 bg-white text-primary text-[18px] font-medium py-4 px-6 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors shadow-lg"
            >
              I want to learn from experience
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer — inherits bg-pattern from outer div ─────────────────── */}
      <footer className="py-8 text-center text-foreground/60 text-[16px] flex items-center justify-center gap-2 z-10 relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Every member is ID-verified. Calls are never recorded.
      </footer>
    </div>
  );
}
