import { useState, useEffect } from "react";

const SPLASH_KEY = "vw:splash";

type Phase = "visible" | "fading" | "done";

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>(() =>
    sessionStorage.getItem(SPLASH_KEY) ? "done" : "visible",
  );

  useEffect(() => {
    if (phase !== "visible") return;
    sessionStorage.setItem(SPLASH_KEY, "1");
  }, [phase]);

  const startFade = () => {
    setPhase("fading");
    setTimeout(() => setPhase("done"), 700);
  };

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 700ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={startFade}
        onError={startFade}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      >
        <source src="/intro-video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
