import AppNav from "@/components/AppNav";
import { useLocation } from "wouter";

export default function Help() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-primary font-medium mb-8 hover:underline">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>

        <h1 className="text-[40px] font-serif text-foreground mb-12">How VIOWISE works</h1>

        <div className="bg-white p-8 rounded-[16px] card-shadow space-y-8 mb-12">
          
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            </div>
            <div>
              <h2 className="text-[20px] font-semibold mb-2">Get matched</h2>
              <p className="text-[18px] text-foreground/80">Our AI explains every match based on shared life experiences and topics you select. You choose who you connect with.</p>
            </div>
          </div>

          <div className="h-px bg-border w-full" />

          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
            <div>
              <h2 className="text-[20px] font-semibold mb-2">Talk</h2>
              <p className="text-[18px] text-foreground/80">Live translated subtitles help you understand each other effortlessly. Conversations are never recorded, keeping your space private and safe.</p>
            </div>
          </div>

          <div className="h-px bg-border w-full" />

          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div>
              <h2 className="text-[20px] font-semibold mb-2">Share wisdom</h2>
              <p className="text-[18px] text-foreground/80">AI summarizes the best moments from your talk into a quote. It is only shared to the Wisdom Wall if both people consent.</p>
            </div>
          </div>

        </div>

        <div className="text-center bg-secondary p-8 rounded-[16px]">
          <h3 className="font-semibold text-[18px] mb-2">Still need help?</h3>
          <p className="text-[16px] text-foreground/70 mb-4">Contact our support team directly.</p>
          <a href="mailto:hello@viowise.example" className="text-primary font-medium text-[18px] hover:underline">hello@viowise.example</a>
        </div>
      </main>
    </div>
  );
}
