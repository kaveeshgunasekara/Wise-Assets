import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useApp } from "@/hooks/use-app";
import AccessibilityControl from "@/components/AccessibilityControl";
import { getUserById, reportUser, completeRequest } from "@/services/api";
import { supabase } from "@/services/supabase";
import type { User } from "@/types";
import type { DailyCall } from "@daily-co/daily-js";
import DailyIframe from "@daily-co/daily-js";

export default function VideoCall() {
  const { user, subtitlesConsent, storyCaptureConsent, callPartnerId } = useApp();
  const [, setLocation] = useLocation();

  // ── Partner info ──────────────────────────────────────────────────────────
  const [partner, setPartner] = useState<User | undefined>(undefined);

  useEffect(() => {
    if (!callPartnerId) return;
    (async () => {
      const found = await getUserById(callPartnerId);
      setPartner(found);
    })();
  }, [callPartnerId]);

  const partnerName = partner?.name ?? "your match";

  // ── Daily.co state ────────────────────────────────────────────────────────
  const callContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);
  const [partnerLeft, setPartnerLeft] = useState(false);

  // When the other participant leaves, show a message then auto-navigate after 2 s.
  useEffect(() => {
    if (!partnerLeft) return;
    const timer = setTimeout(() => {
      if (user && callPartnerId) {
        completeRequest(user.id, callPartnerId).catch(() => {});
      }
      // Partner path: we don't invoke the Edge Function (ender does that), but we
      // store a timestamp so StoryCapture can find the post via a tight time window.
      if (storyCaptureConsent) {
        sessionStorage.setItem("viowise_call_ended_at", Date.now().toString());
        // Partner never receives callSessionId — clear any stale one from a prior call.
        sessionStorage.removeItem("viowise_call_session_id");
      }
      setLocation(storyCaptureConsent ? "/story-capture" : "/wall");
    }, 2000);
    return () => clearTimeout(timer);
  }, [partnerLeft, user, callPartnerId, storyCaptureConsent, setLocation]);

  // Step 1: create/fetch the Daily room via Edge Function
  useEffect(() => {
    if (!user || !callPartnerId) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("create-daily-room", {
          body: { userA: user.id, userB: callPartnerId },
        });

        if (cancelled) return;

        if (error) {
          console.error("[VideoCall] Edge Function returned an error:", error);
          setCallError("Could not start the video call. Please try again.");
          setConnecting(false);
          return;
        }

        if (!data?.url) {
          console.error("[VideoCall] Edge Function returned no URL. Full data:", data);
          setCallError("Could not start the video call. Please try again.");
          setConnecting(false);
          return;
        }

        // Step 2: embed Daily prebuilt UI once we have the room URL
        if (!callContainerRef.current) {
          console.error("[VideoCall] callContainerRef is null — cannot mount Daily frame");
          return;
        }

        const frame = DailyIframe.createFrame(callContainerRef.current, {
          iframeStyle: {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "0",
          },
          showLeaveButton: false,
          showFullscreenButton: false,
        });

        callFrameRef.current = frame;

        frame.on("joined-meeting", () => {
          if (!cancelled) setConnecting(false);
        });

        frame.on("participant-left", () => {
          // Any participant-left while we're still in the room means the partner left.
          // (Our own leave is handled by handleEndCall which destroys the frame first.)
          if (!cancelled) setPartnerLeft(true);
        });

        frame.on("error", (evt) => {
          console.error("[VideoCall] Daily error event:", evt);
          if (!cancelled)
            setCallError(
              "Camera or microphone permission was denied, or the call encountered an error. Check your browser permissions and try again."
            );
        });

        await frame.join({ url: data.url, userName: user.name });
      } catch (err) {
        console.error("[VideoCall] caught unexpected error:", err);
        if (!cancelled) {
          setCallError("Could not join the call. Check your camera and microphone permissions.");
          setConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, callPartnerId]);

  // Destroy frame on unmount to avoid leaks
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave().then(() => callFrameRef.current?.destroy()).catch(() => callFrameRef.current?.destroy());
        callFrameRef.current = null;
      }
    };
  }, []);

  // ── Timer (wall-clock elapsed) ────────────────────────────────────────────
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    if (connecting) return;
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [connecting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Report ────────────────────────────────────────────────────────────────
  const [reportModal, setReportModal] = useState<number>(0);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const handleSubmitReport = async () => {
    if (!user || !callPartnerId || !reportReason) return;
    try {
      await reportUser(user.id, callPartnerId, "call", reportReason, reportDetails || undefined);
    } catch {
      // non-fatal
    }
    setReportModal(2);
  };

  // ── End call ──────────────────────────────────────────────────────────────
  const handleEndCall = () => {
    // DEBUG — remove after confirming Edge Function fires correctly
    console.log("[handleEndCall] called", {
      userId: user?.id ?? "NULL",
      callPartnerId: callPartnerId ?? "NULL",
      storyCaptureConsent,
    });

    const frame = callFrameRef.current;
    if (frame) {
      frame.leave().then(() => frame.destroy()).catch(() => frame.destroy());
      callFrameRef.current = null;
    }
    if (user && callPartnerId) {
      completeRequest(user.id, callPartnerId).catch(() => {});

      // Generate two pending-approval story summaries via Claude.
      // Only the user who explicitly ends the call triggers this so we don't
      // double-create posts when both sides disconnect at once.
      if (storyCaptureConsent) {
        const payload = { userA: user.id, userB: callPartnerId };
        console.log("[handleEndCall] invoking generate-story-summary with payload:", payload);

        // Store a timestamp so StoryCapture has a fallback if callSessionId
        // is delayed. Clear any stale session ID from a previous call.
        sessionStorage.setItem("viowise_call_ended_at", Date.now().toString());
        sessionStorage.removeItem("viowise_call_session_id");

        // Start the invoke WITHOUT awaiting — navigate immediately so the user
        // lands on /story-capture right away. The Promise survives component
        // unmount; its .then() writes the callSessionId to sessionStorage once
        // the Edge Function responds (~2-4 s), which StoryCapture polls for.
        supabase.functions
          .invoke("generate-story-summary", { body: payload })
          .then((result) => {
            console.log("[handleEndCall] generate-story-summary result:", result);
            const callSessionId = result.data?.callSessionId as string | undefined;
            if (callSessionId) {
              sessionStorage.setItem("viowise_call_session_id", callSessionId);
              console.log("[handleEndCall] callSessionId stored:", callSessionId);
            } else {
              console.warn("[handleEndCall] Edge Function returned no callSessionId:", result);
            }
          })
          .catch((err) => {
            console.error("[handleEndCall] generate-story-summary error:", err);
          });
      } else {
        console.warn("[handleEndCall] storyCaptureConsent is FALSE — Edge Function NOT invoked.");
      }
    } else {
      console.warn("[handleEndCall] user or callPartnerId is null — Edge Function NOT invoked.", {
        user: user?.id,
        callPartnerId,
      });
    }
    setLocation(storyCaptureConsent ? "/story-capture" : "/wall");
  };

  return (
    <div
      className="h-screen w-full text-white flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #17141F, #1C1730)" }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-start z-20 bg-gradient-to-b from-[#17141F]/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-[20px] font-medium drop-shadow-md">
            {connecting ? "Connecting…" : `Call with ${partnerName}`}
          </h1>
          {!connecting && (
            <div className="text-[18px] opacity-80 font-mono mt-1 drop-shadow-md">{formatTime(timer)}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div
            className={`px-3 py-1.5 rounded-full text-base font-medium border ${
              subtitlesConsent ? "bg-white/20 border-white/30" : "bg-black/40 border-white/10"
            }`}
          >
            Live subtitles: {subtitlesConsent ? "On" : "Off"}
          </div>
          <div
            className={`px-3 py-1.5 border rounded-full text-base font-medium flex items-center gap-1.5 ${
              storyCaptureConsent
                ? "bg-[#A594E8]/20 border-[#A594E8]/40 text-[#A594E8]"
                : "bg-black/40 border-white/10 text-white/70"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            Story capture {storyCaptureConsent ? "on" : "off"}
          </div>
          <AccessibilityControl />
        </div>
      </header>

      {/* ── Main: Daily.co embedded call ───────────────────────────────── */}
      <div ref={callContainerRef} className="absolute inset-0 z-0">
        {/* Connecting state */}
        {connecting && !callError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#17141F]">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
            <p className="text-[18px] text-white/70">Setting up your call with {partnerName}…</p>
          </div>
        )}

        {/* Error state */}
        {callError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#17141F] px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <p className="text-[18px] text-white/80 max-w-md">{callError}</p>
            <Link href="/wall" className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-base font-medium transition">
              ← Back to Wisdom Wall
            </Link>
          </div>
        )}
      </div>

      {/* ── Partner-left banner ─────────────────────────────────────────── */}
      {partnerLeft && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/10 border border-white/20 rounded-[16px] px-8 py-6 text-center shadow-2xl max-w-sm mx-6">
            <p className="text-[20px] font-medium text-white mb-2">The other person has left the call.</p>
            <p className="text-[15px] text-white/60">Taking you out now…</p>
          </div>
        </div>
      )}

      {/* ── Controls footer ─────────────────────────────────────────────── */}
      {/* pointer-events-none on the wrapper so empty space doesn't block
          Daily's own mic/camera/leave tray rendered underneath; only the
          buttons themselves re-enable pointer events. */}
      {!callError && (
        <footer className="absolute bottom-0 w-full p-6 flex justify-center items-end gap-6 z-20 bg-gradient-to-t from-[#17141F]/80 to-transparent pt-32 pointer-events-none">
          <button onClick={handleEndCall} className="flex flex-col items-center gap-2 group pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] flex items-center justify-center transition shadow-lg shadow-red-900/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
              </svg>
            </div>
            <span className="text-base font-medium text-red-400">End call</span>
          </button>

          <button onClick={() => setReportModal(1)} className="flex flex-col items-center gap-2 group absolute right-6 bottom-6 pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" x2="4" y1="22" y2="15" />
              </svg>
            </div>
            <span className="text-base font-medium opacity-60 group-hover:opacity-100">Report</span>
          </button>
        </footer>
      )}

      {/* ── Report modal ────────────────────────────────────────────────── */}
      {reportModal > 0 && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-black">
          <div className="bg-white rounded-[16px] max-w-md w-full p-8 shadow-2xl">
            {reportModal === 1 ? (
              <>
                <h2 className="text-[24px] font-semibold mb-6">Report this call</h2>
                <div className="space-y-3 mb-6">
                  {[
                    "Made me uncomfortable",
                    "Inappropriate behavior or language",
                    "Asked for money or personal details",
                    "Not who they said they were",
                    "Something else",
                  ].map((r) => (
                    <label key={r} className="flex items-center gap-4 p-4 border border-border rounded-[12px] cursor-pointer hover:bg-secondary/50 transition">
                      <input type="radio" name="report" value={r} onChange={() => setReportReason(r)} checked={reportReason === r} className="w-5 h-5 accent-[#DC2626]" />
                      <span className="text-[16px] font-medium">{r}</span>
                    </label>
                  ))}
                  {reportReason === "Something else" && (
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="w-full mt-2 p-3 border border-border rounded-lg text-base"
                      placeholder="Please describe…"
                      rows={3}
                    />
                  )}
                </div>
                <p className="text-foreground/60 text-base mb-6">{partnerName} won't be notified.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setReportModal(0)} className="px-4 py-2 font-medium">
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
              <>
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-[24px] font-semibold mb-4">Your report has been received.</h2>
                <p className="text-[16px] text-foreground/70 mb-8">
                  Reviewed within 24 hours. You won't be matched with this person again.
                </p>
                <div className="flex flex-col gap-3">
                  <button onClick={handleEndCall} className="w-full px-6 py-3 bg-[#DC2626] text-white rounded-lg font-medium">
                    End call now
                  </button>
                  <button onClick={() => setReportModal(0)} className="w-full px-6 py-3 border border-border rounded-lg font-medium">
                    Continue the call
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
