import { useState } from "react";
import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";

export default function WisdomWall() {
  const { role, user, setRole, stories, pendingStory, setPendingStory, addStory } = useApp();
  const [tab, setTab] = useState("For you");
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  
  const [requests, setRequests] = useState([{ id: 1, name: "Sam", age: 21, topic: "Career" }]);
  const [requestAction, setRequestAction] = useState<Record<string, string>>({});
  const [callRequests, setCallRequests] = useState<Record<string, boolean>>({});

  const topics = ["Career", "Family", "Migration", "Health", "Confidence", "Study", "Relationships", "Resilience"];

  const handleApproveStory = () => {
    if (pendingStory) {
      addStory({ ...pendingStory, isNew: true });
      setPendingStory(null);
    }
  };

  const filteredStories = stories.filter(s => {
    if (topicFilter && s.topic !== topicFilter) return false;
    if (search && !s.quote.toLowerCase().includes(search.toLowerCase()) && !s.topic.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "My posts" && s.author !== (role === "mentor" ? "Grace" : "Sam")) return false;
    if (tab === "For you" && user?.topics && user.topics.length > 0 && !user.topics.includes(s.topic)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />

      {/* Demo Role Switcher */}
      <div className="bg-secondary p-2 text-center text-base font-medium border-b border-border z-10 relative">
        Demo: Viewing as {role === "mentor" ? "Grace (Mentor)" : "Sam (Learner)"}
        <button onClick={() => setRole(role === "mentor" ? "learner" : "mentor")} className="ml-4 text-primary underline">Switch role</button>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        
        {/* Learner Approval Card */}
        {role === "learner" && pendingStory && tab === "For you" && (
          <div className="bg-[#F4F1FC] border border-[#C5BCDF] rounded-[16px] p-6 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h3 className="font-semibold text-[18px] text-primary mb-2">Grace wants to share a story from your conversation</h3>
              <p className="font-serif italic text-[18px] mb-2">"{pendingStory.quote}"</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => setPendingStory(null)} className="px-6 py-3 border border-border rounded-[12px] bg-white text-[16px] font-medium hover:bg-secondary">Decline</button>
              <button onClick={handleApproveStory} className="px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover">Approve</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto pb-1">
          {["For you", "All wisdom", "My posts"].concat(role === "mentor" ? ["Requests"] : []).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-[18px] font-medium whitespace-nowrap relative ${tab === t ? "text-primary" : "text-foreground/60 hover:text-foreground"}`}
            >
              {t}
              {t === "Requests" && requests.length > 0 && (
                <span className="ml-2 bg-primary text-white text-base px-2 py-0.5 rounded-full">{requests.length}</span>
              )}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />}
            </button>
          ))}
        </div>

        {tab === "Requests" && role === "mentor" ? (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-white p-6 rounded-[16px] card-shadow flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl">{req.name[0]}</div>
                  <div>
                    <h3 className="font-semibold text-[18px]">{req.name}, {req.age}</h3>
                    <p className="text-foreground/70">wants to talk about <span className="font-medium">{req.topic}</span></p>
                  </div>
                </div>
                {requestAction[req.id] ? (
                  <p className="text-foreground/70 font-medium px-4 py-2">{requestAction[req.id]}</p>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setRequestAction({ ...requestAction, [req.id]: "Request declined" })} className="px-6 py-3 border border-border rounded-[12px] font-medium hover:bg-secondary">Decline</button>
                    <button onClick={() => window.location.href = "/pre-call"} className="px-6 py-3 bg-primary text-white rounded-[12px] font-medium hover:bg-primary-hover">Accept</button>
                  </div>
                )}
              </div>
            ))}
            {requests.length === 0 && <p className="text-center text-foreground/60 py-12">No pending requests.</p>}
          </div>
        ) : tab === "My posts" && filteredStories.length === 0 ? (
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
              {filteredStories.map(story => (
                <div key={story.id} className="bg-white p-8 rounded-[16px] card-shadow flex flex-col h-full relative">
                  {story.isNew && <span className="absolute top-6 right-6 bg-accent text-white px-3 py-1 rounded-full text-base font-semibold tracking-wide uppercase">NEW</span>}
                  
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-secondary text-primary text-base font-medium border border-border/50">
                      {story.topic}
                    </span>
                  </div>
                  
                  <p className="font-serif italic text-[24px] leading-relaxed flex-1 mb-8">
                    "{story.quote}"
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl shrink-0">
                        {story.author[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-[16px]">{story.author}, {story.age}</div>
                        {story.credential && <div className="text-foreground/60 text-base">{story.credential}</div>}
                      </div>
                    </div>
                    {role !== "mentor" && (
                      <button 
                        onClick={() => setCallRequests({ ...callRequests, [story.id]: true })}
                        className={`px-4 py-2 rounded-[12px] text-[16px] font-medium transition-colors ${callRequests[story.id] ? "bg-success/10 text-success" : "bg-white border border-border hover:bg-secondary"}`}
                        aria-live="polite"
                      >
                        {callRequests[story.id] ? "Request sent" : "Request a call"}
                      </button>
                    )}
                  </div>
                  {callRequests[story.id] && (
                    <div className="mt-4 text-base text-success font-medium text-right">
                      {story.author} will respond within 2 days.
                    </div>
                  )}
                </div>
              ))}
              {filteredStories.length === 0 && (
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
