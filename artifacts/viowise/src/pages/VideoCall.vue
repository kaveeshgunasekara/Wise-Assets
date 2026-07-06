<template>
  <div class="h-screen w-full text-white flex flex-col relative overflow-hidden" style="background: linear-gradient(to bottom, #17141F, #1C1730)">

    <!-- Header -->
    <header class="absolute top-0 w-full p-6 flex justify-between items-start z-20" style="background: linear-gradient(to bottom, rgba(23,20,31,0.8), transparent)">
      <div>
        <h1 class="text-[20px] font-medium drop-shadow-md">Call with {{ partnerName }}</h1>
        <div class="text-[18px] opacity-80 font-mono mt-1 drop-shadow-md">{{ formatTime(timer) }}</div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="[&_button]:bg-white/10 [&_button]:border-white/20">
          <AccessibilityControl />
        </div>
        <div :class="['px-3 py-1.5 rounded-full text-base font-medium border', subtitlesOn ? 'bg-white/20 border-white/30' : 'bg-black/40 border-white/10']">
          Live subtitles: {{ subtitlesOn ? 'On' : 'Off' }}
        </div>
        <div :class="['px-3 py-1.5 rounded-full text-base font-medium flex items-center gap-1.5 border', storyCaptureOn ? 'bg-[#A594E8]/20 border-[#A594E8]/40 text-[#A594E8]' : 'bg-black/40 border-white/10 text-white/70']">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          Story capture {{ storyCaptureOn ? 'on' : 'off' }}
        </div>
      </div>
    </header>

    <!-- Main Video Area -->
    <div class="absolute inset-0 flex items-center justify-center bg-[#2A2438]">
      <div class="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center font-serif text-6xl text-white/70">
        {{ partnerName[0] }}
      </div>
    </div>

    <!-- Self View -->
    <div class="absolute top-24 right-6 w-32 h-48 bg-black/60 rounded-[12px] border border-white/20 overflow-hidden shadow-2xl z-20 flex flex-col justify-end p-2 backdrop-blur-sm">
      <div class="text-white/80 text-base font-medium px-2 py-1 bg-black/40 rounded w-max">You</div>
    </div>

    <!-- Prompt Card -->
    <div v-if="promptVisible" class="absolute top-24 left-6 max-w-xs bg-white/10 backdrop-blur-md border border-white/20 rounded-[16px] p-4 shadow-2xl z-20">
      <p class="font-serif italic text-[18px] mb-3">"{{ prompts[promptIndex] }}"</p>
      <div class="flex gap-2">
        <button @click="promptIndex = (promptIndex + 1) % prompts.length" class="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-base font-medium transition">New question</button>
        <button @click="promptVisible = false" class="px-3 py-1.5 hover:bg-white/10 rounded-lg text-base font-medium transition">Hide</button>
      </div>
    </div>
    <button v-else @click="promptVisible = true" class="absolute top-24 left-6 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl z-20 text-base font-medium">
      Show prompt
    </button>

    <!-- Subtitles Area -->
    <div v-if="subtitlesOn" class="absolute bottom-32 left-0 right-0 flex justify-center px-6 z-20 pointer-events-none">
      <div class="bg-black/60 backdrop-blur-md border border-white/10 rounded-[16px] p-4 max-w-2xl w-full text-center shadow-2xl transition-all duration-500">
        <p class="text-[20px] font-medium leading-relaxed">{{ subtitleLines[subIndex] }}</p>
      </div>
    </div>

    <!-- Controls Footer -->
    <footer class="absolute bottom-0 w-full p-6 flex justify-center items-end gap-6 z-20 pt-32" style="background: linear-gradient(to top, #17141F, transparent)">
      <button
        @click="muted = !muted"
        :aria-label="muted ? 'Unmute microphone' : 'Mute microphone'"
        :aria-pressed="muted"
        class="flex flex-col items-center gap-2 group"
      >
        <div :class="['w-16 h-16 rounded-full border flex items-center justify-center transition', muted ? 'bg-white/30 border-white/40' : 'bg-white/10 hover:bg-white/20 border-white/20']">
          <svg v-if="muted" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </div>
        <span class="text-base font-medium opacity-80 group-hover:opacity-100">{{ muted ? 'Unmute' : 'Mute' }}</span>
      </button>

      <button
        @click="cameraOff = !cameraOff"
        :aria-label="cameraOff ? 'Turn camera on' : 'Turn camera off'"
        :aria-pressed="cameraOff"
        class="flex flex-col items-center gap-2 group"
      >
        <div :class="['w-16 h-16 rounded-full border flex items-center justify-center transition', cameraOff ? 'bg-white/30 border-white/40' : 'bg-white/10 hover:bg-white/20 border-white/20']">
          <svg v-if="cameraOff" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </div>
        <span class="text-base font-medium opacity-80 group-hover:opacity-100">{{ cameraOff ? 'Camera off' : 'Camera' }}</span>
      </button>

      <button @click="handleEndCall" class="flex flex-col items-center gap-2 group">
        <div class="w-16 h-16 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] flex items-center justify-center transition shadow-lg shadow-red-900/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
        </div>
        <span class="text-base font-medium text-red-400">End call</span>
      </button>

      <button @click="reportModal = 1" class="flex flex-col items-center gap-2 group absolute right-6 bottom-6">
        <div class="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
        </div>
        <span class="text-base font-medium opacity-60 group-hover:opacity-100">Report</span>
      </button>
    </footer>

    <!-- Report Modal -->
    <div v-if="reportModal > 0" class="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-black">
      <div class="bg-white rounded-[16px] max-w-md w-full p-8 shadow-2xl">
        <template v-if="reportModal === 1">
          <h2 class="text-[24px] font-semibold mb-6">Report this call</h2>
          <div class="space-y-3 mb-6">
            <label v-for="r in reportReasons" :key="r" class="flex items-center gap-4 p-4 border border-border rounded-[12px] cursor-pointer hover:bg-secondary/50 transition">
              <input type="radio" name="report" :value="r" @change="reportReason = r" :checked="reportReason === r" class="w-5 h-5 accent-[#DC2626]" />
              <span class="text-[16px] font-medium">{{ r }}</span>
            </label>
            <textarea v-if="reportReason === 'Something else'" class="w-full mt-2 p-3 border border-border rounded-lg text-base" placeholder="Please describe..." rows="3"></textarea>
          </div>
          <p class="text-foreground/60 text-base mb-6">{{ partnerName }} won't be notified.</p>
          <div class="flex gap-3 justify-end">
            <button @click="reportModal = 0" class="px-4 py-2 font-medium">Cancel</button>
            <button @click="reportModal = 2" :disabled="!reportReason" class="px-6 py-2 bg-[#DC2626] text-white rounded-lg font-medium disabled:opacity-50">Submit report</button>
          </div>
        </template>
        <template v-else>
          <div class="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 class="text-[24px] font-semibold mb-4">Your report has been received.</h2>
          <p class="text-[16px] text-foreground/70 mb-8">Reviewed within 24 hours. You won't be matched with this person again.</p>
          <div class="flex flex-col gap-3">
            <button @click="handleEndCall" class="w-full px-6 py-3 bg-[#DC2626] text-white rounded-lg font-medium">End call now</button>
            <button @click="reportModal = 0" class="w-full px-6 py-3 border border-border rounded-lg font-medium">Continue the call</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { store } from "@/store";
import { getUserById, logInteraction } from "@/services/api";
import type { User } from "@/types";
import AccessibilityControl from "@/components/AccessibilityControl.vue";

const router = useRouter();
const route = useRoute();
const timer = ref(0);
const subIndex = ref(0);
const promptIndex = ref(0);
const promptVisible = ref(true);
const reportModal = ref(0);
const reportReason = ref("");
const muted = ref(false);
const cameraOff = ref(false);
const partner = ref<User | null>(null);

const subtitlesOn = computed(() => store.subtitlesConsent);
const storyCaptureOn = computed(() => store.storyCaptureConsent);

const partnerId = computed(() => (typeof route.query.with === "string" ? route.query.with : ""));
const partnerName = computed(() => partner.value?.name ?? "your conversation partner");

const subtitleLines = computed(() => [
  `${partnerName.value}: Thank you for taking the time to talk with me today.`,
  `You: I'm glad we connected — I've been looking forward to this.`,
  `${partnerName.value}: What's been on your mind lately?`,
  `You: There's something I've been trying to work through.`,
]);

const prompts = [
  "What advice would you give your younger self?",
  "Tell me about a time you had to start over.",
  "What's the hardest lesson you learned in your career?",
  "How did you know when it was time to make a change?",
];

const reportReasons = ["Made me uncomfortable", "Inappropriate behavior or language", "Asked for money or personal details", "Not who they said they were", "Something else"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function handleEndCall() {
  logInteraction("call_ended", { partnerId: partnerId.value, durationSeconds: timer.value });
  if (store.storyCaptureConsent) {
    router.push(`/story-capture?with=${partnerId.value}&duration=${encodeURIComponent(formatTime(timer.value))}`);
  } else {
    router.push("/wall");
  }
}

let timerInterval: ReturnType<typeof setInterval>;
let subInterval: ReturnType<typeof setInterval>;

onMounted(async () => {
  if (partnerId.value) {
    partner.value = await getUserById(partnerId.value);
  }
  logInteraction("call_started", { partnerId: partnerId.value });
  timerInterval = setInterval(() => { timer.value += 1; }, 1000);
  subInterval = setInterval(() => {
    if (reportModal.value === 0) {
      subIndex.value = (subIndex.value + 1) % subtitleLines.value.length;
    }
  }, 6000);
});

onUnmounted(() => {
  clearInterval(timerInterval);
  clearInterval(subInterval);
});
</script>
