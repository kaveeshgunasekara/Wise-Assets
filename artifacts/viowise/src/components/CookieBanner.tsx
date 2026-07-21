import { useState, useEffect } from "react";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

export default function CookieBanner() {
  const { bannerOpen, acceptAll, essentialOnly } = useCookieConsent();

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!bannerOpen) { setVisible(false); return; }
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [bannerOpen]);

  if (!bannerOpen) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-[45]
        bg-[#EDE8F7] border-t-2 border-primary/20
        shadow-[0_-4px_24px_rgba(83,64,155,0.12)]
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      role="region"
      aria-label="Cookie consent"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">

        {/* Brand icon + message */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <svg
            width="20" height="20" viewBox="0 0 64 64" fill="none"
            aria-hidden="true" className="shrink-0 opacity-70"
          >
            <rect x="6" y="8" width="38" height="26" rx="13" fill="#9B8FCB"/>
            <rect x="22" y="16" width="36" height="34" rx="14" fill="#53409B"/>
            <path d="M26 49L26 59L36 49Z" fill="#53409B"/>
          </svg>
          <p className="text-[13px] leading-[1.5] text-primary/75 truncate sm:whitespace-normal sm:overflow-visible">
            We use cookies to keep VIOWISE working and to understand how it's used.
          </p>
        </div>

        {/* Matched button pair */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={essentialOnly}
            className="text-[13px] font-medium px-4 py-2 rounded-lg
              border border-primary/40 text-primary bg-transparent
              hover:bg-primary/10 active:scale-[0.97] transition-all
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
