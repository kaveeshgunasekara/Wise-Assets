import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import AppNav from "@/components/AppNav";

function buildTimeSlots(): string[] {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = Math.ceil(totalMinutes / 30) * 30;
  const endMinutes = 21 * 60 + 30; // 9:30 PM

  const slots: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push(`${h12}:${min.toString().padStart(2, "0")} ${ampm}`);
  }
  return slots;
}

function formatTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ScheduleCall() {
  const [, setLocation] = useLocation();
  const slots = useMemo(buildTimeSlots, []);
  const todayLabel = useMemo(formatTodayLabel, []);

  const [selected, setSelected] = useState<string | null>(slots[0] ?? null);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-10 sm:py-16">

        {!confirmed ? (
          /* ── Step 1: Select a time slot ──────────────────────────────── */
          <div className="w-full max-w-lg">
            {/* Page heading */}
            <div className="text-center mb-8">
              <p className="text-primary text-[13px] font-semibold uppercase tracking-[0.14em] mb-3">
                Almost there
              </p>
              <h1 className="font-serif text-[36px] sm:text-[42px] leading-tight text-foreground">
                Schedule your call
              </h1>
              <p className="mt-3 text-[16px] text-foreground/60">
                Pick a time that works for you. Your match will be notified.
              </p>
            </div>

            <div className="bg-white rounded-[24px] card-shadow p-6 sm:p-8">

              {/* Date row — always today, no picker */}
              <div className="flex items-center gap-3 mb-7 pb-6 border-b border-border">
                <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground/40 mb-0.5">Date</p>
                  <p className="text-[17px] font-semibold text-foreground">Today, {todayLabel}</p>
                </div>
              </div>

              {/* Time slot picker */}
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-foreground/40 mb-4">
                Available times
              </p>

              {slots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[16px] text-foreground/55 mb-2">No more slots today.</p>
                  <p className="text-[14px] text-foreground/40">You can still join immediately.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-8">
                  {slots.map((slot) => {
                    const isSelected = selected === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelected(slot)}
                        aria-pressed={isSelected}
                        className={`
                          py-2.5 rounded-[12px] border text-[14px] font-medium
                          transition-all duration-150
                          ${isSelected
                            ? "bg-primary/10 border-primary text-primary ring-2 ring-primary/20"
                            : "bg-white border-border text-foreground/70 hover:border-primary/40 hover:text-foreground hover:bg-primary/5"
                          }
                        `}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 30-min duration note */}
              <div className="flex items-center gap-2 text-[13px] text-foreground/45 mb-6">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                30-minute session
              </div>

              {/* Confirm button */}
              <button
                onClick={() => { if (selected || slots.length === 0) setConfirmed(true); }}
                disabled={slots.length > 0 && !selected}
                className="w-full py-3.5 bg-primary text-white rounded-[14px] text-[17px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-40"
              >
                Confirm time{selected ? ` — ${selected}` : ""}
              </button>

            </div>

            {/* Skip link */}
            <p className="text-center mt-5 text-[14px] text-foreground/45">
              Want to connect right now?{" "}
              <button
                onClick={() => setLocation("/pre-call")}
                className="text-primary font-medium hover:underline"
              >
                Join immediately
              </button>
            </p>
          </div>

        ) : (
          /* ── Step 2: Confirmed ────────────────────────────────────────── */
          <div className="w-full max-w-md text-center">

            {/* Success icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2D8B4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>

            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2D8B4E] mb-3">
              All set
            </p>
            <h1 className="font-serif text-[36px] sm:text-[40px] leading-tight text-foreground mb-3">
              Call scheduled
            </h1>

            {/* Date + time pill */}
            <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-full px-5 py-2 mb-8">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-[15px] font-semibold text-primary">
                Today at {selected ?? "your chosen time"}
              </span>
            </div>

            <div className="bg-white rounded-[20px] card-shadow p-6 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.54 19.79 19.79 0 0 1 1.61 2.9 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.74a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.09z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-foreground mb-0.5">Your call link is ready</p>
                  <p className="text-[13px] text-foreground/55">
                    You can join now or return at {selected ?? "your scheduled time"}. The room will be waiting for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Join now CTA */}
            <button
              onClick={() => setLocation("/pre-call")}
              className="w-full py-4 bg-primary text-white rounded-[14px] text-[17px] font-semibold hover:bg-primary-hover transition-colors mb-3"
            >
              Join call now
            </button>

            <Link
              href="/wall"
              className="block text-[14px] text-foreground/50 hover:text-foreground/70 transition-colors py-1"
            >
              Return to Wisdom Wall
            </Link>

          </div>
        )}

      </main>
    </div>
  );
}
