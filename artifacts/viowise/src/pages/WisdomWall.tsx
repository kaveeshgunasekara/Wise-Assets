import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import AppNav from "@/components/AppNav";
import AvatarImage from "@/components/AvatarImage";
import TopicPicker from "@/components/TopicPicker";
import { useApp } from "@/hooks/use-app";
import {
  getPosts,
  getUsers,
  declinePost,
  consentToShare,
  revokeConsent,
  editPost,
  getCallSummaryPartnerUserId,
  getUserById,
  getPostById,
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

// ── PendingCallSummaryFooter ───────────────────────────────────────────────
// Each pending card gets its OWN instance of this component so selectedTopic
// is truly local state — never shared across cards, never overwritten by
// parent re-renders or polling effects.
function PendingCallSummaryFooter({
  post,
  user,
  pInfo,
  editingPostId,
  editingText,
  myPostsWorking,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onShare,
  onKeepPrivate,
  onUnshare,
}: {
  post: Post;
  user: User | null | undefined;
  pInfo: { name: string | null; postExists: boolean } | undefined;
  editingPostId: string | null;
  editingText: string;
  myPostsWorking: Record<string, boolean>;
  onStartEdit: (postId: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (postId: string) => void;
  onShare: (postId: string, topic: string) => void;
  onKeepPrivate: (postId: string) => void;
  onUnshare: (post: Post) => void;
}) {
  const [selectedTopic, setSelectedTopic] = useState(post.topic);

  return (
    <div className="mt-auto border-t border-border pt-5">
      {/* Author + partner context line */}
      <div className="flex items-center gap-3 mb-4">
        <AvatarImage user={user} className="w-8 h-8 text-base shrink-0" />
        <div className="text-[13px] text-foreground/60">
          {user?.name}{user?.age ? `, ${user.age}` : ""}
          {pInfo?.name ? ` · with ${pInfo.name}` : ""}
        </div>
      </div>

      {/* State 1: not yet shared */}
      {!post.authorConsented && (
        editingPostId === post.id ? (
          <div className="flex gap-2">
            <button
              onClick={() => onCancelEdit()}
              className="flex-1 h-10 border border-border rounded-lg text-[14px] font-medium bg-white hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onSaveEdit(post.id)}
              disabled={myPostsWorking[post.id] || !editingText.trim()}
              className="flex-1 h-10 bg-primary text-white rounded-lg text-[14px] font-medium hover:bg-primary-hover transition disabled:opacity-40"
            >
              {myPostsWorking[post.id] ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-foreground/50 mb-3">Not shared yet — only you can see this.</p>
            <div className="mb-3">
              <p className="text-[11px] font-medium text-foreground/45 uppercase tracking-[0.08em] mb-1.5">Topic</p>
              <TopicPicker
                value={selectedTopic}
                onChange={(t) => {
                  console.log("[TopicPicker] topic changed:", post.id, "→", t);
                  setSelectedTopic(t);
                }}
                compact
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onStartEdit(post.id)}
                className="h-9 px-3 border border-border rounded-lg text-[13px] font-medium bg-white hover:bg-secondary transition"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  console.log("[Share] using topic:", selectedTopic);
                  onShare(post.id, selectedTopic);
                }}
                disabled={myPostsWorking[post.id]}
                className="h-9 px-4 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary-hover transition disabled:opacity-40"
              >
                {myPostsWorking[post.id] ? "Sharing…" : "Share to Wisdom Wall"}
              </button>
              <button
                onClick={() => onKeepPrivate(post.id)}
                disabled={myPostsWorking[post.id]}
                className="h-9 px-3 border border-border rounded-lg text-[13px] font-medium bg-white hover:bg-secondary transition disabled:opacity-40"
              >
                Keep private
              </button>
            </div>
          </>
        )
      )}

      {/* State 2: shared, waiting */}
      {post.authorConsented && (
        pInfo?.postExists === false ? (
          <>
            <p className="text-[13px] text-foreground/60 mb-3">
              Your call partner chose to keep this private, so it won't be published. You can keep yours private too.
            </p>
            <button
              onClick={() => onKeepPrivate(post.id)}
              disabled={myPostsWorking[post.id]}
              className="h-9 px-3 border border-border rounded-lg text-[13px] font-medium bg-white hover:bg-secondary transition disabled:opacity-40"
            >
              {myPostsWorking[post.id] ? "Removing…" : "Keep private"}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-primary text-[13px] font-medium mb-3">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Waiting for {pInfo?.name ?? "your call partner"} to share too…
            </div>
            <button
              onClick={() => onUnshare(post)}
              disabled={myPostsWorking[post.id]}
              className="h-9 px-3 border border-border rounded-lg text-[13px] font-medium bg-white hover:bg-secondary transition disabled:opacity-40"
            >
              {myPostsWorking[post.id] ? "Reverting…" : "Make private again"}
            </button>
          </>
        )
      )}
    </div>
  );
}

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

  // ── My Posts call-summary management ─────────────────────────────────────
  // partnerInfo[callSessionId] = { name, postExists }
  // name null = couldn't load; postExists false = partner deleted their post
  const [partnerInfo, setPartnerInfo] = useState<Record<string, { name: string | null; postExists: boolean }>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [myPostsWorking, setMyPostsWorking] = useState<Record<string, boolean>>({});

  // Tab sliding indicator
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Tracks which callSessionIds have already had their partner name fetched (avoids re-fetching)
  const partnerNamesFetchedRef = useRef<Set<string>>(new Set());
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

  // Fetch partner name once per pending call-summary session (uses ref to avoid re-fetching)
  useEffect(() => {
    if (!user?.id) return;
    const pending = posts.filter(
      (p) =>
        p.authorId === user.id &&
        p.type === "call_summary" &&
        p.status === "pending_approval" &&
        p.callSessionId &&
        !partnerNamesFetchedRef.current.has(p.callSessionId),
    );
    pending.forEach(async (p) => {
      if (!p.callSessionId) return;
      partnerNamesFetchedRef.current.add(p.callSessionId);
      const partnerId = await getCallSummaryPartnerUserId(p.callSessionId, user.id);
      let name: string | null = null;
      if (partnerId) {
        const partnerUser = await getUserById(partnerId);
        name = partnerUser?.name ?? null;
      }
      setPartnerInfo((prev) => ({
        ...prev,
        [p.callSessionId!]: { name, postExists: partnerId !== null },
      }));
    });
  }, [posts, user?.id]); // partnerInfo intentionally excluded — would cause infinite loop

  // Poll every 3 s when on My posts tab:
  //   (a) detect if a waiting post became published (dual-consent trigger fired)
  //   (b) detect if the partner deleted their post (chose Keep private)
  useEffect(() => {
    if (!user?.id || tab !== "My posts") return;

    const waitingPosts = posts.filter(
      (p) =>
        p.authorId === user.id &&
        p.type === "call_summary" &&
        p.status === "pending_approval" &&
        p.authorConsented === true,
    );
    const pendingPosts = posts.filter(
      (p) =>
        p.authorId === user.id &&
        p.type === "call_summary" &&
        p.status === "pending_approval" &&
        !!p.callSessionId,
    );

    if (waitingPosts.length === 0 && pendingPosts.length === 0) return;

    const id = setInterval(async () => {
      if (waitingPosts.length > 0) {
        const updates = await Promise.all(waitingPosts.map((p) => getPostById(p.id)));
        if (updates.some((u) => u?.status === "published")) {
          await refreshPosts();
          return; // refreshPosts will update state; let next tick re-evaluate
        }
      }
      // Re-check whether each partner's post still exists
      pendingPosts.forEach(async (p) => {
        if (!p.callSessionId) return;
        const partnerId = await getCallSummaryPartnerUserId(p.callSessionId, user.id);
        setPartnerInfo((prev) => {
          const cur = prev[p.callSessionId!];
          const nowExists = partnerId !== null;
          if (cur && cur.postExists === nowExists) return prev;
          return { ...prev, [p.callSessionId!]: { name: cur?.name ?? null, postExists: nowExists } };
        });
      });
    }, 3000);

    return () => clearInterval(id);
  }, [posts, user?.id, tab, refreshPosts]);

  const authorOf = (post: Post) => users.find((u) => u.id === post.authorId);

  // ── My Posts call-summary handlers ─────────────────────────────────────────
  const handleMyPostsShare = async (postId: string, topic?: string) => {
    setMyPostsWorking((prev) => ({ ...prev, [postId]: true }));
    try {
      const targetPost = posts.find((p) => p.id === postId);
      if (topic && targetPost && topic !== targetPost.topic) {
        await editPost(postId, { topic });
      }
      await consentToShare(postId);
      await refreshPosts();
    } finally {
      setMyPostsWorking((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleMyPostsKeepPrivate = async (postId: string) => {
    setMyPostsWorking((prev) => ({ ...prev, [postId]: true }));
    try { await declinePost(postId); await refreshPosts(); }
    finally { setMyPostsWorking((prev) => ({ ...prev, [postId]: false })); }
  };

  const handleMyPostsUnshare = async (post: Post) => {
    if (post.status === "published") return; // guard: never un-publish
    setMyPostsWorking((prev) => ({ ...prev, [post.id]: true }));
    try { await revokeConsent(post.id); await refreshPosts(); }
    finally { setMyPostsWorking((prev) => ({ ...prev, [post.id]: false })); }
  };

  const handleMyPostsSaveEdit = async (postId: string) => {
    setMyPostsWorking((prev) => ({ ...prev, [postId]: true }));
    try {
      await editPost(postId, { quote: editingText.trim() });
      setEditingPostId(null);
      await refreshPosts();
    } finally {
      setMyPostsWorking((prev) => ({ ...prev, [postId]: false }));
    }
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
      setLocation("/schedule");
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

      {/* ── Sticky control zone: AppNav + tabs + composer + filters ──────────── */}
      <div className="sticky top-0 z-40 shadow-[0_2px_12px_rgba(83,64,155,0.08)]">
        <AppNav />

        {/* White band beneath the nav bar holding tabs / composer / filters */}
        <div className="bg-white border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">

            {/* Sub-tabs with sliding indicator */}
            <div className="relative flex gap-0 border-b border-border overflow-x-auto pb-px">
              <div
                className="absolute bottom-0 h-[3px] bg-primary rounded-t-full pointer-events-none"
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

            {/* Composer — shown for all tabs except Requests */}
            {tab !== "Requests" && (
              <div className="border-b border-border">
                {!composerOpen ? (
                  <button
                    onClick={() => setComposerOpen(true)}
                    className="w-full text-left py-3 text-[16px] text-foreground/55 hover:text-foreground/75 transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    {role === "mentor" ? "Share a piece of wisdom..." : "Share a reflection..."}
                  </button>
                ) : (
                  <div className="py-3">
                    <textarea
                      autoFocus
                      value={composerQuote}
                      onChange={(e) => setComposerQuote(e.target.value)}
                      placeholder={role === "mentor" ? "What wisdom would you like to share?" : "What's on your mind?"}
                      className="w-full p-3 rounded-xl border border-input bg-white font-serif italic text-[17px] leading-relaxed outline-none min-h-[88px] resize-none"
                    />
                    <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:items-center sm:justify-between">
                      <select
                        value={composerTopic}
                        onChange={(e) => setComposerTopic(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-input bg-white text-[15px] w-full sm:w-auto"
                        aria-label="Post topic"
                      >
                        {topics.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setComposerOpen(false); setComposerQuote(""); }}
                          className="btn-action px-4 py-1.5 border border-border rounded-lg text-[15px] font-medium hover:bg-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePostDirect}
                          disabled={!composerQuote.trim() || posting}
                          className="btn-action px-5 py-1.5 bg-primary text-white rounded-lg text-[15px] font-medium hover:bg-primary-hover disabled:opacity-50"
                        >
                          {posting ? "Posting..." : "Post"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters + search — shown for non-Requests tabs */}
            {tab !== "Requests" && (
              <div className="py-2.5 flex flex-col md:flex-row gap-2.5">
                <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {topics.map(t => (
                    <button
                      key={t}
                      onClick={() => setTopicFilter(topicFilter === t ? null : t)}
                      aria-pressed={topicFilter === t}
                      className={`btn-action px-3 py-1 rounded-full border text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors shrink-0 ${topicFilter === t ? "bg-primary/10 border-primary text-primary" : "border-border bg-white text-foreground/60 hover:border-primary/50 hover:text-foreground/80"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-56 shrink-0">
                  <input
                    type="text"
                    placeholder="Search wisdom..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-9 rounded-[10px] border border-input pl-9 pr-3 bg-white text-[14px]"
                    aria-label="Search wisdom"
                  />
                  <svg className="absolute left-2.5 top-2 text-foreground/40" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>{/* end sticky control zone */}

      {/* ── Scrollable content: only posts / requests scroll beneath the zone ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">

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
                        <AvatarImage user={fromUser} className="w-12 h-12 text-xl shrink-0" />
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
                        <AvatarImage user={toUser} className="w-12 h-12 text-xl shrink-0" />
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
                            onClick={() => { setCallPartnerId(req.toId); setLocation("/schedule"); }}
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
            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post, index) => {
                const author = authorOf(post);
                const alreadySent =
                  sentPostIds[post.id] ||
                  sentRequests.some(
                    (r) => r.toId === author?.id && (r.status === "pending" || r.status === "accepted"),
                  );
                const isMyPendingCallSummary =
                  tab === "My posts" &&
                  post.type === "call_summary" &&
                  post.status === "pending_approval";
                const pInfo = post.callSessionId ? partnerInfo[post.callSessionId] : undefined;
                return (
                  <div
                    key={post.id}
                    className="bg-white p-8 rounded-[18px] card-shadow card-hoverable flex flex-col h-full relative animate-card-in"
                    style={{ "--card-delay": `${index * 60}ms` } as React.CSSProperties}
                  >
                    {/* Badges */}
                    {post.isNew && (
                      <span className="absolute top-6 right-6 bg-accent text-white px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase">NEW</span>
                    )}
                    {tab === "My posts" && post.type === "call_summary" && post.status === "published" && !post.isNew && (
                      <span className="absolute top-6 right-6 bg-success/10 text-success px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.1em] uppercase border border-success/20">Published ✓</span>
                    )}

                    {/* Topic + type pills */}
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-secondary text-primary text-[11px] font-semibold tracking-[0.08em] uppercase border border-border/50">
                        {post.topic}
                      </span>
                      <span className="inline-block px-3 py-1 rounded-full bg-white text-foreground/50 text-[11px] font-medium tracking-[0.06em] uppercase border border-border/50">
                        {post.type === "wisdom" ? "Wisdom" : post.type === "reflection" ? "Reflection" : "Call story"}
                      </span>
                    </div>

                    {/* Quote — becomes a textarea when editing */}
                    {editingPostId === post.id ? (
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 w-full p-4 rounded-xl border border-primary/30 bg-white font-serif italic text-[22px] leading-relaxed mb-6 outline-none focus:ring-2 focus:ring-primary/20 min-h-[160px] resize-none"
                      />
                    ) : (
                      <p className="font-serif italic text-[26px] leading-relaxed flex-1 mb-8 text-foreground">
                        "{post.quote}"
                      </p>
                    )}

                    {/* Footer: pending call_summary in My posts gets a special 3-state footer */}
                    {isMyPendingCallSummary ? (
                      <PendingCallSummaryFooter
                        post={post}
                        user={user}
                        pInfo={pInfo}
                        editingPostId={editingPostId}
                        editingText={editingText}
                        myPostsWorking={myPostsWorking}
                        onStartEdit={(postId) => { setEditingPostId(postId); setEditingText(post.quote); }}
                        onCancelEdit={() => { setEditingPostId(null); setEditingText(""); }}
                        onSaveEdit={handleMyPostsSaveEdit}
                        onShare={handleMyPostsShare}
                        onKeepPrivate={handleMyPostsKeepPrivate}
                        onUnshare={handleMyPostsUnshare}
                      />
                    ) : (
                      /* Standard card footer */
                      <>
                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                          <div className="flex items-center gap-3">
                            <AvatarImage user={author} className="w-10 h-10 text-lg shrink-0" />
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
                      </>
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
