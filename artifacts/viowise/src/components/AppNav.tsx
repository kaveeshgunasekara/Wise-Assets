import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import { useState, useEffect } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";
import { supabase } from "@/services/supabase";
import AvatarImage from "@/components/AvatarImage";

export default function AppNav() {
  const { user, setUser, setRole } = useApp();
  const [location, setLocation] = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show a shadow once the user has scrolled past the header so it's clear
  // the bar is sticky and content is sliding beneath it.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // check on mount (page might already be scrolled)
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setLocation("/");
  };

  const closeMobile = () => setMobileMenuOpen(false);

  const navLinkClass = (path: string) =>
    `font-medium ${location === path ? "text-primary" : "text-foreground/70 hover:text-foreground"}`;

  return (
    <header className={`bg-white border-b border-border sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-[0_2px_12px_rgba(83,64,155,0.10)]" : ""}`}>
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6">
          <Link
            href="/wall"
            className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base shrink-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            VIOWISE
          </Link>

          {/* ── Desktop nav tabs ──────────────────────────────────────── */}
          <nav className="hidden md:flex gap-6">
            <Link href="/wall" className={navLinkClass("/wall")}>Wisdom Wall</Link>
            <Link href="/matching" className={navLinkClass("/matching")}>AI Matching</Link>
          </nav>
        </div>

        {/* ── Right-side controls ───────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Help — desktop only */}
          <Link href="/help" className="font-medium text-foreground/70 hover:text-foreground hidden md:block">
            Help
          </Link>

          <AccessibilityControl />

          {/* Profile avatar — desktop only (mobile uses hamburger menu) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-expanded={profileMenuOpen}
              aria-label="User menu"
            >
              <AvatarImage user={user} className="w-10 h-10 text-lg" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border shadow-lg rounded-xl py-2 z-50">
                <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="block px-4 py-3 hover:bg-secondary">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 hover:bg-secondary text-foreground"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* ── Hamburger — mobile only ──────────────────────────────── */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-foreground/70 hover:bg-secondary transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          {/* Nav links */}
          <nav className="px-4 py-2">
            <Link
              href="/wall"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[17px] font-medium transition-colors ${location === "/wall" ? "text-primary bg-primary/5" : "text-foreground/80 hover:bg-secondary"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Wisdom Wall
            </Link>
            <Link
              href="/matching"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[17px] font-medium transition-colors ${location === "/matching" ? "text-primary bg-primary/5" : "text-foreground/80 hover:bg-secondary"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              AI Matching
            </Link>
            <Link
              href="/help"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-[17px] font-medium transition-colors ${location === "/help" ? "text-primary bg-primary/5" : "text-foreground/80 hover:bg-secondary"}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Help
            </Link>
          </nav>

          {/* Profile section */}
          <div className="px-4 py-2 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <AvatarImage user={user} className="w-9 h-9 text-base shrink-0" />
              <span className="font-medium text-foreground text-[15px] truncate">{user?.name ?? "Account"}</span>
            </div>
            <Link
              href="/profile"
              onClick={closeMobile}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-[17px] font-medium text-foreground/80 hover:bg-secondary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[17px] font-medium text-foreground/80 hover:bg-secondary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
