import { useState, useEffect } from "react";
import { Link } from "wouter";
import AccessibilityControl from "@/components/AccessibilityControl";
import { supabase } from "@/services/supabase";

export const PENDING_PROFILE_KEY = "viowise_pending_profile";

export default function CheckEmail() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_PROFILE_KEY);
      if (raw) {
        const pending = JSON.parse(raw) as { email?: string };
        if (pending.email) setEmail(pending.email);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setSending(true);
    setError(null);
    setSent(false);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSending(false);
    if (resendError) {
      setError("Couldn't resend — please try again in a moment.");
    } else {
      setSent(true);
      setCooldown(60);
    }
  };

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
          <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h1 className="text-[32px] font-serif text-foreground mb-3 leading-tight">
            Check your inbox
          </h1>

          <p className="text-[17px] text-foreground/70 mb-1">
            We sent a confirmation link to
          </p>
          {email ? (
            <p className="text-[17px] font-semibold text-foreground mb-6 break-all">
              {email}
            </p>
          ) : (
            <p className="text-[17px] text-foreground/50 mb-6 italic">
              your email address
            </p>
          )}

          <p className="text-[15px] text-foreground/60 mb-8 leading-relaxed">
            Click the link in the email to activate your account and start using VIOWISE.
            <br />
            If you don't see it, check your spam or junk folder.
          </p>

          {sent && (
            <p className="text-[15px] text-green-600 font-medium mb-4" role="status">
              A new confirmation email has been sent.
            </p>
          )}

          {error && (
            <p className="text-[15px] text-destructive mb-4" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={sending || !email || cooldown > 0}
            className="w-full bg-primary text-white h-[52px] rounded-[12px] text-[17px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {sending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend confirmation email"}
          </button>

          <div className="border-t border-border pt-5 flex flex-col gap-3 text-[15px] text-foreground/60">
            <p>
              Used the wrong email?{" "}
              <Link href="/sign-up" className="text-primary font-medium hover:underline">
                Start over
              </Link>
            </p>
            <p>
              Already confirmed?{" "}
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
