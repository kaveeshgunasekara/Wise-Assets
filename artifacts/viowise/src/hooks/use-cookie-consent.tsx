import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

const CONSENT_KEY = "vw:cookie-consent";
const CONSENT_VERSION = "1";

interface ConsentRecord {
  version: string;
  timestamp: number;
  analytics: boolean;
}

interface CookieConsentContextValue {
  bannerOpen: boolean;
  analyticsEnabled: boolean;
  acceptAll: () => void;
  essentialOnly: () => void;
  saveCustom: (analytics: boolean) => void;
  openBanner: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

function loadConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(loadConsent);
  const [bannerOpen, setBannerOpen] = useState<boolean>(() => loadConsent() === null);

  const save = useCallback((analytics: boolean) => {
    const record: ConsentRecord = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      analytics,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    setConsent(record);
    setBannerOpen(false);
  }, []);

  const acceptAll = useCallback(() => save(true), [save]);
  const essentialOnly = useCallback(() => save(false), [save]);
  const saveCustom = useCallback((analytics: boolean) => save(analytics), [save]);
  const openBanner = useCallback(() => setBannerOpen(true), []);

  return (
    <CookieConsentContext.Provider
      value={{
        bannerOpen,
        analyticsEnabled: consent?.analytics ?? false,
        acceptAll,
        essentialOnly,
        saveCustom,
        openBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  return ctx;
}
