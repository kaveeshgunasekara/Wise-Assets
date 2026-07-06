import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import AccessibilityControl from "@/components/AccessibilityControl";
import TopicSelect from "@/components/TopicSelect";

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
  const { role, pendingTopics, setPendingTopics, pendingLanguages, setPendingLanguages } = useApp();
  const [, setLocation] = useLocation();
  const [selectedTopics, setSelectedTopics] = useState<string[]>(pendingTopics);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    pendingLanguages.length > 0 ? pendingLanguages : ["English"],
  );

  const toggleTopic = (t: string) => {
    setSelectedTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleLanguage = (l: string) => {
    setSelectedLanguages((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingTopics(selectedTopics);
    setPendingLanguages(selectedLanguages);
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
              disabled={selectedTopics.length === 0}
              className="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            {selectedTopics.length === 0 && (
              <p className="text-[16px] text-foreground/60 text-center">Choose at least one topic to continue.</p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
