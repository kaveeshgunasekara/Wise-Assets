import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function IdVerification() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaded) return;
    setVerifying(true);
    setTimeout(() => {
      setLocation("/verified");
    }, 1500);
  };

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

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white p-8 rounded-[16px] card-shadow w-full max-w-md">
          <p className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-2">Step 2 of 3</p>
          <h1 className="text-[40px] font-serif text-foreground mb-4 leading-tight">Verify your identity</h1>
          
          <p className="text-[18px] text-foreground/80 mb-8">
            Every member verifies with a government-issued ID. No verification, no account — that's how we keep everyone safe.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[16px] font-medium mb-2">ID Type</label>
              <select className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none bg-white">
                <option>Passport</option>
                <option>Driver licence</option>
                <option>National ID</option>
              </select>
            </div>

            <button 
              type="button" 
              onClick={() => setUploaded(true)}
              className={`w-full h-32 rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${uploaded ? 'border-success bg-success/5 text-success' : 'border-border hover:bg-secondary text-foreground/60'}`}
            >
              {uploaded ? (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-medium">ID received</span>
                </>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="font-medium">Click to upload ID</span>
                </>
              )}
            </button>

            <p className="text-[16px] text-foreground/70">
              Your ID is used only for verification and is never shown to other members.
            </p>

            <button 
              type="submit" 
              disabled={!uploaded || verifying}
              className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying…
                </>
              ) : "Submit for verification"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
