<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <AppNav />
    <main class="flex-1 max-w-2xl mx-auto w-full px-6 py-12">

      <div class="flex flex-col items-center text-center mb-10">
        <div class="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-3xl mb-4 border border-border">
          {{ partnerName[0] }}
        </div>
        <h1 class="text-[32px] font-semibold text-foreground">Your call with {{ partnerName }}</h1>
        <p class="text-[20px] text-foreground/70 mt-2">Today, 10:00 AM</p>
      </div>

      <div class="bg-white p-8 rounded-[16px] card-shadow mb-8">
        <h2 class="text-[20px] font-semibold mb-6">Before you join — your choices</h2>

        <div class="space-y-6">
          <!-- Live Subtitles -->
          <div :class="['flex items-start justify-between p-4 rounded-[12px] border-2 transition-colors', subtitles ? 'border-primary/30 bg-primary/5' : 'border-border']">
            <div class="pr-4">
              <div class="font-semibold text-[18px] mb-1">Live subtitles</div>
              <p class="text-[16px] text-foreground/70">Live translated subtitles so you both understand each other. Nothing is saved.</p>
            </div>
            <button
              @click="subtitles = !subtitles"
              :class="['w-14 h-8 shrink-0 rounded-full p-1 transition-colors relative', subtitles ? 'bg-primary' : 'bg-foreground/20']"
              aria-label="Toggle live subtitles"
            >
              <div :class="['w-6 h-6 bg-white rounded-full transition-transform', subtitles ? 'translate-x-6' : 'translate-x-0']" />
              <span class="sr-only">{{ subtitles ? 'On' : 'Off' }}</span>
            </button>
          </div>

          <!-- Story Capture -->
          <div :class="['flex items-start justify-between p-4 rounded-[12px] border-2 transition-colors', capture ? 'border-primary/30 bg-primary/5' : 'border-border']">
            <div class="pr-4">
              <div class="font-semibold text-[18px] mb-1">Story capture</div>
              <p class="text-[16px] text-foreground/70">AI can summarize the wisdom you share. Both must agree; you can edit or delete it.</p>
            </div>
            <button
              @click="capture = !capture"
              :class="['w-14 h-8 shrink-0 rounded-full p-1 transition-colors relative', capture ? 'bg-primary' : 'bg-foreground/20']"
              aria-label="Toggle story capture"
            >
              <div :class="['w-6 h-6 bg-white rounded-full transition-transform', capture ? 'translate-x-6' : 'translate-x-0']" />
              <span class="sr-only">{{ capture ? 'On' : 'Off' }}</span>
            </button>
          </div>

          <!-- Time Limit -->
          <div :class="['flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-[12px] border-2 transition-colors', timeLimit ? 'border-primary/30 bg-primary/5' : 'border-border']">
            <div class="pr-4 mb-4 sm:mb-0">
              <div class="font-semibold text-[18px] mb-1">Call time limit</div>
              <select :disabled="!timeLimit" class="mt-2 w-48 px-3 py-2 rounded-lg border border-input bg-white disabled:opacity-50">
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>60 minutes</option>
              </select>
            </div>
            <button
              @click="timeLimit = !timeLimit"
              :class="['w-14 h-8 shrink-0 rounded-full p-1 transition-colors relative', timeLimit ? 'bg-primary' : 'bg-foreground/20']"
              aria-label="Toggle call time limit"
            >
              <div :class="['w-6 h-6 bg-white rounded-full transition-transform', timeLimit ? 'translate-x-6' : 'translate-x-0']" />
              <span class="sr-only">{{ timeLimit ? 'On' : 'Off' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="flex justify-center gap-6 text-[16px] text-foreground/60 mb-10 px-4 py-3 bg-secondary rounded-[12px] font-medium">
        <span class="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          never recorded
        </span>
        <span class="hidden sm:inline">·</span>
        <span>report or leave anytime</span>
        <span class="hidden sm:inline">·</span>
        <span>only {{ partnerName }} can see you</span>
      </div>

      <div class="flex flex-col gap-4">
        <router-link to="/video-call" class="w-full bg-primary text-white h-[64px] rounded-[12px] text-[20px] font-semibold hover:bg-primary-hover transition-colors shadow-lg flex items-center justify-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
          Join call with {{ partnerName }}
        </router-link>

        <div v-if="rescheduled" class="text-success text-center font-medium text-[16px] py-4 bg-success/10 rounded-[12px]" aria-live="polite">
          {{ partnerName }} has been notified. Moved to tomorrow, 10:00 AM.
        </div>
        <button v-else @click="rescheduled = true" class="text-primary font-medium text-[18px] py-2 hover:underline">
          Reschedule instead
        </button>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { store } from "@/store";
import AppNav from "@/components/AppNav.vue";

const subtitles = ref(true);
const capture = ref(true);
const timeLimit = ref(false);
const rescheduled = ref(false);

const partnerName = computed(() => store.role === "mentor" ? "Sam" : "Grace");
</script>
