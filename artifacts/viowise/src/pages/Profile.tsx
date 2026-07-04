import { useState } from "react";
import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";

export default function Profile() {
  const { role, user, setUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(user?.topics || []);

  const topics = ["Career", "Family", "Migration", "Health", "Confidence", "Study", "Relationships", "Resilience"];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ ...user, topics: selectedTopics });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-[40px] font-serif text-foreground mb-8">Your Profile</h1>
        
        <form onSubmit={handleSave} className="space-y-10">
          <div className="bg-white p-8 rounded-[16px] card-shadow">
            <h2 className="text-[20px] font-semibold mb-6">Topics <span className="text-foreground/50 ml-2 font-normal" aria-live="polite">{selectedTopics.length} selected</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topics.map(t => {
                const isSelected = selectedTopics.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTopic(t)}
                    className={`h-24 rounded-[12px] border-2 flex flex-col items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary text-foreground/70"}`}
                  >
                    <span className="font-medium text-[16px]">{t}</span>
                    {isSelected && (
                      <svg className="mt-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[16px] card-shadow space-y-6">
            <div>
              <label className="block text-[16px] font-medium mb-2">Display name</label>
              <input type="text" className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue={user?.name || (role === "mentor" ? "Grace" : "Sam")} />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">One-line life experience</label>
              <input type="text" className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue={role === "mentor" ? "Rebuilt nursing career after moving from the Philippines." : "International student figuring it out."} />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Languages (comma separated)</label>
              <input type="text" className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" defaultValue={role === "mentor" ? "English, Tagalog" : "English, Mandarin"} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button type="submit" className="px-8 bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors">
              Save changes
            </button>
            {saved && (
              <span className="text-success font-medium flex items-center gap-2" aria-live="polite">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Profile updated.
              </span>
            )}
          </div>
          <p className="text-foreground/60 text-[16px]">Your matches update automatically when your profile changes.</p>
        </form>
      </main>
    </div>
  );
}
