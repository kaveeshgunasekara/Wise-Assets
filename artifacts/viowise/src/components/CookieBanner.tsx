import { useState } from "react";
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        checked ? "bg-primary" : "bg-foreground/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-[20px] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <h2
              id="privacy-modal-title"
              className="text-xl sm:text-2xl font-semibold text-foreground"
            >
              Cookies &amp; Privacy
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground/50 hover:bg-secondary transition-colors shrink-0"
              aria-label="Close privacy policy"
            >
              <svg
                width="16"
                height="16"
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

          <div className="space-y-4 text-sm sm:text-base text-foreground/75 leading-relaxed">
            <p>
              VIOWISE connects generations through conversation and shared wisdom. We use a small number of
              cookies to make that possible — here's exactly what they do.
            </p>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Strictly Necessary Cookies</h3>
              <p>
                These cookies keep you securely signed in, protect your session, and let the core features of
                VIOWISE work. Without them, the app cannot function. They are never used for advertising and
                cannot be turned off.
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-foreground/65">
                <li>Session management (keeping you signed in)</li>
                <li>Security tokens (protecting your account)</li>
                <li>Your accessibility preferences (text size, high contrast)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Analytics Cookies</h3>
              <p>
                If you allow analytics, we collect anonymous information about how VIOWISE is used — which
                features are helpful, where people get stuck — so we can keep improving the platform. We do
                not sell this data or share it with advertisers. You can change this at any time via Cookie
                Settings.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-1">Your rights</h3>
              <p>
                Under GDPR and similar laws, you have the right to know what data we hold about you, to ask
                us to delete it, and to change your cookie choices at any time. Use the Cookie Settings
                option in the app menu to update your choices, or contact us at{" "}
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

  if (!bannerOpen) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[45] bg-white border-t border-primary/15 shadow-[0_-4px_32px_rgba(83,64,155,0.12)]"
        role="region"
        aria-label="Cookie consent"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          {/* ── Main row ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <p className="flex-1 text-sm sm:text-base text-foreground/75 leading-snug">
              We use cookies to make VIOWISE work and to understand how it's used, so we can keep
              improving it for our community. You choose what's okay.{" "}
              <button
                onClick={() => setPrivacyOpen(true)}
                className="text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                Privacy policy
              </button>
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="flex items-center gap-1 text-sm text-foreground/55 hover:text-foreground/80 transition-colors underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
              >
                Cookie details
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <button
                onClick={essentialOnly}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-primary/30 text-primary hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Essential only
              </button>

              <button
                onClick={acceptAll}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Accept all
              </button>
            </div>
          </div>

          {/* ── Expandable details ────────────────────────────────────────── */}
          {expanded && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Strictly Necessary */}
              <div className="rounded-[14px] border border-border bg-[#F7F5FB] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Strictly Necessary</h3>
                  <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5 shrink-0 whitespace-nowrap">
                    Always active
                  </span>
                </div>
                <p className="text-sm text-foreground/60 leading-snug">
                  Required for authentication, security, and core app function. Cannot be disabled.
                </p>
              </div>

              {/* Analytics */}
              <div className="rounded-[14px] border border-border bg-[#F7F5FB] p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <label
                    htmlFor="analytics-toggle"
                    className="text-sm font-semibold text-foreground cursor-pointer"
                  >
                    Analytics
                  </label>
                  <Toggle
                    id="analytics-toggle"
                    checked={analyticsOn}
                    onChange={setAnalyticsOn}
                  />
                </div>
                <p className="text-sm text-foreground/60 leading-snug">
                  Helps us understand how VIOWISE is used so we can improve the experience. No
                  personal data is shared externally.
                </p>
              </div>

              {/* Save row */}
              <div className="sm:col-span-2 flex justify-end pt-1">
                <button
                  onClick={() => saveCustom(analyticsOn)}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Save my choices
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}
