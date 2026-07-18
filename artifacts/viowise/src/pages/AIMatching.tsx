import AppNav from "@/components/AppNav";
import AvatarImage from "@/components/AvatarImage";
import { useApp } from "@/hooks/use-app";
import { useEffect, useState } from "react";
import { getMatches, getMatchReason, getSentRequests, requestCall, logInteraction } from "@/services/api";
import type { Match, RequestIntent } from "@/types";

const FALLBACK_REASON = "Their background and shared interests make this a strong match for a meaningful conversation.";

function MatchSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading matches">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white p-6 rounded-[18px] card-shadow flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="skeleton w-16 h-16 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-4 w-64" />
              <div className="flex gap-2 mt-1">
                <div className="skeleton h-7 w-24 rounded-full" />
                <div className="skeleton h-7 w-28 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0 w-40">
              <div className="skeleton h-8 w-16 rounded-lg" />
              <div className="skeleton h-11 w-full rounded-[12px]" />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
      const [result, sent] = await Promise.all([
        getMatches(user.id),
        getSentRequests(user.id),
      ]);
      setMatches(result);
      const initial: Record<string, boolean> = {};
      sent
        .filter((r) => r.status === "pending" || r.status === "accepted")
        .forEach((r) => { initial[r.toId] = true; });
      setSentIds(initial);
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
    try {
      await requestCall(user.id, m.user.id, { intent });
      logInteraction({ userId: user.id, eventType: "call_requested", targetId: m.user.id }).catch(() => {});
    } catch {
      // Duplicate or API error — mark as sent anyway
    }
    setSentIds((prev) => ({ ...prev, [m.user.id]: true }));
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[40px] font-serif text-foreground leading-tight">Your matches</h1>
            <p className="text-[18px] text-foreground/70 mt-2">Ranked by our AI — you choose.</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-2 bg-secondary text-primary rounded-full text-[13px] font-medium tracking-wide border border-border">Updated just now</span>
          </div>
        </div>

        <p className="text-foreground/60 mb-8 max-w-2xl text-[16px] leading-relaxed">
          Your matches update automatically as you use VIOWISE — new topics, wisdom you read, and calls you enjoy all improve your ranking.
        </p>

        {loading ? (
          <MatchSkeleton />
        ) : (
          <div className="space-y-6 mb-12">
            {matches.map((m, index) => {
              const alreadySent = sentIds[m.user.id];
              return (
                <div
                  key={m.user.id}
                  className="bg-white p-6 rounded-[18px] card-shadow card-hoverable animate-card-in"
                  style={{ "--card-delay": `${index * 60}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                    <div className="flex gap-4">
                      <div className="relative shrink-0">
                        <AvatarImage user={m.user} className="w-16 h-16 text-2xl" />
                        {m.user.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-success text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" title="ID Verified">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-[20px] font-semibold text-foreground">{m.user.name}</h2>
                        <p className="text-[13px] text-foreground/45 mt-0.5">{m.user.age} years old</p>
                        <p className="text-[15px] text-foreground/70 mt-1.5 leading-snug">{m.user.bio}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.sharedTopics.map(t => (
                            <span key={t} className="px-3 py-1 bg-[#F4F1FC] border border-[#C5BCDF] text-primary rounded-full text-[11px] font-semibold tracking-[0.06em] uppercase flex items-center gap-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 sm:w-52 shrink-0 w-full">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[28px] font-semibold text-primary leading-none">{m.percent}%</span>
                          <p className="text-[13px] text-foreground/50 mt-0.5">{driverText(m)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 relative shrink-0">
                          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray="113" strokeDashoffset={113 - (113 * m.percent) / 100} />
                          </svg>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRequestCall(m)}
                        disabled={alreadySent}
                        className={`btn-action w-full text-center px-6 py-3 rounded-[12px] text-[15px] font-medium ${
                          alreadySent
                            ? "bg-success/10 text-success"
                            : "bg-primary text-white hover:bg-primary-hover"
                        }`}
                      >
                        {alreadySent ? "Request sent" : role === "mentor" ? "Offer a call" : "Request a call"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <button
                      onClick={() => handleToggleReason(m.user.id)}
                      className="btn-action flex items-center gap-2 text-primary font-medium text-[15px] hover:opacity-75"
                      aria-expanded={expanded === m.user.id}
                    >
                      See why
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: expanded === m.user.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expanded === m.user.id && (
                      <p className="mt-3 text-[15px] text-foreground/75 bg-secondary/50 p-4 rounded-[12px] leading-relaxed">
                        {reasons[m.user.id] ?? FALLBACK_REASON}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {matches.length === 0 && (
              <p className="text-center text-foreground/55 py-12 text-[18px]">No matches yet — update your topics on your profile to find one.</p>
            )}
          </div>
        )}

        <p className="text-center text-[18px] text-foreground/55 font-medium">
          A person, not an algorithm, has the final say on your connections: you.
        </p>
      </main>
    </div>
  );
}
