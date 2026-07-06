import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Role, User } from "@/types";

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  textSize: "Standard" | "Large" | "Extra large";
  setTextSize: (size: "Standard" | "Large" | "Extra large") => void;
  highContrast: boolean;
  setHighContrast: (high: boolean) => void;
  // Onboarding-in-progress selections: captured across the sign-up and
  // topic/language steps (before a real `user` object exists), then used
  // to create the real account at the end of onboarding. Cleared right
  // after that account is created.
  pendingName: string;
  setPendingName: (name: string) => void;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  pendingAge: string;
  setPendingAge: (age: string) => void;
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
  // The other participant in the active/most recent call, set when a call
  // request is accepted so Pre-call Consent, Video Call, and Story
  // Capture can look up the real partner instead of guessing from role.
  callPartnerId: string | null;
  setCallPartnerId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [textSize, setTextSize] = useState<"Standard" | "Large" | "Extra large">("Standard");
  const [highContrast, setHighContrast] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingAge, setPendingAge] = useState("");
  const [pendingTopics, setPendingTopics] = useState<string[]>([]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const [subtitlesConsent, setSubtitlesConsent] = useState(true);
  const [storyCaptureConsent, setStoryCaptureConsent] = useState(true);
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null);

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
        pendingName,
        setPendingName,
        pendingEmail,
        setPendingEmail,
        pendingAge,
        setPendingAge,
        pendingTopics,
        setPendingTopics,
        pendingLanguages,
        setPendingLanguages,
        subtitlesConsent,
        setSubtitlesConsent,
        storyCaptureConsent,
        setStoryCaptureConsent,
        callPartnerId,
        setCallPartnerId,
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
