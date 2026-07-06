<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <AppNav />
    <main class="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 class="text-[40px] font-serif text-foreground leading-tight">Your matches</h1>
          <p class="text-[18px] text-foreground/80 mt-2">Ranked by our AI — you choose.</p>
        </div>
        <div class="text-right">
          <span class="inline-block px-4 py-2 bg-secondary text-primary rounded-full text-base font-medium border border-border">Updated just now</span>
        </div>
      </div>

      <p class="text-foreground/70 mb-8 max-w-2xl">
        Your matches update automatically as you use VIOWISE — new topics, wisdom you read, and calls you enjoy all improve your ranking.
      </p>

      <div v-if="loading" class="text-center py-20 text-foreground/60">Finding your matches...</div>

      <div v-else-if="matches.length === 0" class="text-center py-20 bg-white rounded-[16px] border border-border">
        <p class="text-[18px] text-foreground/60">No matches yet — complete your profile to find people.</p>
        <router-link to="/profile" class="mt-4 inline-block text-primary font-medium hover:underline">Update your profile</router-link>
      </div>

      <div v-else class="space-y-6 mb-12">
        <div v-for="m in matches" :key="m.user.id" class="bg-white p-6 rounded-[16px] card-shadow border border-border">
          <div class="flex flex-col sm:flex-row gap-6 justify-between items-start">
            <div class="flex gap-4">
              <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-2xl relative shrink-0">
                {{ m.user.name[0] }}
                <div class="absolute -bottom-1 -right-1 bg-success text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" title="ID Verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <div>
                <h2 class="text-[20px] font-semibold">{{ m.user.name }}<span v-if="m.user.age">, {{ m.user.age }}</span></h2>
                <p v-if="m.user.bio" class="text-[16px] text-foreground/80 mt-1">{{ m.user.bio }}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <span v-for="t in m.sharedTopics" :key="t" class="px-3 py-1 bg-[#F4F1FC] border border-[#C5BCDF] text-primary rounded-full text-base font-medium flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Shared {{ t }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-end gap-4 sm:w-48 shrink-0 w-full">
              <div class="flex items-center gap-3">
                <span class="text-[24px] font-semibold text-primary">{{ m.percent }}%</span>
                <div class="w-12 h-12 rounded-full border-4 border-primary/20 relative">
                  <svg class="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" stroke-width="4" class="text-primary" :stroke-dasharray="113" :stroke-dashoffset="113 - (113 * m.percent) / 100" />
                  </svg>
                </div>
              </div>
              <button
                @click="handleRequestCall(m.user.id)"
                :class="['w-full text-center px-6 py-3 rounded-[12px] text-[16px] font-medium transition-colors', alreadyRequested(m.user.id) ? 'bg-success/10 text-success' : 'bg-primary text-white hover:bg-primary-hover']"
              >
                {{ alreadyRequested(m.user.id) ? 'Request sent' : (store.role === 'mentor' ? 'Offer a call' : 'Request a call') }}
              </button>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-border">
            <button
              @click="toggleExpanded(m.user.id)"
              class="flex items-center gap-2 text-primary font-medium text-[16px] hover:underline"
              :aria-expanded="expanded === m.user.id"
            >
              See why {{ expanded === m.user.id ? '↑' : '↓' }}
            </button>
            <p v-if="expanded === m.user.id" class="mt-3 text-[16px] text-foreground/80 bg-secondary/50 p-4 rounded-[12px]">
              {{ reasons[m.user.id] ?? "Loading..." }}
            </p>
          </div>
        </div>
      </div>

      <p class="text-center text-[18px] text-foreground/60 font-medium">
        A person, not an algorithm, has the final say on your connections: you.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { store } from "@/store";
import * as api from "@/services/api";
import type { Match, CallRequest } from "@/types";
import AppNav from "@/components/AppNav.vue";

const expanded = ref<string | null>(null);
const matches = ref<Match[]>([]);
const requests = ref<CallRequest[]>([]);
const loading = ref(true);
const reasons = reactive<Record<string, string>>({});

onMounted(async () => {
  if (!store.user) {
    loading.value = false;
    return;
  }
  const [m, r] = await Promise.all([api.getMatches(store.user.id), api.getRequests(store.user.id)]);
  matches.value = m;
  requests.value = r;
  loading.value = false;
});

async function toggleExpanded(userId: string) {
  if (expanded.value === userId) {
    expanded.value = null;
    return;
  }
  expanded.value = userId;
  if (!reasons[userId] && store.user) {
    const match = matches.value.find((m) => m.user.id === userId);
    if (match) {
      reasons[userId] = await api.getMatchReason(store.user, match.user);
    }
  }
}

function alreadyRequested(userId: string): boolean {
  return requests.value.some((r) => r.fromId === store.user?.id && r.toId === userId && r.status === "pending");
}

async function handleRequestCall(userId: string) {
  if (!store.user || alreadyRequested(userId)) return;
  const intent = store.role === "learner" ? "seek" : "offer";
  await api.requestCall(store.user.id, userId, intent);
  requests.value = await api.getRequests(store.user.id);
}
</script>
