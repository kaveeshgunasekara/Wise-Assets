import { Link } from "wouter";
import { useApp } from "@/hooks/use-app";

export default function Verified() {
  const { role } = useApp();
  const name = role === "mentor" ? "Grace" : role === "learner" ? "Sam" : "Grace";

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto pb-20">
        <p className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-8">Step 3 of 3</p>
        
        <div className="w-24 h-24 rounded-full bg-success/10 text-success flex items-center justify-center mb-8 mx-auto">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-[40px] font-serif text-foreground mb-4">You're verified, {name}.</h1>
        <p className="text-[20px] text-foreground/80 mb-12">Welcome to VIOWISE.</p>

        <Link href="/sign-in" className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors shadow-lg flex items-center justify-center">
          Sign in to your account
        </Link>
      </main>
    </div>
  );
}
