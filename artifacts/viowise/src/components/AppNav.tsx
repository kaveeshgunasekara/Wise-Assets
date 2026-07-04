import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import { useState } from "react";

export default function AppNav() {
  const { user, setUser, setRole, textSize, setTextSize, highContrast, setHighContrast } = useApp();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);

  const initial = user?.name ? user.name.charAt(0) : "G";

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/wall" className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/wall" className={`font-medium ${location === "/wall" ? "text-primary" : "text-foreground/70 hover:text-foreground"}`}>Wisdom Wall</Link>
          <Link href="/matching" className={`font-medium ${location === "/matching" ? "text-primary" : "text-foreground/70 hover:text-foreground"}`}>AI Matching</Link>
        </nav>
      </div>

      <div className="flex items-center gap-4 relative">
        <Link href="/help" className="font-medium text-foreground/70 hover:text-foreground hidden md:block">Help</Link>
        
        <div className="relative">
          <button 
            onClick={() => { setA11yOpen(!a11yOpen); setMenuOpen(false); }}
            className="px-4 py-2 bg-secondary text-primary rounded-xl font-medium flex items-center gap-2 min-h-[48px]"
            aria-expanded={a11yOpen}
            aria-label="Accessibility settings"
          >
            <span>Aa</span> <span className="hidden sm:inline">Accessibility</span>
          </button>
          
          {a11yOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-border shadow-lg rounded-xl p-4 z-50">
              <h3 className="font-semibold text-[16px] mb-3">Text size</h3>
              <div className="flex flex-col gap-2 mb-4">
                {["Standard", "Large", "Extra large"].map(size => (
                  <button
                    key={size}
                    onClick={() => setTextSize(size as any)}
                    className={`text-left px-3 py-2 rounded-lg border ${textSize === size ? 'border-primary text-primary bg-primary/5' : 'border-transparent hover:bg-secondary'}`}
                  >
                    {size} {textSize === size && "✓"}
                  </button>
                ))}
              </div>
              <h3 className="font-semibold text-[16px] mb-3">High contrast</h3>
              <button 
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full text-left px-3 py-2 rounded-lg border ${highContrast ? 'border-primary text-primary bg-primary/5' : 'border-border hover:bg-secondary'}`}
              >
                {highContrast ? "On ✓" : "Off"}
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => { setMenuOpen(!menuOpen); setA11yOpen(false); }}
            className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl border border-primary/20"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            {initial}
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border shadow-lg rounded-xl py-2 z-50">
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-3 hover:bg-secondary">Profile</Link>
              <button 
                onClick={() => {
                  setUser(null);
                  setRole(null);
                  setLocation("/");
                }} 
                className="w-full text-left px-4 py-3 hover:bg-secondary text-foreground"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
