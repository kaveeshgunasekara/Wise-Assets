import { useState, useEffect } from "react";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

export default function CookieBanner() {
  const { bannerOpen, acceptAll, essentialOnly } = useCookieConsent();

  // Slide up from bottom on first render
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!bannerOpen) { setVisible(false); return; }
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [bannerOpen]);

  if (!bannerOpen) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-[45] bg-white border-t border-black/[0.08]
        shadow-[0_-2px_16px_rgba(83,64,155,0.09)]
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      role="region"
      aria-label="Cookie consent"
    >
      {/* On mobile: stack message above buttons.
          On sm+: single row — message left, buttons right. */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">

        {/* Message */}
        <p className="text-[13px] leading-[1.5] text-foreground/60 flex-1">
          We use cookies to keep VIOWISE working and to understand how it's used.
        </p>

        {/* Matched button pair */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={essentialOnly}
            className="text-[13px] font-medium px-4 py-2 rounded-lg
              border border-primary/35 text-primary
              hover:bg-primary/5 active:scale-[0.97] transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Essential only
          </button>
          <button
            onClick={acceptAll}
            className="text-[13px] font-medium px-4 py-2 rounded-lg
              bg-primary text-white
              hover:bg-primary/90 active:scale-[0.97] transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
