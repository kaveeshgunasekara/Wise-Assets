import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Role, User } from "@/types";
import { getUserById } from "@/services/api";

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  textSize: "Standard" | "Large" | "Extra large";
  setTextSize: (size: "Standard" | "Large" | "Extra large") => void;
  highContrast: boolean;
  setHighContrast: (high: boolean) => void;
  // Onboarding-in-progress selections: captured on the topic/language step
  // (before a real `user` object exists) and merged into the user record
  // once they sign in. Cleared right after that merge.
  pendingTopics: string[];
  setPendingTopics: (topics: string[]) => void;
  pendingLanguages: string[];
  setPendingLanguages: (languages: string[]) => void;
  // Pre-call consent choices, set on the Pre-call Consent screen and read
  // by VideoCall — a single source of truth so the call actually reflects
  // what the person agreed to, instead of VideoCall re-deciding on its own.
  subtitlesConsent: boolean;
  setSubtitlesConsent: (on: boolean) => void;
  storyCaptureConsent: boolean;
  setStoryCaptureConsent: (on: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [textSize, setTextSize] = useState<"Standard" | "Large" | "Extra large">("Standard");
  const [highContrast, setHighContrast] = useState(false);
  const [pendingTopics, setPendingTopics] = useState<string[]>([]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const [subtitlesConsent, setSubtitlesConsent] = useState(true);
  const [storyCaptureConsent, setStoryCaptureConsent] = useState(true);

  useEffect(() => {
    let multiplier = 1;
    if (textSize === "Large") multiplier = 1.15;
    if (textSize === "Extra large") multiplier = 1.3;
    document.documentElement.style.setProperty("--text-size-multiplier", multiplier.toString());
  }, [textSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  // This demo has no real auth/persistence: landing directly on an
  // authenticated page (e.g. a bookmark or a fresh dev-server reload) would
  // otherwise leave `user`/`role` null, silently breaking any action that
  // needs a real user id (requests, matches). Seed a default learner
  // identity (Sam) once on first mount so the app is always in a coherent
  // "signed in as someone" demo state; real sign-up/sign-in still
  // overwrites this immediately once the user goes through that flow.
  useEffect(() => {
    (async () => {
      const defaultUser = await getUserById("sam");
      setUser((current) => current ?? defaultUser ?? null);
      setRole((current) => current ?? "learner");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        user,
        setUser,
        textSize,
        setTextSize,
        highContrast,
        setHighContrast,
        pendingTopics,
        setPendingTopics,
        pendingLanguages,
        setPendingLanguages,
        subtitlesConsent,
        setSubtitlesConsent,
        storyCaptureConsent,
        setStoryCaptureConsent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within a AppProvider");
  return context;
}
