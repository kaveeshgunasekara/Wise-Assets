import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useApp } from "@/hooks/use-app";
import { updateUser } from "@/services/api";
import { supabase } from "@/services/supabase";
import AccessibilityControl from "@/components/AccessibilityControl";

export const PENDING_PROFILE_KEY = "viowise_pending_profile";

type Status = "processing" | "applying" | "error_expired" | "error_generic";

interface PendingProfile {
  userId: string;
  email: string;
  topics: string[];
  languages: string[];
  age: number;
}

function readPending(): PendingProfile | null {
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingProfile;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const { user } = useApp();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<Status>("processing");
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);
  const applied = useRef(false);

  // Detect error params in the URL (fired by Supabase for expired/invalid links).
  // Supabase puts them in the hash fragment for implicit flow, or query string for PKCE.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const errorCode = search.get("error_code") ?? hash.get("error_code") ?? "";
    const errorDesc =
      search.get("error_description") ?? hash.get("error_description") ?? "";

    if (errorCode || errorDesc) {
      const isExpired =
        errorCode === "otp_expired" ||
        errorDesc.toLowerCase().includes("expired") ||
        errorDesc.toLowerCase().includes("invalid");

      const pending = readPending();
      if (pending?.email) setResendEmail(pending.email);

      setStatus(isExpired ? "error_expired" : "error_generic");
      return;
    }

    // No error — set a fallback timeout so we don't spin forever if something
    // goes wrong (e.g. the Supabase session exchange silently fails).
    const timer = setTimeout(() => {
      setStatus((s) => (s === "processing" ? "error_generic" : s));
    }, 15_000);
    return () => clearTimeout(timer);
  }, []);

  // Once the user is loaded in context (SIGNED_IN fired by onAuthStateChange),
  // apply any pending topics/languages stored before the email confirmation,
  // then send them to the wall.
  useEffect(() => {
    if (!user || status !== "processing" || applied.current) return;
    applied.current = true;

    const finish = async () => {
      setStatus("applying");
      const pending = readPending();

      if (pending && pending.userId === user.id) {
        try {
          if (pending.topics.length > 0 || pending.languages.length > 0) {
            await updateUser(user.id, {
              topics: pending.topics,
              languages: pending.languages,
              age: pending.age || user.age,
              availability: [],
              bio: "",
            });
          }
        } catch {
          // Non-fatal: profile row exists, topics just won't be saved yet.
        } finally {
          localStorage.removeItem(PENDING_PROFILE_KEY);
        }
      }

      setLocation("/wall");
    };

    finish();
  }, [user, status, setLocation]);

  const handleResend = async () => {
    if (!resendEmail || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: resendEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setResending(false);
    if (!error) setResendSent(true);
  };

  if (status === "processing" || status === "applying") {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-5" />
          <p className="text-[18px] text-foreground/70">
            {status === "applying"
              ? "Setting up your account…"
              : "Confirming your account…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </Link>
        <AccessibilityControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white p-8 rounded-[16px] card-shadow w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {status === "error_expired" ? (
            <>
              <h1 className="text-[28px] font-serif text-foreground mb-3 leading-tight">
                That link has expired
              </h1>
              <p className="text-[16px] text-foreground/70 mb-6">
                Confirmation links expire after 24 hours. We can send you a fresh one right now.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-serif text-foreground mb-3 leading-tight">
                Something went wrong
              </h1>
              <p className="text-[16px] text-foreground/70 mb-6">
                We couldn't confirm your account with that link. It may have already been used.
              </p>
            </>
          )}

          {resendSent ? (
            <p className="text-[15px] text-green-600 font-medium mb-6" role="status">
              A new confirmation email is on its way!
            </p>
          ) : resendEmail ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-primary text-white h-[52px] rounded-[12px] text-[17px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 mb-4"
            >
              {resending ? "Sending…" : "Send a new confirmation email"}
            </button>
          ) : null}

          <div className="border-t border-border pt-5 flex flex-col gap-3 text-[15px] text-foreground/60">
            <p>
              <Link href="/sign-up" className="text-primary font-medium hover:underline">
                Sign up with a new account
              </Link>
            </p>
            <p>
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
