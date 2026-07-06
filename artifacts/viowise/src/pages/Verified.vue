<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <BgLogos />
    <header class="relative px-6 py-4 flex items-center justify-between z-20">
      <router-link to="/" class="flex items-center gap-2">
        <img src="/logo.png" alt="Viowise" class="h-11 w-auto" />
      </router-link>
      <AccessibilityControl />
    </header>

    <main class="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto pb-20 relative z-10">
      <p class="text-white/80 text-[16px] uppercase tracking-widest font-semibold mb-8">Step 4 of 4</p>

      <div class="w-24 h-24 rounded-full bg-white/20 text-white flex items-center justify-center mb-8 mx-auto backdrop-blur-sm">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 class="text-[40px] font-serif text-white mb-4">You're verified, {{ name }}.</h1>
      <p class="text-[20px] text-white/80 mb-12">Welcome to VIOWISE. You're already signed in.</p>

      <router-link to="/wall" class="w-full bg-white text-primary h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-white/90 transition-colors shadow-lg flex items-center justify-center">
        Go to the Wisdom Wall
      </router-link>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { store } from "@/store";
import AccessibilityControl from "@/components/AccessibilityControl.vue";
import BgLogos from "@/components/BgLogos.vue";

const name = computed(() => store.user?.name ?? "there");
</script>
