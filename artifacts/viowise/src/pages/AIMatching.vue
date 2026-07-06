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

      <div class="space-y-6 mb-12">
        <div v-for="m in matches" :key="m.id" class="bg-white p-6 rounded-[16px] card-shadow border border-border">
          <div class="flex flex-col sm:flex-row gap-6 justify-between items-start">
            <div class="flex gap-4">
              <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-2xl relative shrink-0">
                {{ m.name[0] }}
                <div class="absolute -bottom-1 -right-1 bg-success text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white" title="ID Verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <div>
                <h2 class="text-[20px] font-semibold">{{ m.name }}, {{ m.age }}</h2>
                <p class="text-[16px] text-foreground/80 mt-1">{{ m.bio }}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <span v-for="t in m.shared" :key="t" class="px-3 py-1 bg-[#F4F1FC] border border-[#C5BCDF] text-primary rounded-full text-base font-medium flex items-center gap-1">
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
              <router-link to="/pre-call" class="w-full text-center px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover transition-colors">
                Schedule a call
              </router-link>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-border">
            <button
              @click="expanded = expanded === m.id ? null : m.id"
              class="flex items-center gap-2 text-primary font-medium text-[16px] hover:underline"
              :aria-expanded="expanded === m.id"
            >
              See why {{ expanded === m.id ? '↑' : '↓' }}
            </button>
            <p v-if="expanded === m.id" class="mt-3 text-[16px] text-foreground/80 bg-secondary/50 p-4 rounded-[12px]">
              {{ m.reason }}
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
import { ref, computed } from "vue";
import { store } from "@/store";
import AppNav from "@/components/AppNav.vue";

const expanded = ref<string | null>(null);

const matchesForLearner = [
  { id: "1", name: "Grace", age: 72, bio: "Rebuilt nursing career after moving from the Philippines.", shared: ["Career", "Migration"], percent: 92, reason: "You both chose Career and Migration — Grace rebuilt her career after moving countries, the journey you're starting." },
  { id: "2", name: "Rosa", age: 66, bio: "Retired professor who learned how to learn late.", shared: ["Study", "Resilience"], percent: 87, reason: "You're dealing with academic stress; Rosa has extensive experience turning academic failures into growth." },
  { id: "3", name: "Ahmed", age: 68, bio: "Engineer who changed careers at 45.", shared: ["Career"], percent: 81, reason: "Ahmed understands the pressure of high-stakes career decisions." },
];

const matchesForMentor = [
  { id: "4", name: "Sam", age: 21, bio: "International student dealing with career anxiety.", shared: ["Career", "Migration"], percent: 92, reason: "Sam is starting the career journey you've already lived, dealing with identical pressures." },
  { id: "5", name: "Priya", age: 23, bio: "Recent graduate figuring out her next career move.", shared: ["Career"], percent: 85, reason: "Your experience starting over later in life provides perfect perspective for her early-career doubts." },
];

const matches = computed(() => store.role === "mentor" ? matchesForMentor : matchesForLearner);
</script>
