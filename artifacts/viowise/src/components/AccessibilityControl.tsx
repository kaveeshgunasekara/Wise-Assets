import { useState } from "react";
import { useApp } from "@/hooks/use-app";

interface Props {
  onOpenChange?: (open: boolean) => void;
}

export default function AccessibilityControl({ onOpenChange }: Props) {
  const { textSize, setTextSize, highContrast, setHighContrast } = useApp();
  const [open, setOpen] = useState(false);

  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    // z-[60] creates a stacking context that sits above the Daily iframe (z-0)
    // and its parent header (z-20), ensuring both the button and dropdown are
    // fully interactive even when the iframe is mounted beneath.
    <div className="relative z-[60]">
      <button
        type="button"
        onClick={() => toggle(!open)}
        className="px-4 py-2 bg-white text-primary border border-primary/20 rounded-xl font-medium flex items-center gap-2 min-h-[48px]"
        aria-expanded={open}
        aria-label="Accessibility settings"
      >
        <span>Aa</span> <span className="hidden sm:inline">Accessibility</span>
      </button>

      {open && (
        <>
          {/* Invisible backdrop — catches clicks outside the panel to close it */}
          <div
            className="fixed inset-0 z-[59]"
            onClick={() => toggle(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-border shadow-lg rounded-xl p-4 z-[60]">
            <h3 className="font-semibold text-[16px] mb-3">Text size</h3>
            <div className="flex flex-col gap-2 mb-4">
              {["Standard", "Large", "Extra large"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTextSize(size as "Standard" | "Large" | "Extra large")}
                  className={`text-left px-3 py-2 rounded-lg border ${textSize === size ? "border-primary text-primary bg-primary/5" : "border-transparent hover:bg-secondary"}`}
                >
                  {size} {textSize === size && "✓"}
                </button>
              ))}
            </div>
            <h3 className="font-semibold text-[16px] mb-3">High contrast</h3>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`w-full text-left px-3 py-2 rounded-lg border ${highContrast ? "border-primary text-primary bg-primary/5" : "border-border hover:bg-secondary"}`}
            >
              {highContrast ? "On ✓" : "Off"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
