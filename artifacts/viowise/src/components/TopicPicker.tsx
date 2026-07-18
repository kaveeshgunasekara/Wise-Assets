import { ALLOWED_TOPICS } from "@/lib/topics";

interface Props {
  value: string;
  onChange: (topic: string) => void;
  compact?: boolean;
}

export default function TopicPicker({ value, onChange, compact = false }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALLOWED_TOPICS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-full border font-medium transition-colors ${
            compact ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]"
          } ${
            value === t
              ? "bg-[#EDE8FA] border-primary text-primary"
              : "bg-white border-border/70 text-foreground/60 hover:border-primary/50 hover:text-primary hover:bg-[#F4F1FC]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
