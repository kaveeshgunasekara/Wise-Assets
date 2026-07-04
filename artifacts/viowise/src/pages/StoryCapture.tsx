import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import AppNav from "@/components/AppNav";

export default function StoryCapture() {
  const { role, setPendingStory } = useApp();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // The canonical quote for Grace
  const [quoteText, setQuoteText] = useState("It's never too late to begin again. I re-took my nursing exams at 38. It was hard, but it reminded me that courage grows with each small step.");
  
  const name = role === "mentor" ? "Grace" : "Sam";
  const partnerName = role === "mentor" ? "Sam" : "Grace";

  const handleShare = () => {
    // Save to context so it appears on Sam's wall as a pending approval if Grace shares it
    // Or if Sam is sharing, it goes to Grace. In our simplified demo, pendingStory triggers approval.
    setPendingStory({
      id: Math.random().toString(),
      author: "Grace",
      age: 72,
      credential: "Retired Nurse",
      topic: "Migration",
      title: "On starting over",
      quote: quoteText
    });
    setActionMessage("Request sent to Sam for approval.");
  };

  const handlePrivate = () => {
    setActionMessage("Saved to your private archive. Only you can see this.");
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-success/10 text-success rounded-full text-sm font-semibold border border-success/20 mb-6">
            Call ended · 34 minutes
          </span>
          <h1 className="text-[40px] font-serif text-foreground leading-tight">
            That was a wonderful conversation, {name}.
          </h1>
        </div>

        <div className="bg-[#F4F1FC] border border-[#C5BCDF] p-8 sm:p-12 rounded-[16px] card-shadow mb-10 relative">
          <div className="flex items-center gap-2 text-primary font-medium text-[14px] mb-8 border-b border-[#C5BCDF]/50 pb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Our AI wrote this summary from your conversation. Nothing has been saved yet.
          </div>
          
          <h2 className="text-[20px] font-semibold text-foreground mb-4">On starting over</h2>
          
          {editing ? (
            <textarea 
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              className="w-full p-4 rounded-xl border border-primary/30 bg-white font-serif italic text-[24px] leading-relaxed mb-6 outline-none focus:ring-2 focus:ring-primary/20 min-h-[160px]"
            />
          ) : (
            <p className="font-serif italic text-[24px] leading-relaxed text-foreground mb-8">
              "{quoteText}"
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="font-medium text-[16px] text-foreground/80">— Grace, 72</div>
            {editing && (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-2 border border-border bg-white rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Save</button>
              </div>
            )}
          </div>
        </div>

        {actionMessage ? (
          <div className={`p-6 rounded-[12px] text-center font-medium text-[18px] mb-8 border ${actionMessage.includes('approval') ? 'bg-primary/5 text-primary border-primary/20' : 'bg-success/5 text-success border-success/20'}`} aria-live="polite">
            {actionMessage}
            <div className="mt-4">
              <Link href="/wall" className="text-[16px] underline">Return to Wisdom Wall</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button onClick={() => setEditing(true)} className="flex-1 h-[56px] border-2 border-border bg-white text-foreground rounded-[12px] text-[18px] font-medium hover:bg-secondary transition-colors">
                Edit this summary
              </button>
              <button onClick={handlePrivate} className="flex-1 h-[56px] border-2 border-border bg-white text-foreground rounded-[12px] text-[18px] font-medium hover:bg-secondary transition-colors">
                Keep it private
              </button>
              <button onClick={handleShare} className="flex-1 h-[56px] bg-primary text-white rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors shadow-lg">
                Share to Wisdom Wall
              </button>
            </div>
            <p className="text-center text-[16px] text-foreground/60 mb-12">Sharing needs both of you.</p>
          </>
        )}

        <div className="flex flex-col items-center gap-6 pt-12 border-t border-border">
          <button className="text-primary font-medium text-[18px] hover:underline px-6 py-3 rounded-xl hover:bg-primary/5 transition">
            Schedule another call with {partnerName}
          </button>
          
          <button className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
            Report a problem with this call
          </button>
        </div>
      </main>
    </div>
  );
}
