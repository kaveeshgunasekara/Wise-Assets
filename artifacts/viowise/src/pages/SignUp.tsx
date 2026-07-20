import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import { useEffect, useState } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";
import { AGE_ROLE_EXPLANATION, isAgeRoleConsistent, MENTOR_MIN_AGE, roleForAge } from "@/lib/age-role";

export default function SignUp() {
  const {
    role, setRole,
    pendingName, setPendingName,
    pendingEmail, setPendingEmail,
    pendingAge, setPendingAge,
    pendingPassword, setPendingPassword,
  } = useApp();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [roleError, setRoleError] = useState(false);

  // Role is derived from age, never chosen directly — this is the only place
  // `role` is set for a fresh sign-up, so it can never drift out of sync with
  // age. Runs on every render where pendingAge changes, including if the user
  // navigates back to this step and edits their age again.
  const ageNumber = Number(pendingAge);
  const derivedRole = roleForAge(ageNumber);
  useEffect(() => {
    setRole(derivedRole);
  }, [derivedRole, setRole]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!derivedRole || !isAgeRoleConsistent(ageNumber, role)) {
      setRoleError(true);
      return;
    }
    setRoleError(false);
    setLocation("/verify-id");
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect x="6" y="8" width="38" height="26" rx="13" fill="#9B8FCB"/>
            <rect x="22" y="16" width="36" height="34" rx="14" fill="#53409B"/>
            <path d="M26 49L26 59L36 49Z" fill="#53409B"/>
          </svg>
          VIOWISE
        </Link>
        <AccessibilityControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white p-5 sm:p-8 rounded-[16px] card-shadow w-full max-w-md">
          <p className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-2">Step 1 of 4</p>
          <h1 className="text-[32px] sm:text-[40px] font-serif text-foreground mb-5 sm:mb-6 leading-tight">Create your account</h1>

          <p className="text-[16px] text-foreground/70 mb-6 leading-relaxed">{AGE_ROLE_EXPLANATION}</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[16px] font-medium mb-2">Full name</label>
              <input
                type="text"
                autoComplete="name"
                required
                value={pendingName}
                onChange={(e) => setPendingName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Age</label>
              <input
                type="number"
                required
                min={13}
                max={120}
                value={pendingAge}
                onChange={(e) => { setPendingAge(e.target.value); setRoleError(false); }}
                placeholder="Your age"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
              {derivedRole && (
                <p className="mt-3 flex items-center gap-3 text-[16px]" aria-live="polite">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-serif text-sm ${derivedRole === "mentor" ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"}`}
                    aria-hidden="true"
                  >
                    {derivedRole === "mentor" ? "M" : "L"}
                  </span>
                  <span className="text-foreground/80">
                    You'll join as a{" "}
                    <span className="font-medium text-foreground">
                      {derivedRole === "mentor" ? "Mentor" : "Learner"}
                    </span>
                    {derivedRole === "mentor"
                      ? " — sharing your wisdom with those who seek it."
                      : " — learning from those who've lived it."}
                  </span>
                </p>
              )}
              {roleError && (
                <p className="mt-3 text-[16px] text-destructive" role="alert">
                  {pendingAge
                    ? `Please double-check your age — mentors are ${MENTOR_MIN_AGE}+ and learners are under ${MENTOR_MIN_AGE}.`
                    : "Please enter your age so we know whether you'll join as a mentor or learner."}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={pendingEmail}
                onChange={(e) => setPendingEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[16px] font-medium">Password</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-primary text-[16px] font-medium">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                value={pendingPassword}
                onChange={(e) => setPendingPassword(e.target.value)}
                placeholder="Choose a password"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>

            <p className="text-[16px] text-foreground/70 py-2">
              A government-issued ID is required to join.
            </p>

            <button type="submit" className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors">
              Continue to verification
            </button>
          </form>

          <p className="mt-6 text-center text-[16px]">
            Already a member? <Link href="/sign-in" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
