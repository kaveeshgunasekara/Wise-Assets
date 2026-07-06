<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <BgLogos />
    <header class="relative px-6 py-4 flex items-center justify-between z-20">
      <router-link to="/" class="flex items-center gap-2">
        <img src="/logo.png" alt="Viowise" class="h-11 w-auto" />
      </router-link>
      <AccessibilityControl />
    </header>

    <main class="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
      <div class="bg-white p-8 rounded-[16px] card-shadow w-full max-w-lg">
        <p class="text-primary text-[16px] uppercase tracking-widest font-semibold mb-2">Step 2 of 4</p>
        <h1 class="text-[36px] font-serif text-foreground mb-2 leading-tight">What matters to you?</h1>
        <p class="text-[16px] text-foreground/70 mb-6">
          {{ role === "mentor" ? "Choose the topics where you have life experience to share." : "Choose the topics you'd like guidance on." }}
        </p>

        <form class="space-y-6" @submit.prevent="handleContinue">
          <div>
            <h2 class="text-[18px] font-semibold mb-3">
              Topics
              <span class="text-foreground/50 ml-2 font-normal" aria-live="polite">{{ selectedTopics.length }} selected</span>
            </h2>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="t in topics"
                :key="t"
                type="button"
                @click="toggleTopic(t)"
                :class="['h-20 rounded-[12px] border-2 flex flex-col items-center justify-center transition-colors', selectedTopics.includes(t) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary text-foreground/70']"
              >
                <span class="font-medium text-[16px]">{{ t }}</span>
                <svg v-if="selectedTopics.includes(t)" class="mt-1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[16px] font-medium mb-2">Languages you speak (comma separated)</label>
            <input
              type="text"
              v-model="languagesInput"
              placeholder="English, Mandarin"
              class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none"
            />
          </div>

          <p v-if="error" class="text-[16px] text-destructive font-medium">{{ error }}</p>

          <button
            type="submit"
            class="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors"
          >
            Continue to verification
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/store";
import { TOPICS } from "@/types";
import AccessibilityControl from "@/components/AccessibilityControl.vue";
import BgLogos from "@/components/BgLogos.vue";

const router = useRouter();
const topics = TOPICS;
const role = store.pendingSignup?.role ?? store.role;

const selectedTopics = ref<string[]>([]);
const languagesInput = ref("");
const error = ref("");

if (!store.pendingSignup) {
  router.replace("/sign-up");
}

function toggleTopic(t: string) {
  if (selectedTopics.value.includes(t)) {
    selectedTopics.value = selectedTopics.value.filter((x) => x !== t);
  } else {
    selectedTopics.value = [...selectedTopics.value, t];
  }
}

function handleContinue() {
  if (selectedTopics.value.length === 0) {
    error.value = "Choose at least one topic to continue.";
    return;
  }
  if (!store.pendingSignup) {
    router.replace("/sign-up");
    return;
  }
  store.setPendingSignup({
    ...store.pendingSignup,
    topics: selectedTopics.value,
    languages: languagesInput.value
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean),
  });
  router.push("/verify-id");
}
</script>
