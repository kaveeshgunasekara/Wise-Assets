import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/services/supabase";
import { useApp } from "@/hooks/use-app";

// ── Web Speech API type stubs (not in standard TS lib) ───────────────────────
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition: (new () => SpeechRecognitionInstance) | undefined;
    webkitSpeechRecognition: (new () => SpeechRecognitionInstance) | undefined;
  }
}

// ── Page → route map (every route verified against App.tsx) ──────────────────
const PAGE_ROUTES: Record<string, string> = {
  matching:  "/matching",
  wisdom:    "/wall",
  profile:   "/profile",
  requests:  "/wall?tab=Requests",
  help:      "/help",
  home:      "/",
};

const PAGE_LABELS: Record<string, string> = {
  matching:  "AI Matching",
  wisdom:    "the Wisdom Wall",
  profile:   "your profile",
  requests:  "your call requests",
  help:      "the Help page",
  home:      "the home page",
};

// ── Keyword fallback (runs if Claude returns "unknown" or errors) ─────────────
function keywordFallback(transcript: string): string | null {
  const t = transcript.toLowerCase();
  if (/\b(mentor|learn|match|connect|find someone|pair|partner)\b/.test(t)) return "matching";
  if (/\b(wisdom|stor|post|read|wall|communit)\b/.test(t)) return "wisdom";
  if (/\b(profile|photo|settings|account|my info|edit)\b/.test(t)) return "profile";
  if (/\b(request|call|schedule|invitation|pending)\b/.test(t)) return "requests";
  if (/\b(help|support|how does|guide|tutorial|what is)\b/.test(t)) return "help";
  if (/\b(home|back|start|main|begin)\b/.test(t)) return "home";
  return null;
}

// ── TTS helper ────────────────────────────────────────────────────────────────
function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.9;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
}

// ── State machine ─────────────────────────────────────────────────────────────
type VoiceState =
  | { kind: "idle" }
  | { kind: "listening" }
  | { kind: "processing"; transcript: string }
  | { kind: "result"; transcript: string; reply: string }
  | { kind: "error"; message: string; canRetry: boolean };

// ── Main component ────────────────────────────────────────────────────────────
export default function VoiceNav() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>({ kind: "idle" });
  const [, setLocation] = useLocation();
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SpeechRecognitionClass =
    typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
      : null;

  // ── Navigate after short delay so user can read the reply ────────────────
  const doNavigate = useCallback(
    (page: string, replyText: string, transcript: string) => {
      const route = PAGE_ROUTES[page];
      const reply = replyText || `Taking you to ${PAGE_LABELS[page] ?? page}.`;
      setVoiceState({ kind: "result", transcript, reply });
      speak(reply);
      navTimerRef.current = setTimeout(() => {
        setOpen(false);
        setVoiceState({ kind: "idle" });
        setLocation(route);
      }, 2400);
    },
    [setLocation],
  );

  // ── Call edge function, then fall back to keywords ────────────────────────
  const processTranscript = useCallback(
    async (transcript: string) => {
      setVoiceState({ kind: "processing", transcript });

      let page: string | null = null;
      let reply = "";

      try {
        const { data, error } = await supabase.functions.invoke("navigate-assistant", {
          body: { transcript },
        });
        if (!error && data?.page && data.page !== "unknown") {
          page = data.page as string;
          reply = (data.reply as string) ?? "";
        }
      } catch {
        // fall through to keyword fallback
      }

      if (!page) page = keywordFallback(transcript);

      if (!page) {
        const msg = "I didn't catch that — try saying 'find a mentor' or 'show wisdom'";
        setVoiceState({ kind: "error", message: msg, canRetry: true });
        speak(msg);
        return;
      }

      doNavigate(page, reply, transcript);
    },
    [doNavigate],
  );

  // ── Start SpeechRecognition ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass) {
      setVoiceState({
        kind: "error",
        message: "Voice works best in Chrome — please use Chrome for voice navigation.",
        canRetry: false,
      });
      return;
    }

    recRef.current?.abort();
    const rec = new SpeechRecognitionClass();
    recRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    let gotResult = false;
    let gotError = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      gotResult = true;
      const transcript = Array.from({ length: e.results.length })
        .map((_, i) => e.results[i][0].transcript)
        .join(" ")
        .trim();
      processTranscript(transcript);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      gotError = true;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceState({
          kind: "error",
          message: "I need microphone access to help you navigate. Please enable it in your browser settings.",
          canRetry: false,
        });
      } else if (e.error === "no-speech") {
        setVoiceState({
          kind: "error",
          message: "I didn't hear anything — tap the mic to try again.",
          canRetry: true,
        });
      } else {
        setVoiceState({
          kind: "error",
          message: "Something went wrong — tap the mic to try again.",
          canRetry: true,
        });
      }
    };

    rec.onend = () => {
      if (!gotResult && !gotError) {
        setVoiceState({
          kind: "error",
          message: "I didn't hear anything — tap the mic to try again.",
          canRetry: true,
        });
      }
    };

    setVoiceState({ kind: "listening" });

    try {
      rec.start();
    } catch {
      setVoiceState({
        kind: "error",
        message: "Could not start microphone — tap the mic to try again.",
        canRetry: true,
      });
    }
  }, [SpeechRecognitionClass, processTranscript]);

  // ── Open panel + start listening immediately ──────────────────────────────
  const handleOpen = useCallback(() => {
    setOpen(true);
    setVoiceState({ kind: "idle" });
    setTimeout(() => startListening(), 120);
  }, [startListening]);

  // ── Close panel + cleanup ─────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    recRef.current?.abort();
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setOpen(false);
    setVoiceState({ kind: "idle" });
  }, []);

  useEffect(() => {
    return () => {
      recRef.current?.abort();
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  if (!user) return null;

  return (
    <>
      {/* Floating mic button — always visible when panel is closed */}
      {!open && (
        <button
          onClick={handleOpen}
          aria-label="Voice navigation — tap to speak"
          title="Voice navigation"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-primary text-white shadow-[0_4px_24px_rgba(83,64,155,0.45)] hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center"
        >
          <MicIcon size={28} />
        </button>
      )}

      {/* Voice assistant panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-white rounded-[24px] shadow-[0_8px_48px_rgba(83,64,155,0.20)] border border-primary/10 overflow-hidden"
          style={{ width: "min(340px, calc(100vw - 24px))" }}
        >
          {/* Header bar */}
          <div className="bg-primary px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-white opacity-90"><MicIcon size={20} /></span>
              <span className="text-white font-semibold text-[17px]">Voice Assistant</span>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close voice assistant"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* State body */}
          <div className="px-5 py-7 min-h-[164px] flex flex-col items-center justify-center text-center gap-4">
            <VoiceStateDisplay state={voiceState} onRetry={startListening} />
          </div>
        </div>
      )}
    </>
  );
}

// ── State display sub-component ───────────────────────────────────────────────
function VoiceStateDisplay({
  state,
  onRetry,
}: {
  state: VoiceState;
  onRetry: () => void;
}) {
  if (state.kind === "idle") {
    return <p className="text-foreground/45 text-[16px]">Starting microphone…</p>;
  }

  if (state.kind === "listening") {
    return (
      <>
        <div className="relative flex items-center justify-center w-16 h-16">
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.2s" }} />
          <span className="relative w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MicIcon size={28} />
          </span>
        </div>
        <p className="text-[18px] font-medium text-foreground/80 leading-snug max-w-[260px]">
          Listening…<br />
          <span className="text-[15px] font-normal text-foreground/55">Tell me where you'd like to go.</span>
        </p>
      </>
    );
  }

  if (state.kind === "processing") {
    return (
      <>
        <p className="text-[13px] text-foreground/40 italic">You said:</p>
        <p className="text-[17px] font-medium text-foreground/80 max-w-[270px]">"{state.transcript}"</p>
        <div className="flex items-center gap-2 text-primary text-[14px]">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Finding your page…
        </div>
      </>
    );
  }

  if (state.kind === "result") {
    return (
      <>
        <p className="text-[13px] text-foreground/40 italic">You said:</p>
        <p className="text-[14px] text-foreground/60 max-w-[260px]">"{state.transcript}"</p>
        <div className="flex items-start gap-2.5 text-primary">
          <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p className="text-[18px] font-semibold leading-snug text-left">{state.reply}</p>
        </div>
        <p className="text-[12px] text-foreground/35">Navigating in a moment…</p>
      </>
    );
  }

  return (
    <>
      <p className="text-[16px] text-foreground/75 leading-snug max-w-[270px]">{state.message}</p>
      {state.canRetry && (
        <button
          onClick={onRetry}
          aria-label="Try again — tap to speak"
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_4px_16px_rgba(83,64,155,0.35)] hover:bg-primary-hover active:scale-95 transition-all"
        >
          <MicIcon size={26} />
        </button>
      )}
    </>
  );
}

// ── Mic icon ──────────────────────────────────────────────────────────────────
function MicIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0 0 14 0"/>
      <line x1="12" x2="12" y1="17" y2="22"/>
      <line x1="8" x2="16" y1="22" y2="22"/>
    </svg>
  );
}
