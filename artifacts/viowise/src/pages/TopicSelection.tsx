import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import AccessibilityControl from "@/components/AccessibilityControl";
import TopicSelect from "@/components/TopicSelect";
import { supabase } from "@/services/supabase";
import { getUserById, updateUser } from "@/services/api";
import { isAgeRoleConsistent } from "@/lib/age-role";

const LANGUAGE_OPTIONS = [
  "English",
  "Mandarin",
  "Spanish",
  "Tagalog",
  "Arabic",
  "Hindi",
  "Portuguese",
  "French",
  "Vietnamese",
  "Korean",
];

export default function TopicSelection() {
  const {
    role,
    pendingName,
    pendingEmail,
    pendingAge,
    pendingPassword,
    setPendingName,
    setPendingEmail,
    setPendingAge,
    setPendingPassword,
    pendingTopics,
    setPendingTopics,
    pendingLanguages,
    setPendingLanguages,
    setUser,
    setRole,
  } = useApp();
  const [, setLocation] = useLocation();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(pendingTopics);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    pendingLanguages.length > 0 ? pendingLanguages : ["English"],
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleLanguage = (l: string) => {
    setSelectedLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("We lost track of whether you're a mentor or learner. Please start sign-up again.");
      return;
    }
    // Final guard before creating the account: age and role must still agree.
    // This should be unreachable in the normal flow (role is always derived
    // from age on the sign-up step), but we never let a mismatched profile
    // get created even if pendingAge was somehow changed after that step.
    if (!isAgeRoleConsistent(Number(pendingAge), role)) {
      setError(
        "VIOWISE connects mentors (60+) who share wisdom with learners (under 60) who seek it. " +
          "Your age and role don't match — please go back and re-enter your age.",
      );
      return;
    }
    setError(null);
    setCreating(true);

    // Create the Supabase Auth user. Our handle_new_user() DB trigger runs
    // immediately (same transaction) and inserts the corresponding row into
    // the public.users table using the metadata supplied here.
    // Do NOT separately insert into public.users — the trigger does it.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: pendingEmail,
      password: pendingPassword,
      options: {
        data: {
          name: pendingName || "New member",
          age: Number(pendingAge) || 0,
          role,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setCreating(false);
      return;
    }

    // If email confirmation is required, session will be null.
    if (!authData.session) {
      setError(
        "Check your email to confirm your account, then sign in below.",
      );
      setCreating(false);
      return;
    }

    // The trigger has already inserted the profile row with name + role.
    // Fetch it to confirm existence, then immediately update it with the
    // rest of the onboarding selections so the full profile is persisted
    // before we navigate anywhere.
    const profile = await getUserById(authData.user!.id);
    if (profile) {
      const updated = await updateUser(authData.user!.id, {
        topics: selectedTopics,
        languages: selectedLanguages,
        age: Number(pendingAge) || 0,
        availability: [],
        bio: "",
      });
      setUser(updated ?? profile);
      setRole((updated ?? profile).role);
    }

    // Clear all onboarding state (password first — don't hold it longer than needed).
    setPendingPassword("");
    setPendingName("");
    setPendingEmail("");
    setPendingAge("");
    setPendingTopics([]);
    setPendingLanguages([]);
    setCreating(false);
    setLocation("/verified");
  };

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          VIOWISE
        </Link>
        <AccessibilityControl />
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white p-8 rounded-[16px] card-shadow w-full max-w-2xl">
          <p className="text-primary text-[16px] uppercase tracking-widest font-semibold mb-2">Step 3 of 4</p>
          <h1 className="text-[40px] font-serif text-foreground mb-4 leading-tight">
            What matters to you?
          </h1>
          <p className="text-[18px] text-foreground/80 mb-8">
            {role === "mentor"
              ? "Choose the topics you can speak to and the languages you're comfortable in. This shapes who we match you with."
              : "Choose what you'd like guidance on and the languages you speak. This personalizes your wall and matches from the start."}
          </p>

          <form className="space-y-8" onSubmit={handleContinue}>
            <TopicSelect selected={selectedTopics} onToggle={toggleTopic} />

            <div>
              <h2 className="text-[20px] font-semibold mb-4">
                Languages <span className="text-foreground/50 ml-2 font-normal" aria-live="polite">{selectedLanguages.length} selected</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {LANGUAGE_OPTIONS.map((l) => {
                  const isSelected = selectedLanguages.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleLanguage(l)}
                      aria-pressed={isSelected}
                      className={`px-4 py-2 rounded-full border text-[16px] font-medium transition-colors ${isSelected ? "bg-primary/10 border-primary text-primary" : "border-border bg-white text-foreground/70 hover:border-primary/50"}`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedTopics.length === 0 || creating}
              className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating your account..." : "Continue"}
            </button>
            {selectedTopics.length === 0 && (
              <p className="text-[16px] text-foreground/60 text-center">Choose at least one topic to continue.</p>
            )}
            {error && (
              <p className="text-[16px] text-destructive text-center" role="alert">{error}</p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
