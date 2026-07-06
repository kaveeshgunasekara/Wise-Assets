import { useState, useEffect, useCallback, useMemo } from "react";
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
  respondRequest,
} from "@/services/api";
import type { Post, User, Match, CallRequest, RequestIntent } from "@/types";
import { useLocation } from "wouter";

export default function WisdomWall() {
  const { role, user, setCallPartnerId } = useApp();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("For you");
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myRequests, setMyRequests] = useState<CallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentPostIds, setSentPostIds] = useState<Record<string, boolean>>({});
  const [requestActionMsg, setRequestActionMsg] = useState<Record<string, string>>({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerQuote, setComposerQuote] = useState("");
  const [composerTopic, setComposerTopic] = useState("Career");
  const [posting, setPosting] = useState(false);

  const topics = ["Career", "Family", "Migration", "Health", "Confidence", "Study", "Relationships", "Resilience"];

  const refreshPosts = useCallback(async () => {
    const fresh = await getPosts();
    setPosts(fresh);
  }, []);

  const refreshRequests = useCallback(async () => {
    if (!user) return;
    const fresh = await getRequests(user.id);
    setMyRequests(fresh);
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
      const [fetchedMatches, fetchedRequests] = await Promise.all([getMatches(user.id), getRequests(user.id)]);
      setMatches(fetchedMatches);
      setMyRequests(fetchedRequests);
    })();
  }, [user]);

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

  // Real, per-author match percent (only populated for opposite-role
  // authors, since getMatches only ranks across roles).
  const matchPercentByAuthor = useMemo(() => {
    const map: Record<string, number> = {};
    matches.forEach((m) => {
      map[m.user.id] = m.percent;
    });
    return map;
  }, [matches]);

  const relevanceScore = (post: Post) => {
    if (!user) return 0;
    const authorPercent = matchPercentByAuthor[post.authorId];
    if (authorPercent !== undefined) return authorPercent;
    // Same-role author (e.g. mentor viewing another mentor's post): fall
    // back to simple topic overlap so the ranking still means something.
    return user.topics.includes(post.topic) ? 60 : 30;
  };

  const handleRequestCall = async (post: Post, author?: User) => {
    if (!user || !author) return;
    const intent: RequestIntent = role === "mentor" ? "offer" : "seek";
    await requestCall(user.id, author.id, { postId: post.id, intent, topic: post.topic });
    setSentPostIds((prev) => ({ ...prev, [post.id]: true }));
  };

  const handlePostDirect = async () => {
    if (!user || !composerQuote.trim()) return;
    setPosting(true);
    // Direct posts publish immediately (no approval needed) since they're
    // the author's own words, unlike call_summary posts which need the
    // other participant's consent before going live.
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
      // The person on the other side of this request becomes the active
      // call partner for the consent screen, the call, and the story
      // capture step that follow.
      setCallPartnerId(req.fromId);
      setLocation("/pre-call");
    } else {
      setRequestActionMsg((prev) => ({ ...prev, [req.id]: "Request declined" }));
      await refreshRequests();
    }
  };

  const visiblePosts = posts.filter((p) => {
    if (tab === "My posts") return user ? p.authorId === user.id : false;
    return p.status === "published";
  });

  let filteredPosts = visiblePosts.filter((p) => {
    if (topicFilter && p.topic !== topicFilter) return false;
    if (search && !p.quote.toLowerCase().includes(search.toLowerCase()) && !p.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (tab === "For you") {
    // A real ranked, role-aware feed: everything published, reordered by
    // relevance to this user (their real match % with the author, or a
    // topic-overlap fallback) — never hidden, unlike a plain filter.
    filteredPosts = [...filteredPosts].sort((a, b) => relevanceScore(b) - relevanceScore(a));
  }

  const pendingRequestCount = myRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        {/* Pending-approval Card */}
        {pendingApproval && tab === "For you" && (
          <div className="bg-[#F4F1FC] border border-[#C5BCDF] rounded-[16px] p-6 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-semibold text-[18px] text-primary mb-2">
                {authorOf(pendingApproval)?.name ?? "Someone"} wants to share a story from your conversation
              </h3>
              <p className="font-serif italic text-[18px] mb-2">"{pendingApproval.quote}"</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={handleDeclineStory} className="px-6 py-3 border border-border rounded-[12px] bg-white text-[16px] font-medium hover:bg-secondary">Decline</button>
              <button onClick={handleApproveStory} className="px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover">Approve</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto pb-1">
          {["For you", "All wisdom", "My posts", "Requests"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-[18px] font-medium whitespace-nowrap relative ${tab === t ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
            >
              {t}
              {t === "Requests" && pendingRequestCount > 0 && (
                <span className="ml-2 bg-primary text-white text-base px-2 py-0.5 rounded-full">{pendingRequestCount}</span>
              )}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* Direct posting composer */}
        {tab !== "Requests" && (
          <div className="bg-white rounded-[16px] card-shadow mb-8 overflow-hidden">
            {!composerOpen ? (
              <button
                onClick={() => setComposerOpen(true)}
                className="w-full text-left px-6 py-4 text-[16px] text-foreground/60 hover:bg-secondary/50 transition-colors flex items-center gap-2"
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
                  className="w-full p-4 rounded-xl border border-input bg-white font-serif italic text-[18px] leading-relaxed outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
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
                      className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostDirect}
                      disabled={!composerQuote.trim() || posting}
                      className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50"
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
          <div className="text-center py-20 text-foreground/60">Loading...</div>
        ) : tab === "Requests" ? (
          <div className="space-y-4">
            {myRequests.map(req => {
              const fromUser = users.find(u => u.id === req.fromId);
              const intentLabel = req.intent === "seek" ? "would like your advice" : "would like to help";
              return (
                <div key={req.id} className="bg-white p-6 rounded-[16px] card-shadow flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl">{fromUser?.name?.[0] ?? "?"}</div>
                    <div>
                      <h3 className="font-semibold text-[18px]">{fromUser?.name ?? "Someone"}, {fromUser?.age}</h3>
                      <p className="text-foreground/70">
                        {intentLabel}{req.topic ? <> about <span className="font-medium">{req.topic}</span></> : null}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-secondary border border-border text-base font-medium text-foreground/70">
                          {req.intent === "seek" ? "I'd like your advice" : "I'd like to help"}
                        </span>
                      </p>
                    </div>
                  </div>
                  {req.status !== "pending" ? (
                    <p className="text-foreground/70 font-medium px-4 py-2">
                      {requestActionMsg[req.id] ?? (req.status === "accepted" ? "Accepted" : "Declined")}
                    </p>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => handleRespond(req, "decline")} className="px-6 py-3 border border-border rounded-[12px] font-medium hover:bg-secondary">Decline</button>
                      <button onClick={() => handleRespond(req, "accept")} className="px-6 py-3 bg-primary text-white rounded-[12px] font-medium hover:bg-primary-hover">Accept</button>
                    </div>
                  )}
                </div>
              );
            })}
            {myRequests.length === 0 && <p className="text-center text-foreground/60 py-12">No pending requests.</p>}
          </div>
        ) : tab === "My posts" && filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[16px] border border-border border-dashed">
            <p className="text-[18px] text-foreground/60">Stories from your conversations will appear here.</p>
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
                    className={`px-4 py-2 rounded-full border text-[16px] whitespace-nowrap transition-colors ${topicFilter === t ? "bg-primary/10 border-primary text-primary" : "border-border bg-white text-foreground/70 hover:border-primary/50"}`}
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
                  className="w-full px-4 h-[44px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none pl-10 bg-white"
                  aria-label="Search wisdom"
                />
                <svg className="absolute left-3 top-3 text-foreground/40" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map(post => {
                const author = authorOf(post);
                const alreadySent = sentPostIds[post.id];
                return (
                  <div key={post.id} className="bg-white p-8 rounded-[16px] card-shadow flex flex-col h-full relative">
                    {post.isNew && <span className="absolute top-6 right-6 bg-accent text-white px-3 py-1 rounded-full text-base font-semibold tracking-wide uppercase">NEW</span>}
                    {post.status === "pending_approval" && (
                      <span className="absolute top-6 right-6 bg-secondary text-primary px-3 py-1 rounded-full text-base font-semibold tracking-wide uppercase border border-border">Pending approval</span>
                    )}

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-secondary text-primary text-base font-medium border border-border/50">
                        {post.topic}
                      </span>
                      <span className="inline-block px-3 py-1 rounded-full bg-white text-foreground/60 text-base font-medium border border-border/50">
                        {post.type === "wisdom" ? "Wisdom" : post.type === "reflection" ? "Reflection" : "Call story"}
                      </span>
                    </div>

                    <p className="font-serif italic text-[24px] leading-relaxed flex-1 mb-8">
                      "{post.quote}"
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl shrink-0">
                          {author?.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-[16px]">{author?.name}, {author?.age}</div>
                          {author?.credential && <div className="text-foreground/60 text-base">{author.credential}</div>}
                        </div>
                      </div>
                      {author?.id !== user?.id && (
                        <button
                          onClick={() => handleRequestCall(post, author)}
                          disabled={alreadySent}
                          className={`px-4 py-2 rounded-[12px] text-[16px] font-medium transition-colors ${alreadySent ? "bg-success/10 text-success" : "bg-white border border-border hover:bg-secondary"}`}
                          aria-live="polite"
                        >
                          {alreadySent ? "Request sent" : role === "mentor" ? "Offer a call" : "Request a call"}
                        </button>
                      )}
                    </div>
                    {alreadySent && (
                      <div className="mt-4 text-base text-success font-medium text-right">
                        {author?.name} will respond within 2 days.
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredPosts.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-20">
                  <p className="text-[18px] text-foreground/60">No wisdom found matching your filters.</p>
                  <button onClick={() => { setSearch(""); setTopicFilter(null); }} className="mt-4 text-primary font-medium">Reset filters</button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="py-8 text-center text-foreground/60 text-[16px] border-t border-border bg-[#F7F5FB]">
        Every storyteller is ID-verified. Stories are published only with both participants' consent.
      </footer>
    </div>
  );
}
