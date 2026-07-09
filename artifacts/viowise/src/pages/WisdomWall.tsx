import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";
import {
  getPosts,
  getUsers,
  approvePost,
  declinePost,
  createPost,
  getMatches,
  requestCall,
  getRequests,
  getSentRequests,
  respondRequest,
  logInteraction,
} from "@/services/api";
import type { Post, User, Match, CallRequest, RequestIntent } from "@/types";
import { useLocation } from "wouter";

function WallSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" aria-label="Loading posts">
      {[0, 1, 2, 4].map((i) => (
        <div key={i} className="bg-white p-8 rounded-[18px] card-shadow flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="skeleton h-7 w-20 rounded-full" />
            <div className="skeleton h-7 w-16 rounded-full" />
          </div>
          <div className="skeleton h-6 w-full mt-2" />
          <div className="skeleton h-6 w-5/6" />
          <div className="skeleton h-6 w-4/6 mb-4" />
          <div className="border-t border-border pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-full" />
              <div className="flex flex-col gap-2">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-3 w-20" />
              </div>
            </div>
            <div className="skeleton h-10 w-32 rounded-[12px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = ["Wisdom", "Community", "My posts", "Requests"] as const;

export default function WisdomWall() {
  const { role, user, setCallPartnerId } = useApp();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("Wisdom");
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myRequests, setMyRequests] = useState<CallRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentPostIds, setSentPostIds] = useState<Record<string, boolean>>({});
  const [requestActionMsg, setRequestActionMsg] = useState<Record<string, string>>({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerQuote, setComposerQuote] = useState("");
  const [composerTopic, setComposerTopic] = useState("Career");
  const [posting, setPosting] = useState(false);

  // Tab sliding indicator
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const activeIndex = TABS.indexOf(tab as typeof TABS[number]);
    const el = tabRefs.current[activeIndex];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [tab]);

  const topics = ["Career", "Family", "Migration", "Health", "Confidence", "Study", "Relationships", "Resilience"];

  const refreshPosts = useCallback(async () => {
    const fresh = await getPosts();
    setPosts(fresh);
  }, []);

  const refreshRequests = useCallback(async () => {
    if (!user) return;
    const [fresh, freshSent] = await Promise.all([
      getRequests(user.id),
      getSentRequests(user.id),
    ]);
    setMyRequests(fresh);
    setSentRequests(freshSent);
  }, [user]);

  useEffect(() => {
    (async () => {
      const [fetchedPosts, fetchedUsers] = await Promise.all([getPosts(), getUsers()]);
      setPosts(fetchedPosts);
      setUsers(fetchedUsers);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [fetchedMatches, fetchedRequests, fetchedSent] = await Promise.all([
        getMatches(user.id),
        getRequests(user.id),
        getSentRequests(user.id),
      ]);
      setMatches(fetchedMatches);
      setMyRequests(fetchedRequests);
      setSentRequests(fetchedSent);
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => { refreshRequests(); }, 5000);
    return () => clearInterval(id);
  }, [user, refreshRequests]);

  const authorOf = (post: Post) => users.find((u) => u.id === post.authorId);

  const pendingApproval = user
    ? posts.find((p) => p.status === "pending_approval" && p.authorId !== user.id)
    : undefined;

  const handleApproveStory = async () => {
    if (!pendingApproval) return;
    await approvePost(pendingApproval.id);
    await refreshPosts();
  };

  const handleDeclineStory = async () => {
    if (!pendingApproval) return;
    await declinePost(pendingApproval.id);
    await refreshPosts();
  };

  const relevanceScore = (post: Post): number => {
    if (!user) return 0;
    const author = users.find((u) => u.id === post.authorId);
    let score = 0;
    if (user.topics.includes(post.topic)) score += 50;
    if (author?.languages?.some((l) => user.languages?.includes(l))) score += 15;
    score += new Date(post.createdAt).getTime() / 1e13;
    return score;
  };

  const handleRequestCall = async (post: Post, author?: User) => {
    if (!user || !author) return;
    const hasActive = sentRequests.some(
      (r) => r.toId === author.id && (r.status === "pending" || r.status === "accepted"),
    );
    if (hasActive) {
      setSentPostIds((prev) => ({ ...prev, [post.id]: true }));
      return;
    }
    const intent: RequestIntent = role === "mentor" ? "offer" : "seek";
    try {
      await requestCall(user.id, author.id, { postId: post.id, intent });
      setSentPostIds((prev) => ({ ...prev, [post.id]: true }));
      logInteraction({ userId: user.id, eventType: "call_requested", targetId: author.id }).catch(() => {});
    } catch {
      setSentPostIds((prev) => ({ ...prev, [post.id]: true }));
    }
  };

  const handlePostDirect = async () => {
    if (!user || !composerQuote.trim()) return;
    setPosting(true);
    await createPost({
      authorId: user.id,
      type: role === "mentor" ? "wisdom" : "reflection",
      quote: composerQuote.trim(),
      topic: composerTopic,
      source: "direct",
      status: "published",
    });
    await refreshPosts();
    setComposerQuote("");
    setComposerOpen(false);
    setPosting(false);
  };

  const handleRespond = async (req: CallRequest, action: "accept" | "decline") => {
    await respondRequest(req.id, action);
    if (action === "accept") {
      logInteraction({ userId: user!.id, eventType: "accepted", targetId: req.fromId }).catch(() => {});
      await refreshRequests();
      setCallPartnerId(req.fromId);
      setLocation("/pre-call");
    } else {
      setRequestActionMsg((prev) => ({ ...prev, [req.id]: "Request declined" }));
      await refreshRequests();
    }
  };

  const visiblePosts = posts.filter((p) => {
    if (tab === "My posts") return user ? p.authorId === user.id : false;
    if (p.status !== "published") return false;
    if (tab === "Wisdom" && user) {
      const author = users.find((u) => u.id === p.authorId);
      if (author && author.role === user.role) return false;
    }
    return true;
  });

  let filteredPosts = visiblePosts.filter((p) => {
    if (topicFilter && p.topic !== topicFilter) return false;
    if (search && !p.quote.toLowerCase().includes(search.toLowerCase()) && !p.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (tab === "Wisdom" || tab === "Community") {
    filteredPosts = [...filteredPosts].sort((a, b) => relevanceScore(b) - relevanceScore(a));
  }

  const pendingRequestCount =
    myRequests.filter((r) => r.status === "pending").length +
    sentRequests.filter((r) => r.status === "accepted").length;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        {/* Pending-approval Card */}
        {pendingApproval && tab === "Wisdom" && (
          <div className="bg-[#F4F1FC] border border-[#C5BCDF] rounded-[18px] p-6 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-semibold text-[18px] text-primary mb-2">
                {authorOf(pendingApproval)?.name ?? "Someone"} wants to share a story from your conversation
              </h3>
              <p className="font-serif italic text-[18px] mb-2">"{pendingApproval.quote}"</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={handleDeclineStory} className="btn-action px-6 py-3 border border-border rounded-[12px] bg-white text-[16px] font-medium hover:bg-secondary">Decline</button>
              <button onClick={handleApproveStory} className="btn-action px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover">Approve</button>
            </div>
          </div>
        )}

        {/* Tabs with sliding indicator */}
        <div className="relative flex gap-0 border-b border-border mb-8 overflow-x-auto pb-px">
          <div
            className="absolute bottom-0 h-[3px] bg-primary rounded-t-full"
            style={{
              left: indicator.left,
              width: indicator.width,
              transition: "left 250ms ease, width 250ms ease",
            }}
            aria-hidden="true"
          />
          {TABS.map((t, i) => (
            <button
              key={t}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-[18px] font-medium whitespace-nowrap relative transition-colors duration-150 ${tab === t ? "text-primary" : "text-foreground/55 hover:text-foreground/80"}`}
            >
              {t}
              {t === "Requests" && pendingRequestCount > 0 && (
                <span className="ml-2 bg-primary text-white text-[13px] px-2 py-0.5 rounded-full">{pendingRequestCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab subtitle */}
        {tab === "Wisdom" && (
          <p className="text-foreground/50 text-[15px] mb-6 -mt-4">
            Insights from {role === "learner" ? "mentors" : "learners"} matched to you.
          </p>
        )}
        {tab === "Community" && (
          <p className="text-foreground/50 text-[15px] mb-6 -mt-4">
            The wider VIOWISE conversation.
          </p>
        )}

        {/* Direct posting composer */}
        {tab !== "Requests" && (
          <div className="bg-white rounded-[18px] card-shadow mb-8 overflow-hidden">
            {!composerOpen ? (
              <button
                onClick={() => setComposerOpen(true)}
                className="w-full text-left px-6 py-4 text-[16px] text-foreground/55 hover:bg-secondary/50 transition-colors flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                {role === "mentor" ? "Share a piece of wisdom..." : "Share a reflection..."}
              </button>
            ) : (
              <div className="p-6">
                <textarea
                  autoFocus
                  value={composerQuote}
                  onChange={(e) => setComposerQuote(e.target.value)}
                  placeholder={role === "mentor" ? "What wisdom would you like to share?" : "What's on your mind?"}
                  className="w-full p-4 rounded-xl border border-input bg-white font-serif italic text-[18px] leading-relaxed outline-none min-h-[120px]"
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:items-center sm:justify-between">
                  <select
                    value={composerTopic}
                    onChange={(e) => setComposerTopic(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-input bg-white text-[16px] w-full sm:w-auto"
                    aria-label="Post topic"
                  >
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setComposerOpen(false); setComposerQuote(""); }}
                      className="btn-action px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostDirect}
                      disabled={!composerQuote.trim() || posting}
                      className="btn-action px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <WallSkeleton />
        ) : tab === "Requests" ? (
          <div className="space-y-10">

            {/* ── Received ── */}
            <section>
              <h2 className="text-[13px] font-semibold text-foreground/40 uppercase tracking-[0.12em] mb-4">Received</h2>
              <div className="space-y-4">
                {myRequests.filter(r => r.status === "pending").map(req => {
                  const fromUser = users.find(u => u.id === req.fromId);
                  return (
                    <div key={req.id} className="bg-white p-6 rounded-[18px] card-shadow card-hoverable flex flex-col sm:flex-row gap-4 justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl">{fromUser?.name?.[0] ?? "?"}</div>
                        <div>
                          <h3 className="font-semibold text-[18px]">{fromUser?.name ?? "Someone"}</h3>
                          <p className="text-[13px] text-foreground/50 mt-0.5">{fromUser?.age} years old</p>
                          <p className="text-[15px] text-foreground/70 mt-1">
                            {req.intent === "seek" ? "would like your advice" : "would like to help"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => handleRespond(req, "decline")} className="btn-action px-6 py-3 border border-border rounded-[12px] font-medium text-[16px] hover:bg-secondary">Decline</button>
                        <button onClick={() => handleRespond(req, "accept")} className="btn-action px-6 py-3 bg-primary text-white rounded-[12px] font-medium text-[16px] hover:bg-primary-hover">Accept</button>
                      </div>
                    </div>
                  );
                })}
                {myRequests.filter(r => r.status === "pending").length === 0 && (
                  <p className="text-foreground/55 py-4">No pending requests.</p>
                )}
              </div>
            </section>

            {/* ── Sent ── */}
            <section>
              <h2 className="text-[13px] font-semibold text-foreground/40 uppercase tracking-[0.12em] mb-4">Sent</h2>
              <div className="space-y-4">
                {sentRequests.filter(r => r.status === "pending" || r.status === "accepted").map(req => {
                  const toUser = users.find(u => u.id === req.toId);
                  const isAccepted = req.status === "accepted";
                  return (
                    <div
                      key={req.id}
                      className={`p-6 rounded-[18px] card-shadow card-hoverable flex flex-col sm:flex-row gap-4 justify-between items-center ${isAccepted ? "bg-[#F0FAF4] border border-[#A3D9B1]" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl">{toUser?.name?.[0] ?? "?"}</div>
                        <div>
                          <h3 className="font-semibold text-[18px]">{toUser?.name ?? "Someone"}</h3>
                          <p className="text-[13px] text-foreground/50 mt-0.5">{toUser?.age} years old</p>
                          <p className="text-[15px] text-foreground/70 mt-1">{req.intent === "seek" ? "You requested their advice" : "You offered to help"}</p>
                        </div>
                      </div>
                      {isAccepted ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1.5 text-[#2D8B4E] font-semibold text-[16px]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Accepted
                          </span>
                          <button
                            onClick={() => { setCallPartnerId(req.toId); setLocation("/pre-call"); }}
                            className="btn-action px-6 py-3 bg-primary text-white rounded-[12px] font-medium text-[16px] hover:bg-primary-hover"
                          >
                            Join call
                          </button>
                        </div>
                      ) : (
                        <span className="px-4 py-2 rounded-full bg-secondary border border-border text-foreground/55 font-medium text-[14px] shrink-0">Awaiting response</span>
                      )}
                    </div>
                  );
                })}
                {sentRequests.filter(r => r.status === "pending" || r.status === "accepted").length === 0 && (
                  <p className="text-foreground/55 py-4">No active requests sent.</p>
                )}
              </div>
            </section>

          </div>
        ) : tab === "My posts" && filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[18px] border border-border border-dashed">
            <p className="text-[18px] text-foreground/55">Stories from your conversations will appear here.</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
              <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                {topics.map(t => (
                  <button
                    key={t}
                    onClick={() => setTopicFilter(topicFilter === t ? null : t)}
                    aria-pressed={topicFilter === t}
                    className={`btn-action px-3 py-1.5 rounded-full border text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors ${topicFilter === t ? "bg-primary/10 border-primary text-primary" : "border-border bg-white text-foreground/60 hover:border-primary/50 hover:text-foreground/80"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64 shrink-0">
                <input
                  type="text"
                  placeholder="Search wisdom..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 h-[44px] rounded-[12px] border border-input pl-10 bg-white"
                  aria-label="Search wisdom"
                />
                <svg className="absolute left-3 top-3 text-foreground/40" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post, index) => {
                const author = authorOf(post);
                const alreadySent =
                  sentPostIds[post.id] ||
                  sentRequests.some(
                    (r) => r.toId === author?.id && (r.status === "pending" || r.status === "accepted"),
                  );
                return (
                  <div
                    key={post.id}
                    className="bg-white p-8 rounded-[18px] card-shadow card-hoverable flex flex-col h-full relative animate-card-in"
                    style={{ "--card-delay": `${index * 60}ms` } as React.CSSProperties}
                  >
                    {post.isNew && (
                      <span className="absolute top-6 right-6 bg-accent text-white px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase">NEW</span>
                    )}
                    {post.status === "pending_approval" && (
                      <span className="absolute top-6 right-6 bg-secondary text-primary px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase border border-border">Pending</span>
                    )}

                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-secondary text-primary text-[11px] font-semibold tracking-[0.08em] uppercase border border-border/50">
                        {post.topic}
                      </span>
                      <span className="inline-block px-3 py-1 rounded-full bg-white text-foreground/50 text-[11px] font-medium tracking-[0.06em] uppercase border border-border/50">
                        {post.type === "wisdom" ? "Wisdom" : post.type === "reflection" ? "Reflection" : "Call story"}
                      </span>
                    </div>

                    <p className="font-serif italic text-[26px] leading-relaxed flex-1 mb-8 text-foreground">
                      "{post.quote}"
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-lg shrink-0">
                          {author?.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <div className="font-medium text-[15px] text-foreground">{author?.name}</div>
                          <div className="text-[13px] text-foreground/45 mt-0.5">
                            {author?.age}{author?.credential ? ` · ${author.credential}` : ""}
                          </div>
                        </div>
                      </div>
                      {author?.id !== user?.id && author?.role !== user?.role && (
                        <button
                          onClick={() => handleRequestCall(post, author)}
                          disabled={alreadySent}
                          className={`btn-action px-4 py-2 rounded-[12px] text-[15px] font-medium ${
                            alreadySent
                              ? "bg-success/10 text-success"
                              : "bg-white border border-border hover:bg-primary hover:text-white hover:border-primary"
                          }`}
                          aria-live="polite"
                        >
                          {alreadySent ? "Request sent" : role === "mentor" ? "Offer a call" : "Request a call"}
                        </button>
                      )}
                    </div>
                    {alreadySent && author?.role !== user?.role && (
                      <div className="mt-4 text-[13px] text-success font-medium text-right">
                        {author?.name} will respond within 2 days.
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredPosts.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-20">
                  <p className="text-[18px] text-foreground/55">
                    {tab === "My posts" ? "Stories from your conversations will appear here." : "No posts match your filters."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
