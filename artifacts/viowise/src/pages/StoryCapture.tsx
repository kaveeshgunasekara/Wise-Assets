import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import AppNav from "@/components/AppNav";
import { createPost, getUserById, getStorySummary } from "@/services/api";
import type { User } from "@/types";

export default function StoryCapture() {
  const { user, callPartnerId } = useApp();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState(false);
  const [reportModal, setReportModal] = useState<number>(0);
  const [reportReason, setReportReason] = useState("");
  const [partner, setPartner] = useState<User | undefined>(undefined);

  const [quoteText, setQuoteText] = useState("");
  const [originalQuoteText, setOriginalQuoteText] = useState("");

  useEffect(() => {
    (async () => {
      const summary = await getStorySummary({ userId: user?.id });
      setQuoteText(summary);
      setOriginalQuoteText(summary);
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!callPartnerId) return;
    (async () => {
      const found = await getUserById(callPartnerId);
      setPartner(found);
    })();
  }, [callPartnerId]);

  const partnerName = partner?.name ?? "your match";

  const reportReasons = [
    "Made me uncomfortable",
    "Inappropriate behavior or language",
    "Asked for money or personal details",
    "Not who they said they were",
    "I felt pressured to share my story",
    "Something else",
  ];

  const handleShare = async () => {
    if (!user) return;
    // Creates a call_summary post pending the other participant's approval.
    // It shows up on their Wisdom Wall as an Approve/Decline card.
    await createPost({
      authorId: user.id,
      type: "call_summary",
      topic: user.topics[0] ?? "Career",
      quote: quoteText,
      source: "call",
      status: "pending_approval",
    });
    setActionMessage(`Request sent to ${partnerName} for approval.`);
  };

  const handlePrivate = () => {
    setActionMessage("Saved to your private archive. Only you can see this.");
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-2 bg-success/10 text-success rounded-full text-base font-semibold border border-success/20 mb-6">
            Call ended
          </span>
          <h1 className="text-[40px] font-serif text-foreground leading-tight">
            That was a wonderful conversation{user?.name ? `, ${user.name}` : ""}.
          </h1>
        </div>

        <div className="bg-[#F4F1FC] border border-[#C5BCDF] p-8 sm:p-12 rounded-[16px] card-shadow mb-10 relative">
          <div className="flex items-center gap-2 text-primary font-medium text-base mb-8 border-b border-[#C5BCDF]/50 pb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Our AI wrote this summary from your conversation. Nothing has been saved yet.
          </div>
          
          <h2 className="text-[20px] font-semibold text-foreground mb-4">Reflections from your call</h2>
          
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
            <div className="font-medium text-[16px] text-foreground/80">— {user?.name ?? "You"}{user?.age ? `, ${user.age}` : ""}</div>
            {editing && (
              <div className="flex gap-2">
                <button onClick={() => { setQuoteText(originalQuoteText); setEditing(false); }} className="px-4 py-2 border border-border bg-white rounded-lg text-base font-medium">Cancel</button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 bg-primary text-white rounded-lg text-base font-medium">Save</button>
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
          {scheduleMessage ? (
            <p className="text-success font-medium text-[18px] flex items-center gap-2" aria-live="polite">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Request sent — we'll confirm a time.
            </p>
          ) : (
            <button onClick={() => setScheduleMessage(true)} className="text-primary font-medium text-[18px] hover:underline px-6 py-3 rounded-xl hover:bg-primary/5 transition">
              Schedule another call with {partnerName}
            </button>
          )}

          <button onClick={() => setReportModal(1)} className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition text-base">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
            Report a problem with this call
          </button>
        </div>
      </main>

      {reportModal > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] card-shadow max-w-md w-full p-8">
            {reportModal === 1 ? (
              <>
                <h2 className="text-[24px] font-semibold mb-6">Report a problem</h2>
                <div className="space-y-3 mb-6">
                  {reportReasons.map((reason) => (
                    <label key={reason} className="flex items-center gap-3 cursor-pointer text-[16px]">
                      <input
                        type="radio"
                        name="storyReportReason"
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="w-5 h-5 accent-primary"
                      />
                      {reason}
                    </label>
                  ))}
                  {reportReason === "Something else" && (
                    <textarea className="w-full mt-2 p-3 border border-border rounded-lg text-base" placeholder="Please describe..." rows={3}></textarea>
                  )}
                </div>
                <p className="text-foreground/60 text-base mb-6">{partnerName} won't be notified.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setReportModal(0); setReportReason(""); }} className="px-4 py-2 font-medium">Cancel</button>
                  <button onClick={() => setReportModal(2)} disabled={!reportReason} className="px-6 py-2 bg-[#DC2626] text-white rounded-lg font-medium disabled:opacity-50">Submit report</button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 className="text-[24px] font-semibold mb-4">Your report has been received.</h2>
                <p className="text-[16px] text-foreground/70 mb-8">Reviewed within 24 hours. You won't be matched with this person again.</p>
                <button onClick={() => { setReportModal(0); setReportReason(""); }} className="w-full px-6 py-3 border border-border rounded-lg font-medium">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
