export const CANONICAL_TOPICS = [
  "Career",
  "Family",
  "Migration",
  "Health",
  "Confidence",
  "Study",
  "Relationships",
  "Resilience",
];

interface TopicSelectProps {
  selected: string[];
  onToggle: (topic: string) => void;
  showCount?: boolean;
}

// Shared multi-select topic grid — used on both the Profile page and the
// onboarding topic-selection step so the pattern (and its markup) only
// lives in one place.
export default function TopicSelect({ selected, onToggle, showCount = true }: TopicSelectProps) {
  return (
    <div>
      {showCount && (
        <h2 className="text-[20px] font-semibold mb-6">
          Topics <span className="text-foreground/50 ml-2 font-normal" aria-live="polite">{selected.length} selected</span>
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CANONICAL_TOPICS.map((t) => {
          const isSelected = selected.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggle(t)}
              aria-pressed={isSelected}
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
  );
}
