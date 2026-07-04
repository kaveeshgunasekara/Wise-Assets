import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import { useState } from "react";
import AccessibilityControl from "@/components/AccessibilityControl";

export default function SignUp() {
  const { role } = useApp();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </Link>
        <AccessibilityControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white p-8 rounded-[16px] card-shadow w-full max-w-md">
          <p className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-2">Step 1 of 3</p>
          <h1 className="text-[40px] font-serif text-foreground mb-6 leading-tight">Create your account</h1>

          <div className="flex gap-4 mb-8">
            <div className={`flex-1 p-4 rounded-xl border-2 ${role === "mentor" ? "border-primary bg-primary/5" : "border-border opacity-50"}`}>
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-serif text-xl mb-3">M</div>
              <p className="font-medium">Mentor</p>
            </div>
            <div className={`flex-1 p-4 rounded-xl border-2 ${role === "learner" ? "border-primary bg-primary/5" : "border-border opacity-50"}`}>
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-serif text-xl mb-3">L</div>
              <p className="font-medium">Learner</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setLocation("/verify-id"); }}>
            <div>
              <label className="block text-[16px] font-medium mb-2">Full name</label>
              <input type="text" required className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue={role === "mentor" ? "Grace" : "Sam"} />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Email</label>
              <input type="email" required className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue={role === "mentor" ? "grace@example.com" : "sam@example.com"} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[16px] font-medium">Password</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-primary text-[16px] font-medium">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input type={showPassword ? "text" : "password"} required className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue="password123" />
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
