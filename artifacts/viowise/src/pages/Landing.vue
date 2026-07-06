<template>
  <div class="min-h-screen bg-pattern relative overflow-hidden flex flex-col">
    <header class="relative px-6 py-4 flex items-center justify-between z-20">
      <div class="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        VIOWISE
      </div>
      <div class="flex gap-4 items-center">
        <router-link to="/sign-in" class="px-4 py-2 font-medium text-foreground hover:text-primary transition-colors">Sign in</router-link>
        <AccessibilityControl />
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto z-10 py-20">
      <span class="text-primary text-[16px] uppercase tracking-widest font-semibold mb-6">CONNECTING GENERATIONS</span>
      <h1 class="text-[56px] leading-tight font-serif font-normal italic text-foreground mb-6">
        Your experience is someone's answer.
      </h1>
      <p class="text-[20px] text-foreground/80 mb-12 max-w-2xl">
        Real conversations between generations, guided by AI — never replaced by it.
      </p>

      <div class="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        <router-link to="/sign-up" @click="store.setRole('mentor')" class="flex-1 bg-primary text-white text-[18px] font-medium py-4 px-6 rounded-xl hover:bg-primary-hover transition-colors shadow-lg text-center">
          I want to share my wisdom
        </router-link>
        <router-link to="/sign-up" @click="store.setRole('learner')" class="flex-1 bg-white text-primary text-[18px] font-medium py-4 px-6 rounded-xl border border-primary/20 hover:bg-primary/5 transition-colors shadow-lg text-center">
          I want to learn from experience
        </router-link>
      </div>
    </main>

    <footer class="mt-auto py-8 text-center text-foreground/60 text-[16px] flex items-center justify-center gap-2 z-10">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      Every member is ID-verified. Calls are never recorded.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { store } from "@/store";
import AccessibilityControl from "@/components/AccessibilityControl.vue";
</script>
