<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <AppNav />
    <main class="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <h1 class="text-[40px] font-serif text-foreground mb-8">Your Profile</h1>

      <div v-if="!store.user" class="text-center py-20 bg-white rounded-[16px] border border-border">
        <p class="text-[18px] text-foreground/60">Sign in to view and edit your profile.</p>
      </div>

      <form v-else @submit.prevent="handleSave" class="space-y-10">
        <div class="bg-white p-8 rounded-[16px] card-shadow">
          <h2 class="text-[20px] font-semibold mb-6">
            Topics
            <span class="text-foreground/50 ml-2 font-normal" aria-live="polite">{{ selectedTopics.length }} selected</span>
          </h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              v-for="t in topics"
              :key="t"
              type="button"
              @click="toggleTopic(t)"
              :class="['h-24 rounded-[12px] border-2 flex flex-col items-center justify-center transition-colors', selectedTopics.includes(t) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-secondary text-foreground/70']"
            >
              <span class="font-medium text-[16px]">{{ t }}</span>
              <svg v-if="selectedTopics.includes(t)" class="mt-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="bg-white p-8 rounded-[16px] card-shadow space-y-6">
          <div>
            <label class="block text-[16px] font-medium mb-2">Display name</label>
            <input type="text" v-model="displayName" class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label class="block text-[16px] font-medium mb-2">One-line life experience</label>
            <input type="text" v-model="bio" placeholder="A short line describing your experience" class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label class="block text-[16px] font-medium mb-2">Languages (comma separated)</label>
            <input type="text" v-model="languagesInput" placeholder="English, Mandarin" class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label class="block text-[16px] font-medium mb-2">Availability</label>
            <input type="text" v-model="availability" placeholder="e.g. Weekday evenings" class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
          </div>
        </div>

        <div class="flex items-center gap-6">
          <button type="submit" :disabled="saving" class="px-8 bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60">
            {{ saving ? "Saving..." : "Save changes" }}
          </button>
          <span v-if="saved" class="text-success font-medium flex items-center gap-2" aria-live="polite">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Profile updated.
          </span>
        </div>
        <p class="text-foreground/60 text-[16px]">Your matches update automatically when your profile changes.</p>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { store } from "@/store";
import { TOPICS } from "@/types";
import { updateUser } from "@/services/api";
import AppNav from "@/components/AppNav.vue";

const topics = TOPICS;

const saved = ref(false);
const saving = ref(false);
const selectedTopics = ref<string[]>(store.user?.topics ?? []);
const displayName = ref(store.user?.name ?? "");
const bio = ref(store.user?.bio ?? "");
const languagesInput = ref((store.user?.languages ?? []).join(", "));
const availability = ref(store.user?.availability ?? "");

function toggleTopic(t: string) {
  if (selectedTopics.value.includes(t)) {
    selectedTopics.value = selectedTopics.value.filter((x) => x !== t);
  } else {
    selectedTopics.value = [...selectedTopics.value, t];
  }
}

async function handleSave() {
  if (!store.user) return;
  saving.value = true;
  const languages = languagesInput.value
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  const updated = await updateUser(store.user.id, {
    name: displayName.value.trim() || store.user.name,
    topics: selectedTopics.value,
    bio: bio.value,
    languages,
    availability: availability.value,
  });
  if (updated) store.setUser(updated);

  saving.value = false;
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 3000);
}
</script>
