import { useState, useEffect } from "react";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        checked ? "bg-primary" : "bg-foreground/20"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
      <span className="sr-only">{checked ? "On" : "Off"}</span>
    </button>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-[20px] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2
              id="privacy-modal-title"
              className="text-xl font-semibold text-foreground"
            >
              Cookies &amp; Privacy
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/50 hover:bg-secondary transition-colors shrink-0"
              aria-label="Close privacy policy"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="space-y-4 text-[14px] text-foreground/75 leading-relaxed">
            <p>
              VIOWISE connects generations through conversation and shared wisdom. Here's what our
              cookies do and why.
            </p>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Strictly Necessary</h3>
              <p>
                Keep you signed in, protect your session, and enable core app features. These cannot
                be disabled.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Analytics</h3>
              <p>
                Anonymous usage data to help us understand what's working and improve VIOWISE. No
                personal data is shared externally. You can opt out at any time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your rights</h3>
              <p>
                Under GDPR you can access, correct, or delete your data, and update cookie
                preferences anytime via Cookie Settings in the app menu. Contact us at{" "}
                <a
                  href="mailto:privacy@viowise.com"
                  className="text-primary underline underline-offset-2 hover:opacity-75"
                >
                  privacy@viowise.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CookieBanner() {
  const { bannerOpen, acceptAll, essentialOnly, saveCustom } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Entrance: mount invisible then slide up — runs after the first paint
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!bannerOpen) { setVisible(false); return; }
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [bannerOpen]);

  if (!bannerOpen) return null;

  return (
    <>
      {/*
       * Bottom-LEFT card (VoiceNav lives bottom-RIGHT at z-50, so no conflict).
       * On mobile: inset-x-3 so it's a slim full-bleed card with side margins.
       * On sm+: fixed 380px wide, anchored to the left.
       */}
      <div
        className={`fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-4 sm:w-[380px] z-[45]
          bg-white rounded-2xl border border-border/60
          shadow-[0_8px_40px_rgba(83,64,155,0.13),0_2px_8px_rgba(0,0,0,0.06)]
          transition-all duration-300 ease-out
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        role="region"
        aria-label="Cookie consent"
      >
        <div className="p-4">
          {/* ── Message ──────────────────────────────────────────────── */}
          <p className="text-[13px] leading-[1.55] text-foreground/65 mb-3">
            We use cookies to keep VIOWISE working and to understand how it's used.{" "}
            <button
              onClick={() => setPrivacyOpen(true)}
              className="text-primary hover:underline underline-offset-2 transition-opacity focus-visible:outline-none"
            >
              Learn more
            </button>
          </p>

          {/* ── Expandable category rows ──────────────────────────────── */}
          {expanded && (
            <div className="mb-3 border-t border-border/50 pt-3 space-y-3">
              {/* Strictly Necessary */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-foreground">
                    Strictly Necessary
                  </span>
                  <span className="text-[11px] font-medium text-primary/70 tracking-wide">
                    Always on
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-foreground/50 leading-snug">
                  Auth, security, and core app function.
                </p>
              </div>

              {/* Analytics */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="analytics-toggle-c"
                    className="text-[12px] font-semibold text-foreground cursor-pointer"
                  >
                    Analytics
                  </label>
                  <Toggle
                    id="analytics-toggle-c"
                    checked={analyticsOn}
                    onChange={setAnalyticsOn}
                  />
                </div>
                <p className="mt-0.5 text-[12px] text-foreground/50 leading-snug">
                  Anonymous usage data to help us improve.
                </p>
              </div>

              {/* Save custom */}
              <div className="flex justify-end pt-0.5">
                <button
                  onClick={() => saveCustom(analyticsOn)}
                  className="text-[12px] font-medium text-white bg-primary hover:bg-primary/90
                    px-3 py-1.5 rounded-lg transition-colors active:scale-[0.97]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Save choices
                </button>
              </div>
            </div>
          )}

          {/* ── Action row ────────────────────────────────────────────── */}
          <div className="flex items-center gap-1.5">
            {/* Cookie details toggle */}
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="flex items-center gap-0.5 text-[12px] text-foreground/45
                hover:text-foreground/65 transition-colors
                focus-visible:outline-none rounded"
            >
              Cookie details
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Buttons pushed to the right */}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={essentialOnly}
                className="text-[13px] font-medium text-foreground/55 hover:text-foreground/80
                  px-2.5 py-1.5 rounded-lg hover:bg-secondary transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Essential only
              </button>
              <button
                onClick={acceptAll}
                className="text-[13px] font-medium text-white bg-primary hover:bg-primary/90
                  px-3 py-1.5 rounded-lg transition-colors active:scale-[0.97]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
