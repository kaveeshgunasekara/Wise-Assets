import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";
import TopicSelect from "@/components/TopicSelect";
import { getUserById, updateUser } from "@/services/api";
import { AGE_ROLE_EXPLANATION, MENTOR_MIN_AGE, roleForAge } from "@/lib/age-role";

export default function Profile() {
  const { user, setUser } = useApp();

  const [selectedTopics, setSelectedTopics] = useState<string[]>(user?.topics ?? []);
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [ageInput, setAgeInput] = useState(user?.age ? String(user.age) : "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [languagesInput, setLanguagesInput] = useState((user?.languages ?? []).join(", "));
  const [availabilityInput, setAvailabilityInput] = useState((user?.availability ?? []).join(", "));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);

  // Fetch the latest profile from the DB on mount so the form always shows
  // the current saved state — not just what was last in React context.
  useEffect(() => {
    if (!user?.id) return;
    getUserById(user.id).then((fresh) => {
      if (!fresh) return;
      setUser(fresh);
      setSelectedTopics(fresh.topics ?? []);
      setDisplayName(fresh.name ?? "");
      setAgeInput(fresh.age ? String(fresh.age) : "");
      setBio(fresh.bio ?? "");
      setLanguagesInput((fresh.languages ?? []).join(", "));
      setAvailabilityInput((fresh.availability ?? []).join(", "));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Role always follows age here too — editing age in Profile updates the
  // role that will be saved, so the two can never fall out of sync.
  const ageNumber = Number(ageInput);
  const derivedRole = roleForAge(ageNumber);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!derivedRole) {
      setAgeError("Please enter a valid age so we know whether you're a mentor or learner.");
      return;
    }
    setAgeError(null);
    setSaving(true);

    const updates = {
      name: displayName,
      topics: selectedTopics,
      age: ageNumber,
      role: derivedRole,
      bio,
      languages: languagesInput.split(",").map((l) => l.trim()).filter(Boolean),
      availability: availabilityInput.split(",").map((a) => a.trim()).filter(Boolean),
    };
    const updated = await updateUser(user.id, updates);
    setUser(updated ?? { ...user, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
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
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Age</label>
              <input
                type="number"
                required
                min={13}
                max={120}
                value={ageInput}
                onChange={(e) => { setAgeInput(e.target.value); setAgeError(null); }}
                placeholder="Your age"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
              <p className="mt-2 text-[14px] text-foreground/60">{AGE_ROLE_EXPLANATION}</p>
              {derivedRole && (
                <p className="mt-3 flex items-center gap-3 text-[16px]" aria-live="polite">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-serif text-sm" aria-hidden="true">
                    {derivedRole === "mentor" ? "M" : "L"}
                  </span>
                  <span className="text-foreground/80">
                    You're a{" "}
                    <span className="font-medium text-foreground">
                      {derivedRole === "mentor" ? "Mentor" : "Learner"}
                    </span>
                    {user.role !== derivedRole && " — saving will update your role to match your age."}
                  </span>
                </p>
              )}
              {ageError && (
                <p className="mt-3 text-[16px] text-destructive" role="alert">{ageError}</p>
              )}
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">One-line life experience</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Retired nurse, 35 years in paediatrics"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Languages (comma-separated)</label>
              <input
                type="text"
                value={languagesInput}
                onChange={(e) => setLanguagesInput(e.target.value)}
                placeholder="e.g. English, Mandarin"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-[16px] font-medium mb-2">Availability (comma-separated)</label>
              <input
                type="text"
                value={availabilityInput}
                onChange={(e) => setAvailabilityInput(e.target.value)}
                placeholder="e.g. Weekday mornings, Weekend afternoons"
                className="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="submit"
              disabled={saving}
              className="px-8 bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
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
