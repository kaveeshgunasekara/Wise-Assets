import { reactive, watch } from "vue";
import type { User, Role, TextSize } from "@/types";

export interface PendingSignup {
  name: string;
  email: string;
  role: Role;
  topics: string[];
  languages: string[];
}

export const store = reactive({
  role: null as Role | null,
  user: null as User | null,
  textSize: "Standard" as TextSize,
  highContrast: false,
  pendingSignup: null as PendingSignup | null,
  subtitlesConsent: true,
  storyCaptureConsent: true,

  setRole(role: Role | null) {
    this.role = role;
  },
  setUser(user: User | null) {
    this.user = user;
  },
  setTextSize(size: TextSize) {
    this.textSize = size;
  },
  setHighContrast(high: boolean) {
    this.highContrast = high;
  },
  setPendingSignup(signup: PendingSignup | null) {
    this.pendingSignup = signup;
  },
  setSubtitlesConsent(on: boolean) {
    this.subtitlesConsent = on;
  },
  setStoryCaptureConsent(on: boolean) {
    this.storyCaptureConsent = on;
  },
  signOut() {
    this.user = null;
    this.role = null;
    this.pendingSignup = null;
  },
});

watch(
  () => store.textSize,
  (size) => {
    let multiplier = 1;
    if (size === "Large") multiplier = 1.15;
    if (size === "Extra large") multiplier = 1.3;
    document.documentElement.style.setProperty("--text-size-multiplier", multiplier.toString());
  }
);

watch(
  () => store.highContrast,
  (high) => {
    if (high) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }
);
