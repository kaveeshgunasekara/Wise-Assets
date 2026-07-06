<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <AppNav />
    <main class="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <div class="text-center mb-10">
        <span class="inline-block px-4 py-2 bg-success/10 text-success rounded-full text-base font-semibold border border-success/20 mb-6">
          Call ended<template v-if="duration"> · {{ duration }}</template>
        </span>
        <h1 class="text-[40px] font-serif text-foreground leading-tight">
          That was a wonderful conversation, {{ name }}.
        </h1>
      </div>

      <div v-if="loadingSummary" class="text-center py-20 text-foreground/60">Summarizing your conversation...</div>

      <template v-else>
        <div class="bg-[#F4F1FC] border border-[#C5BCDF] p-8 sm:p-12 rounded-[16px] card-shadow mb-10 relative">
          <div class="flex items-center gap-2 text-primary font-medium text-base mb-8 border-b border-[#C5BCDF]/50 pb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Our AI wrote this summary from your conversation. Nothing has been saved yet.
          </div>

          <h2 class="text-[20px] font-semibold text-foreground mb-4">{{ title }}</h2>

          <div class="mb-4">
            <label class="block text-base font-medium text-foreground/70 mb-2">Topic</label>
            <select v-model="topic" class="px-4 h-[40px] rounded-[10px] border border-input bg-white text-base">
              <option v-for="t in topics" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <textarea
            v-if="editing"
            v-model="quoteText"
            class="w-full p-4 rounded-xl border border-primary/30 bg-white font-serif italic text-[24px] leading-relaxed mb-6 outline-none focus:ring-2 focus:ring-primary/20 min-h-[160px]"
          />
          <p v-else class="font-serif italic text-[24px] leading-relaxed text-foreground mb-8">
            "{{ quoteText }}"
          </p>

          <div class="flex items-center justify-between">
            <div class="font-medium text-[16px] text-foreground/80">— {{ name }}<span v-if="store.user?.age">, {{ store.user?.age }}</span></div>
            <div v-if="editing" class="flex gap-2">
              <button @click="quoteText = originalQuoteText; editing = false" class="px-4 py-2 border border-border bg-white rounded-lg text-base font-medium">Cancel</button>
              <button @click="editing = false" class="px-4 py-2 bg-primary text-white rounded-lg text-base font-medium">Save</button>
            </div>
          </div>
        </div>

        <div v-if="actionMessage" :class="['p-6 rounded-[12px] text-center font-medium text-[18px] mb-8 border', actionMessage.includes('approval') ? 'bg-primary/5 text-primary border-primary/20' : 'bg-success/5 text-success border-success/20']" aria-live="polite">
          {{ actionMessage }}
          <div class="mt-4">
            <router-link to="/wall" class="text-[16px] underline">Return to Wisdom Wall</router-link>
          </div>
        </div>
        <template v-else>
          <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <button @click="editing = true" class="flex-1 h-[56px] border-2 border-border bg-white text-foreground rounded-[12px] text-[18px] font-medium hover:bg-secondary transition-colors">
              Edit this summary
            </button>
            <button @click="handlePrivate" class="flex-1 h-[56px] border-2 border-border bg-white text-foreground rounded-[12px] text-[18px] font-medium hover:bg-secondary transition-colors">
              Keep it private
            </button>
            <button @click="handleShare" :disabled="sharing" class="flex-1 h-[56px] bg-primary text-white rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors shadow-lg disabled:opacity-60">
              {{ sharing ? "Sharing..." : "Share to Wisdom Wall" }}
            </button>
          </div>
          <p class="text-center text-[16px] text-foreground/60 mb-12">Sharing needs both of you.</p>
        </template>
      </template>

      <div class="flex flex-col items-center gap-6 pt-12 border-t border-border">
        <p v-if="scheduleMessage" class="text-success font-medium text-[18px] flex items-center gap-2" aria-live="polite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Request sent — we'll confirm a time.
        </p>
        <button v-else-if="partnerId" @click="handleScheduleAnother" class="text-primary font-medium text-[18px] hover:underline px-6 py-3 rounded-xl hover:bg-primary/5 transition">
          Schedule another call with {{ partnerName }}
        </button>

        <button @click="reportModal = 1" class="flex items-center gap-2 text-foreground/50 hover:text-foreground transition text-base">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
          Report a problem with this call
        </button>
      </div>
    </main>

    <!-- Report Modal -->
    <div v-if="reportModal > 0" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-[16px] card-shadow max-w-md w-full p-8">
        <template v-if="reportModal === 1">
          <h2 class="text-[24px] font-semibold mb-6">Report a problem</h2>
          <div class="space-y-3 mb-6">
            <label v-for="reason in reportReasons" :key="reason" class="flex items-center gap-3 cursor-pointer text-[16px]">
              <input type="radio" name="storyReportReason" :checked="reportReason === reason" @change="reportReason = reason" class="w-5 h-5 accent-primary" />
              {{ reason }}
            </label>
            <textarea v-if="reportReason === 'Something else'" class="w-full mt-2 p-3 border border-border rounded-lg text-base" placeholder="Please describe..." rows="3"></textarea>
          </div>
          <p class="text-foreground/60 text-base mb-6">{{ partnerName }} won't be notified.</p>
          <div class="flex gap-3 justify-end">
            <button @click="reportModal = 0; reportReason = ''" class="px-4 py-2 font-medium">Cancel</button>
            <button @click="reportModal = 2" :disabled="!reportReason" class="px-6 py-2 bg-[#DC2626] text-white rounded-lg font-medium disabled:opacity-50">Submit report</button>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col items-center text-center py-4">
            <div class="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 class="text-[24px] font-semibold mb-4">Your report has been received.</h2>
            <p class="text-[16px] text-foreground/70 mb-8">Reviewed within 24 hours. You won't be matched with this person again.</p>
            <button @click="reportModal = 0; reportReason = ''" class="w-full px-6 py-3 border border-border rounded-lg font-medium">Close</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { store } from "@/store";
import { TOPICS } from "@/types";
import { getUserById, getStorySummary, createPost, requestCall, logInteraction } from "@/services/api";
import type { User } from "@/types";
import AppNav from "@/components/AppNav.vue";

const route = useRoute();
const topics = TOPICS;

const editing = ref(false);
const actionMessage = ref<string | null>(null);
const scheduleMessage = ref(false);
const reportModal = ref(0);
const reportReason = ref("");
const sharing = ref(false);
const loadingSummary = ref(true);

const partner = ref<User | null>(null);
const title = ref("");
const originalQuoteText = ref("");
const quoteText = ref("");
const topic = ref(topics[0]);

const partnerId = computed(() => (typeof route.query.with === "string" ? route.query.with : ""));
const duration = computed(() => (typeof route.query.duration === "string" ? route.query.duration : ""));

const name = computed(() => store.user?.name ?? "there");
const partnerName = computed(() => partner.value?.name ?? "your conversation partner");

const reportReasons = [
  "Made me uncomfortable",
  "Inappropriate behavior or language",
  "Asked for money or personal details",
  "Not who they said they were",
  "I felt pressured to share my story",
  "Something else",
];

onMounted(async () => {
  if (partnerId.value) {
    partner.value = await getUserById(partnerId.value);
  }
  const sharedTopic = store.user?.topics.find((t) => partner.value?.topics.includes(t));
  topic.value = sharedTopic ?? store.user?.topics[0] ?? topics[0];

  const summary = await getStorySummary(topic.value);
  title.value = summary.title;
  originalQuoteText.value = summary.quote;
  quoteText.value = summary.quote;
  loadingSummary.value = false;
});

async function handleShare() {
  if (!store.user) return;
  sharing.value = true;
  await createPost({
    authorId: store.user.id,
    type: store.role === "mentor" ? "wisdom" : "reflection",
    quote: quoteText.value,
    title: title.value,
    topic: topic.value,
    source: "call",
    status: "pending_approval",
    partnerId: partnerId.value || undefined,
  });
  sharing.value = false;
  actionMessage.value = `Request sent to ${partnerName.value} for approval.`;
}

function handlePrivate() {
  logInteraction("story_kept_private", { partnerId: partnerId.value });
  actionMessage.value = "Saved to your private archive. Only you can see this.";
}

async function handleScheduleAnother() {
  if (!store.user || !partnerId.value) return;
  const intent = store.role === "learner" ? "seek" : "offer";
  await requestCall(store.user.id, partnerId.value, intent, { topic: topic.value });
  scheduleMessage.value = true;
}
</script>
