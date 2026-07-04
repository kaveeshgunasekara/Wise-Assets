import AppNav from "@/components/AppNav";
import { useApp } from "@/hooks/use-app";
import { useState } from "react";
import { Link } from "wouter";

export default function AIMatching() {
  const { role } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

  const matchesForLearner = [
    { id: "1", name: "Grace", age: 72, bio: "Rebuilt nursing career after moving from the Philippines.", shared: ["Career", "Migration"], percent: 92, reason: "You both chose Career and Migration — Grace rebuilt her career after moving countries, the journey you're starting." },
    { id: "2", name: "Rosa", age: 66, bio: "Retired professor who learned how to learn late.", shared: ["Study", "Resilience"], percent: 87, reason: "You're dealing with academic stress; Rosa has extensive experience turning academic failures into growth." },
    { id: "3", name: "Ahmed", age: 68, bio: "Engineer who changed careers at 45.", shared: ["Career"], percent: 81, reason: "Ahmed understands the pressure of high-stakes career decisions." },
  ];

  const matchesForMentor = [
    { id: "4", name: "Sam", age: 21, bio: "International student dealing with career anxiety.", shared: ["Career", "Migration"], percent: 92, reason: "Sam is starting the career journey you've already lived, dealing with identical pressures." },
    { id: "5", name: "Elena", age: 24, bio: "Recent grad reconsidering her major.", shared: ["Career"], percent: 85, reason: "Your experience starting over later in life provides perfect perspective for her early-career doubts." },
  ];

  const matches = role === "mentor" ? matchesForMentor : matchesForLearner;

  return (
    <div className="min-h-screen bg-pattern flex flex-col">
      <AppNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[40px] font-serif text-foreground leading-tight">Your matches</h1>
            <p className="text-[18px] text-foreground/80 mt-2">Ranked by our AI — you choose.</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-2 bg-secondary text-primary rounded-full text-sm font-medium border border-border">Updated just now</span>
          </div>
        </div>

        <p className="text-foreground/70 mb-8 max-w-2xl">
          Your matches update automatically as you use VIOWISE — new topics, wisdom you read, and calls you enjoy all improve your ranking.
        </p>

        <div className="space-y-6 mb-12">
          {matches.map(m => (
            <div key={m.id} className="bg-white p-6 rounded-[16px] card-shadow border border-border">
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-2xl relative shrink-0">
                    {m.name[0]}
                    <div className="absolute -bottom-1 -right-1 bg-success text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" title="ID Verified">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-[20px] font-semibold">{m.name}, {m.age}</h2>
                    <p className="text-[16px] text-foreground/80 mt-1">{m.bio}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.shared.map(t => (
                        <span key={t} className="px-3 py-1 bg-[#F4F1FC] border border-[#C5BCDF] text-primary rounded-full text-sm font-medium flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          Shared {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 sm:w-48 shrink-0 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-[24px] font-semibold text-primary">{m.percent}%</span>
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 relative">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray="113" strokeDashoffset={113 - (113 * m.percent) / 100} />
                      </svg>
                    </div>
                  </div>
                  <Link href="/pre-call" className="w-full text-center px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover transition-colors">
                    Schedule a call
                  </Link>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <button 
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  className="flex items-center gap-2 text-primary font-medium text-[16px] hover:underline"
                  aria-expanded={expanded === m.id}
                >
                  See why {expanded === m.id ? '↑' : '↓'}
                </button>
                {expanded === m.id && (
                  <p className="mt-3 text-[16px] text-foreground/80 bg-secondary/50 p-4 rounded-[12px]">
                    {m.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[18px] text-foreground/60 font-medium">
          A person, not an algorithm, has the final say on your connections: you.
        </p>
      </main>
    </div>
  );
}
