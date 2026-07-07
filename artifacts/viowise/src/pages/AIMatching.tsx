import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";
import { useEffect, useState } from "react";
import { getMatches, getMatchReason, requestCall, logInteraction } from "@/services/api";
import type { Match, RequestIntent } from "@/types";

const FALLBACK_REASON = "Their background and shared interests make this a strong match for a meaningful conversation.";

export default function AIMatching() {
  const { role, user } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const result = await getMatches(user.id);
      setMatches(result);
      setLoading(false);
      result.forEach((m) => {
        logInteraction({ userId: user.id, eventType: "match_shown", targetId: m.user.id, score: m.percent }).catch(() => {});
      });
    })();
  }, [user]);

  const driverText = (m: Match) => {
    if (m.sharedTopics.length > 0) {
      return `${m.sharedTopics.length} shared topic${m.sharedTopics.length === 1 ? "" : "s"}`;
    }
    if (m.sharedLanguages.length > 0) {
      return `${m.sharedLanguages.length} shared language${m.sharedLanguages.length === 1 ? "" : "s"}`;
    }
    return "similar life stage";
  };

  const handleToggleReason = async (matchUserId: string) => {
    if (expanded === matchUserId) {
      setExpanded(null);
      return;
    }
    setExpanded(matchUserId);
    if (!reasons[matchUserId] && user) {
      try {
        const reason = await getMatchReason(user.id, matchUserId);
        setReasons((prev) => ({ ...prev, [matchUserId]: reason || FALLBACK_REASON }));
      } catch {
        setReasons((prev) => ({ ...prev, [matchUserId]: FALLBACK_REASON }));
      }
    }
  };

  const handleRequestCall = async (m: Match) => {
    if (!user) return;
    const intent: RequestIntent = role === "mentor" ? "offer" : "seek";
    await requestCall(user.id, m.user.id, { intent });
    setSentIds((prev) => ({ ...prev, [m.user.id]: true }));
    logInteraction({ userId: user.id, eventType: "call_requested", targetId: m.user.id }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[40px] font-serif text-foreground leading-tight">Your matches</h1>
            <p className="text-[18px] text-foreground/80 mt-2">Ranked by our AI — you choose.</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-2 bg-secondary text-primary rounded-full text-base font-medium border border-border">Updated just now</span>
          </div>
        </div>

        <p className="text-foreground/70 mb-8 max-w-2xl">
          Your matches update automatically as you use VIOWISE — new topics, wisdom you read, and calls you enjoy all improve your ranking.
        </p>

        {loading ? (
          <div className="text-center py-20 text-foreground/60">Loading...</div>
        ) : (
          <div className="space-y-6 mb-12">
            {matches.map(m => {
              const alreadySent = sentIds[m.user.id];
              return (
                <div key={m.user.id} className="bg-white p-6 rounded-[16px] card-shadow border border-border">
                  <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-2xl relative shrink-0">
                        {m.user.name[0]}
                        {m.user.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-success text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" title="ID Verified">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-[20px] font-semibold">{m.user.name}, {m.user.age}</h2>
                        <p className="text-[16px] text-foreground/80 mt-1">{m.user.bio}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.sharedTopics.map(t => (
                            <span key={t} className="px-3 py-1 bg-[#F4F1FC] border border-[#C5BCDF] text-primary rounded-full text-base font-medium flex items-center gap-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              Shared {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 sm:w-56 shrink-0 w-full">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[24px] font-semibold text-primary">{m.percent}%</span>
                          <p className="text-base text-foreground/60">{driverText(m)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 relative shrink-0">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray="113" strokeDashoffset={113 - (113 * m.percent) / 100} />
                          </svg>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRequestCall(m)}
                        disabled={alreadySent}
                        className={`w-full text-center px-6 py-3 rounded-[12px] text-[16px] font-medium transition-colors ${alreadySent ? "bg-success/10 text-success" : "bg-primary text-white hover:bg-primary-hover"}`}
                      >
                        {alreadySent ? "Request sent" : role === "mentor" ? "Offer a call" : "Request a call"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <button
                      onClick={() => handleToggleReason(m.user.id)}
                      className="flex items-center gap-2 text-primary font-medium text-[16px] hover:underline"
                      aria-expanded={expanded === m.user.id}
                    >
                      See why {expanded === m.user.id ? '↑' : '↓'}
                    </button>
                    {expanded === m.user.id && (
                      <p className="mt-3 text-[16px] text-foreground/80 bg-secondary/50 p-4 rounded-[12px]">
                        {reasons[m.user.id] ?? FALLBACK_REASON}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {matches.length === 0 && (
              <p className="text-center text-foreground/60 py-12">No matches yet — update your topics on your profile to find one.</p>
            )}
          </div>
        )}

        <p className="text-center text-[18px] text-foreground/60 font-medium">
          A person, not an algorithm, has the final say on your connections: you.
        </p>
      </main>
    </div>
  );
}
