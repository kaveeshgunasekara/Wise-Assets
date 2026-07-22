import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import AccessibilityControl from "@/components/AccessibilityControl";
import { supabase } from "@/services/supabase";
import { getUserById } from "@/services/api";

export default function SignIn() {
  const { setRole, setUser } = useApp();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError(null);
    setUnconfirmedEmail(null);
    setResendSent(false);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError || !data.user) {
      const msg = authError?.message ?? "";

      if (msg.toLowerCase().includes("email not confirmed")) {
        setUnconfirmedEmail(email.trim().toLowerCase());
        setError(
          "Please confirm your email before signing in. Check your inbox for the verification link.",
        );
      } else if (msg === "Invalid login credentials") {
        setError("We couldn't find an account with that email and password.");
      } else {
        setError(msg || "Sign-in failed. Please try again.");
      }

      setSigningIn(false);
      return;
    }

    const profile = await getUserById(data.user.id);
    if (!profile) {
      setError("We couldn't load your profile. Please try again in a moment.");
      await supabase.auth.signOut();
      setSigningIn(false);
      return;
    }

    setUser(profile);
    setRole(profile.role);
    setSigningIn(false);
    setLocation("/wall");
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail || resending) return;
    setResending(true);
    setResendSent(false);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setResending(false);
    if (!resendError) setResendSent(true);
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <img src="/viowise-logo-full.png" alt="VIOWISE" className="h-10 w-auto" />
        </Link>
        <AccessibilityControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white p-5 sm:p-8 rounded-[16px] card-shadow w-full max-w-md">
          <h1 className="text-[32px] sm:text-[40px] font-serif text-foreground mb-6 sm:mb-8 text-center leading-tight">
            Welcome back
          </h1>

          <form className="space-y-5" onSubmit={handleSignIn}>
            <div>
              <label className="block text-[16px] font-medium mb-2">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>

            {error && (
              <div className="rounded-[12px] bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-[15px] text-destructive" role="alert">{error}</p>
                {unconfirmedEmail && (
                  <div className="mt-3">
                    {resendSent ? (
                      <p className="text-[14px] text-green-700 font-medium" role="status">
                        Confirmation email sent — check your inbox.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resending}
                        className="text-[14px] font-medium text-primary hover:underline disabled:opacity-60"
                      >
                        {resending ? "Sending…" : "Resend confirmation email →"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={signingIn}
              className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors mt-2 disabled:opacity-60"
            >
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-[16px]">
            New here?{" "}
            <Link href="/sign-up" className="text-primary font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
