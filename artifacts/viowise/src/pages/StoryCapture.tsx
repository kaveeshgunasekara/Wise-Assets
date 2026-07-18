import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useApp } from "@/hooks/use-app";
import AppNav from "@/components/AppNav";
import TopicPicker from "@/components/TopicPicker";
import {
  consentToShare,
  declinePost,
  editPost,
  getLatestPendingCallSummaryPost,
  getMyCallSummaryPost,
  getMyCallSummaryPostByTime,
  getPostById,
  getUserById,
  reportUser,
} from "@/services/api";
import type { Post, User } from "@/types";

// sessionStorage keys written by VideoCall before navigation
const SESSION_ID_KEY = "viowise_call_session_id";   // ender only — arrives ~2-4s after nav
const CALL_ENDED_AT_KEY = "viowise_call_ended_at";  // both paths — written at nav time

type ShareState =
  | "idle"      // user hasn't decided yet
  | "waiting"   // user shared — waiting for partner
  | "published" // both consented — live on Wisdom Wall
  | "private";  // user kept it private

export default function StoryCapture() {
  const { user, callPartnerId } = useApp();

  // ── Post (fetched from DB, created by the Edge Function) ─────────────────
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [quoteText, setQuoteText] = useState("");
  const [originalQuoteText, setOriginalQuoteText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Two-phase polling strategy:
  //
  // Phase 1 — find the callSessionId (max ~10 s):
  //   ENDER path:  callSessionId written to sessionStorage by the Edge Function
  //                Promise .then() callback ~2-4 s after navigation. Poll every
  //                500 ms until it arrives, then switch to Phase 2a.
  //   PARTNER path: callSessionId never arrives. After 10 s give up and fall
  //                back to Phase 2b (timestamp-based query).
  //
  // Phase 2a — exact query: getMyCallSummaryPost(userId, callSessionId)
  //   One unambiguous row: author_id + call_session_id. No stale-post risk.
  //
  // Phase 2b — timestamp query: getMyCallSummaryPostByTime(userId, callEndedAt)
  //   Searches within a tight 2-minute window of when the call ended.
  //   Used by the partner who never receives callSessionId.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    // ── Diagnostic: dump sessionStorage state on mount ──────────────────────
    console.log("[StoryCapture] mount — sessionStorage:", {
      [SESSION_ID_KEY]: sessionStorage.getItem(SESSION_ID_KEY),
      [CALL_ENDED_AT_KEY]: sessionStorage.getItem(CALL_ENDED_AT_KEY),
      userId: user.id,
    });

    // ── Phase 1: wait for callSessionId ─────────────────────────────────────
    let sessionWaitMs = 0;
    const SESSION_WAIT_LIMIT_MS = 10_000;
    const SESSION_POLL_INTERVAL_MS = 500;

    // ── Phase 2: poll for the post once we have a query strategy ────────────
    let postAttempts = 0;
    const MAX_POST_ATTEMPTS = 20; // 20 × 2 s = 40 s
    const POST_POLL_INTERVAL_MS = 2000;

    const applyPost = (found: Post) => {
      console.log("[StoryCapture] ✅ post found:", { id: found.id, status: found.status, authorConsented: found.authorConsented, callSessionId: found.callSessionId });
      setPost(found);
      setQuoteText(found.quote);
      setOriginalQuoteText(found.quote);
      setSelectedTopic(found.topic);
      setLoadingPost(false);
      if (found.status === "published") setShareState("published");
      else if (found.authorConsented) setShareState("waiting");
    };

    const pollForPost = async (
      queryFn: () => Promise<Post | null>,
    ) => {
      if (cancelled) return;
      console.log(`[StoryCapture] poll attempt #${postAttempts + 1}/${MAX_POST_ATTEMPTS}`);
      try {
        const found = await queryFn();
        if (cancelled) return;
        if (found) { applyPost(found); return; }
        console.log(`[StoryCapture] attempt #${postAttempts + 1} — post not ready yet`);
      } catch (err) {
        console.error(`[StoryCapture] attempt #${postAttempts + 1} — query threw:`, err);
        if (cancelled) return;
      }
      if (postAttempts < MAX_POST_ATTEMPTS) {
        postAttempts++;
        timer = setTimeout(() => pollForPost(queryFn), POST_POLL_INTERVAL_MS);
      } else {
        // Exhausted all timed attempts. Try one last-resort query that doesn't
        // depend on callSessionId or a timestamp window — just the most recent
        // pending_approval call_summary for this user. Catches the case where
        // the Edge Function returned callSessionId=null (call_sessions insert
        // failed) so the posts exist but have call_session_id=null.
        console.warn("[StoryCapture] ❌ gave up after", MAX_POST_ATTEMPTS, "attempts — trying last-resort query");
        try {
          const lastResort = await getLatestPendingCallSummaryPost(user.id);
          if (!cancelled && lastResort) {
            console.log("[StoryCapture] ✅ last-resort query found post:", lastResort.id);
            applyPost(lastResort);
            return;
          }
        } catch (err) {
          console.error("[StoryCapture] last-resort query threw:", err);
        }
        console.warn("[StoryCapture] ❌ last-resort also found nothing — showing 'still being prepared'");
        if (!cancelled) setLoadingPost(false);
      }
    };

    const startPostPolling = () => {
      const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
      const callEndedAtStr = sessionStorage.getItem(CALL_ENDED_AT_KEY);

      if (sessionId) {
        // Exact query — ender path
        console.log("[StoryCapture] Phase 2a — exact query, callSessionId:", sessionId);
        pollForPost(() => getMyCallSummaryPost(user.id, sessionId));
      } else if (callEndedAtStr) {
        // Timestamp fallback — partner path
        const callEndedAt = parseInt(callEndedAtStr, 10);
        console.log("[StoryCapture] Phase 2b — timestamp fallback, callEndedAt:", new Date(callEndedAt).toISOString());
        pollForPost(() => getMyCallSummaryPostByTime(user.id, callEndedAt));
      } else {
        // No navigation context at all (e.g. direct URL visit)
        console.warn("[StoryCapture] ⚠️ no callSessionId or callEndedAt in sessionStorage — cannot query posts");
        setLoadingPost(false);
      }
    };

    const waitForSessionId = () => {
      if (cancelled) return;
      if (sessionStorage.getItem(SESSION_ID_KEY)) {
        // callSessionId arrived — switch to exact query
        console.log("[StoryCapture] Phase 1 ✅ callSessionId arrived after", sessionWaitMs, "ms");
        startPostPolling();
        return;
      }
      sessionWaitMs += SESSION_POLL_INTERVAL_MS;
      if (sessionWaitMs < SESSION_WAIT_LIMIT_MS) {
        timer = setTimeout(waitForSessionId, SESSION_POLL_INTERVAL_MS);
      } else {
        // 10 s elapsed, no callSessionId — use timestamp fallback
        console.log("[StoryCapture] Phase 1 ⏱ 10 s elapsed, no callSessionId — falling back to timestamp");
        startPostPolling();
      }
    };

    waitForSessionId();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user?.id]);

  // ── Partner info ──────────────────────────────────────────────────────────
  const [partner, setPartner] = useState<User | undefined>(undefined);
  useEffect(() => {
    if (!callPartnerId) return;
    getUserById(callPartnerId).then(setPartner).catch(() => {});
  }, [callPartnerId]);
  const partnerName = partner?.name ?? "your match";

  // ── Share state machine ───────────────────────────────────────────────────
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [editing, setEditing] = useState(false);
  const [working, setWorking] = useState(false);

  // After user consents, poll their own post by ID until the DB trigger promotes it.
  useEffect(() => {
    if (shareState !== "waiting" || !post) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      try {
        const latest = await getPostById(post.id);
        if (cancelled) return;
        if (latest?.status === "published") {
          setShareState("published");
          return;
        }
      } catch {
        if (cancelled) return;
      }
      timer = setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [shareState, post]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!user || !post || working) return;
    setWorking(true);
    try {
      const updates: { quote?: string; topic?: string } = {};
      if (quoteText !== originalQuoteText) updates.quote = quoteText;
      if (selectedTopic && selectedTopic !== post.topic) updates.topic = selectedTopic;
      if (Object.keys(updates).length > 0) await editPost(post.id, updates);
      await consentToShare(post.id);
      setShareState("waiting");
    } catch {
      // leave in idle so user can retry
    } finally {
      setWorking(false);
    }
  };

  const handlePrivate = async () => {
    if (working) return;
    setWorking(true);
    if (post) {
      try { await declinePost(post.id); } catch { /* non-fatal */ }
    }
    setWorking(false);
    setShareState("private");
  };

  // ── Refresh button (shown when poll gives up without finding a post) ──────
  const handleRefresh = () => {
    if (!user?.id) return;
    setLoadingPost(true);
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    const callEndedAtStr = sessionStorage.getItem(CALL_ENDED_AT_KEY);
    const fetchFn = sessionId
      ? () => getMyCallSummaryPost(user.id, sessionId)
      : callEndedAtStr
        ? () => getMyCallSummaryPostByTime(user.id, parseInt(callEndedAtStr, 10))
        : null;
    if (!fetchFn) { setLoadingPost(false); return; }
    fetchFn()
      .then((found) => {
        if (found) {
          setPost(found);
          setQuoteText(found.quote);
          setOriginalQuoteText(found.quote);
          setSelectedTopic(found.topic);
          if (found.status === "published") setShareState("published");
          else if (found.authorConsented) setShareState("waiting");
        }
        setLoadingPost(false);
      })
      .catch(() => setLoadingPost(false));
  };

  // ── Report modal ──────────────────────────────────────────────────────────
  const [reportModal, setReportModal] = useState<number>(0);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState(false);

  const reportReasons = [
    "Made me uncomfortable",
    "Inappropriate behavior or language",
    "Asked for money or personal details",
    "Not who they said they were",
    "I felt pressured to share my story",
    "Something else",
  ];

  const handleSubmitReport = async () => {
    if (!user || !callPartnerId || !reportReason) return;
    try {
      await reportUser(user.id, callPartnerId, "call", reportReason, reportDetails || undefined);
    } catch { /* non-fatal */ }
    setReportModal(2);
    setReportDetails("");
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

        {/* ── Summary card ──────────────────────────────────────────────── */}
        <div className="bg-[#F4F1FC] border border-[#C5BCDF] p-8 sm:p-12 rounded-[16px] card-shadow mb-10 relative">
          <div className="flex items-center gap-2 text-primary font-medium text-base mb-8 border-b border-[#C5BCDF]/50 pb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            Our AI wrote this summary from your conversation. Nothing has been saved yet.
          </div>

          <h2 className="text-[20px] font-semibold text-foreground mb-4">Reflections from your call</h2>

          {loadingPost ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-[18px] text-foreground/60 font-serif italic">Generating your summary…</p>
            </div>
          ) : !post ? (
            <div className="py-4">
              <p className="font-serif italic text-[20px] leading-relaxed text-foreground/60 mb-4">
                Your summary is still being prepared.
              </p>
              <button
                onClick={handleRefresh}
                className="text-primary font-medium text-base underline"
              >
                Refresh
              </button>
            </div>
          ) : editing ? (
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

          {!loadingPost && post && (
            <div className="flex items-center justify-between">
              <div className="font-medium text-[16px] text-foreground/80">
                — {user?.name ?? "You"}{user?.age ? `, ${user.age}` : ""}
              </div>
              {editing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setQuoteText(originalQuoteText); setEditing(false); }}
                    className="px-4 py-2 border border-border bg-white rounded-lg text-base font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-base font-medium"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Topic selector (only while deciding, not after sharing) ── */}
          {!loadingPost && post && shareState === "idle" && (
            <div className="mt-6 pt-5 border-t border-[#C5BCDF]/50">
              <p className="text-[14px] font-medium text-foreground/70 mb-3">Topic for this story</p>
              <TopicPicker
                value={selectedTopic}
                onChange={(t) => {
                  console.log("[TopicPicker/StoryCapture] topic changed →", t);
                  setSelectedTopic(t);
                }}
              />
            </div>
          )}
        </div>

        {/* ── Action area — switches on shareState ──────────────────────── */}
        {shareState === "idle" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => setEditing(true)}
                disabled={loadingPost || !post || editing}
                className="flex-1 h-[56px] border-2 border-border bg-white text-foreground rounded-[12px] text-[18px] font-medium hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Edit this summary
              </button>
              <button
                onClick={handlePrivate}
                disabled={working}
                className="flex-1 h-[56px] border-2 border-border bg-white text-foreground rounded-[12px] text-[18px] font-medium hover:bg-secondary transition-colors disabled:opacity-40"
              >
                Keep it private
              </button>
              <button
                onClick={handleShare}
                disabled={loadingPost || !post || working || editing}
                className="flex-1 h-[56px] bg-primary text-white rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {working ? "Saving…" : "Share my story"}
              </button>
            </div>
            <p className="text-center text-[16px] text-foreground/60 mb-12">
              Your story will only publish when both you and {partnerName} choose to share.
            </p>
          </>
        )}

        {shareState === "waiting" && (
          <div className="p-6 rounded-[12px] text-center border bg-primary/5 border-primary/20 mb-8" aria-live="polite">
            <div className="flex items-center justify-center gap-2 text-primary font-semibold text-[18px] mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              You've shared
            </div>
            <div className="flex items-center justify-center gap-2 text-foreground/60 text-[16px]">
              <div className="w-4 h-4 rounded-full border-2 border-foreground/30 border-t-foreground/60 animate-spin" />
              Waiting for {partnerName} to decide…
            </div>
            <p className="text-[14px] text-foreground/40 mt-3">
              If they share too, both summaries will publish to the Wisdom Wall.
            </p>
            <div className="mt-4">
              <Link href="/wall" className="text-[16px] text-primary underline">
                Return to Wisdom Wall
              </Link>
            </div>
          </div>
        )}

        {shareState === "published" && (
          <div className="p-6 rounded-[12px] text-center border bg-success/5 border-success/20 mb-8" aria-live="polite">
            <div className="flex items-center justify-center gap-2 text-success font-semibold text-[20px] mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Published to the Wisdom Wall
            </div>
            <p className="text-[16px] text-foreground/60">
              Both you and {partnerName} chose to share. Your stories are now live.
            </p>
            <div className="mt-4">
              <Link href="/wall" className="text-[16px] text-primary underline">
                See it on the Wisdom Wall
              </Link>
            </div>
          </div>
        )}

        {shareState === "private" && (
          <div className="p-6 rounded-[12px] text-center border bg-foreground/5 border-border mb-8" aria-live="polite">
            <p className="text-[18px] font-medium text-foreground/70">
              Kept private — only you can see this.
            </p>
            <div className="mt-4">
              <Link href="/wall" className="text-[16px] text-primary underline">
                Return to Wisdom Wall
              </Link>
            </div>
          </div>
        )}

        {/* ── Footer actions ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-6 pt-12 border-t border-border">
          {scheduleMessage ? (
            <p className="text-success font-medium text-[18px] flex items-center gap-2" aria-live="polite">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Request sent — we'll confirm a time.
            </p>
          ) : (
            <button
              onClick={() => setScheduleMessage(true)}
              className="text-primary font-medium text-[18px] hover:underline px-6 py-3 rounded-xl hover:bg-primary/5 transition"
            >
              Schedule another call with {partnerName}
            </button>
          )}

          <button
            onClick={() => setReportModal(1)}
            className="flex items-center gap-2 text-foreground/50 hover:text-foreground transition text-base"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
            </svg>
            Report a problem with this call
          </button>
        </div>
      </main>

      {/* ── Report modal ───────────────────────────────────────────────────── */}
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
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full mt-2 p-3 border border-border rounded-lg text-base"
                      placeholder="Please describe..."
                      rows={3}
                    />
                  )}
                </div>
                <p className="text-foreground/60 text-base mb-6">{partnerName} won't be notified.</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setReportModal(0); setReportReason(""); setReportDetails(""); }}
                    className="px-4 py-2 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={!reportReason}
                    className="px-6 py-2 bg-[#DC2626] text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    Submit report
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-[24px] font-semibold mb-4">Your report has been received.</h2>
                <p className="text-[16px] text-foreground/70 mb-8">
                  Reviewed within 24 hours. You won't be matched with this person again.
                </p>
                <button
                  onClick={() => { setReportModal(0); setReportReason(""); }}
                  className="w-full px-6 py-3 border border-border rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
