import { useState } from "react";
import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";
import TopicSelect from "@/components/TopicSelect";
import { updateUser } from "@/services/api";

export default function Profile() {
  const { user, setUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(user?.topics || []);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [languagesInput, setLanguagesInput] = useState((user?.languages || []).join(", "));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updates = {
      name: displayName,
      topics: selectedTopics,
      bio,
      languages: languagesInput
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    };
    const updated = await updateUser(user.id, updates);
    setUser(updated ?? { ...user, ...updates });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-[40px] font-serif text-foreground mb-8">Your Profile</h1>
        
        <form onSubmit={handleSave} className="space-y-10">
          <div className="bg-white p-8 rounded-[16px] card-shadow">
            <TopicSelect selected={selectedTopics} onToggle={toggleTopic} />
          </div>

          <div className="bg-white p-8 rounded-[16px] card-shadow space-y-6">
            <div>
              <label className="block text-[16px] font-medium mb-2">Display name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">One-line life experience</label>
              <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Languages (comma separated)</label>
              <input type="text" value={languagesInput} onChange={(e) => setLanguagesInput(e.target.value)} className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
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
