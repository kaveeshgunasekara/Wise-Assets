import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import AccessibilityControl from "@/components/AccessibilityControl";

export default function SignIn() {
  const { role, setRole, setUser } = useApp();
  const [, setLocation] = useLocation();

  // Preserve whichever role was chosen during sign-up; only default to
  // learner/Sam if the visitor arrived directly at Sign in with no prior role.
  const activeRole = role ?? "learner";

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole === "mentor") {
      setRole("mentor");
      setUser({
        name: "Grace",
        age: 72,
        topics: ["Career", "Migration", "Resilience"]
      });
    } else {
      setRole("learner");
      setUser({
        name: "Sam",
        age: 21,
        topics: ["Career", "Study"]
      });
    }
    setLocation("/wall");
  };

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
          <h1 className="text-[40px] font-serif text-foreground mb-8 text-center leading-tight">Welcome back</h1>

          <form className="space-y-5" onSubmit={handleSignIn}>
            <div>
              <label className="block text-[16px] font-medium mb-2">Email</label>
              <input type="email" required className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue={activeRole === "mentor" ? "grace@example.com" : "sam@example.com"} />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Password</label>
              <input type="password" required className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue="password123" />
            </div>

            <button type="submit" className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors mt-2">
              Sign in
            </button>
          </form>

          <p className="mt-8 text-center text-[16px]">
            New here? <Link href="/sign-up" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
