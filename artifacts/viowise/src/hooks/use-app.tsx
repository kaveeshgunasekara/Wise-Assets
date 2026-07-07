import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { Role, User } from "@/types";
import { supabase } from "@/services/supabase";
import { getUserById } from "@/services/api";

interface AppContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  // True only during the initial session-restoration check on page load/refresh.
  // RequireAuth uses this to avoid a flash-redirect to sign-in while we wait
  // for getSession to resolve. After the first auth-state event fires, it
  // becomes false permanently (per-session — not reset on sign-in/sign-out).
  authLoading: boolean;
  textSize: "Standard" | "Large" | "Extra large";
  setTextSize: (size: "Standard" | "Large" | "Extra large") => void;
  highContrast: boolean;
  setHighContrast: (high: boolean) => void;
  // Onboarding-in-progress selections — captured across the sign-up and
  // topic/language steps (before a real account exists), then cleared once
  // supabase.auth.signUp is called at the end of onboarding.
  pendingName: string;
  setPendingName: (name: string) => void;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  pendingAge: string;
  setPendingAge: (age: string) => void;
  // Password is held in-memory only for the brief window between the sign-up
  // form (Step 1) and the auth.signUp call (Step 3). Cleared immediately after.
  pendingPassword: string;
  setPendingPassword: (pw: string) => void;
  pendingTopics: string[];
  setPendingTopics: (topics: string[]) => void;
  pendingLanguages: string[];
  setPendingLanguages: (languages: string[]) => void;
  // Pre-call consent choices, read by VideoCall to decide on subtitles and
  // whether to route to story-capture after the call ends.
  subtitlesConsent: boolean;
  setSubtitlesConsent: (on: boolean) => void;
  storyCaptureConsent: boolean;
  setStoryCaptureConsent: (on: boolean) => void;
  // The other participant in the active call.
  callPartnerId: string | null;
  setCallPartnerId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [textSize, setTextSize] = useState<"Standard" | "Large" | "Extra large">("Standard");
  const [highContrast, setHighContrast] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingAge, setPendingAge] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingTopics, setPendingTopics] = useState<string[]>([]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const [subtitlesConsent, setSubtitlesConsent] = useState(true);
  const [storyCaptureConsent, setStoryCaptureConsent] = useState(true);
  const [callPartnerId, setCallPartnerId] = useState<string | null>(null);

  // Load the users-table profile for a given auth UID and set it in context.
  // Retries once after 1 s in case the handle_new_user trigger hasn't committed
  // yet (rare but possible). If the profile is still missing after the retry,
  // logs a clear error and signs the user out so they're never left in a broken
  // null-user state with a live session.
  const loadProfile = useCallback(async (userId: string) => {
    let profile = await getUserById(userId);

    if (!profile) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      profile = await getUserById(userId);
    }

    if (profile) {
      setUser(profile);
      setRole(profile.role);
    } else {
      console.error(
        `[auth] No users-table row found for auth UID ${userId} after retry. ` +
        "Check that the handle_new_user trigger is installed and firing correctly. " +
        "Signing the user out to avoid a broken null-user session.",
      );
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
    }
  }, []);

  // Subscribe to Supabase auth state. The INITIAL_SESSION event fires
  // immediately on mount and gives us the current session (or null), so we
  // don't need a separate getSession() call.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Load the users-table profile (created by the handle_new_user trigger
          // on sign-up, or pre-existing for returning users).
          await loadProfile(session.user.id);
        } else {
          // SIGNED_OUT or no session at all.
          setUser(null);
          setRole(null);
        }
        // After the first event (INITIAL_SESSION) resolves, we know whether
        // there's a live session, so we can unlock auth-guarded routes.
        if (event === "INITIAL_SESSION") {
          setAuthLoading(false);
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [loadProfile]);

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
        authLoading,
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
        pendingPassword,
        setPendingPassword,
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
