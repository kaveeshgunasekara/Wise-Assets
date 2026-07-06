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
      <div class="bg-white p-8 rounded-[16px] card-shadow w-full max-w-md">
        <h1 class="text-[40px] font-serif text-foreground mb-8 text-center leading-tight">Welcome back</h1>

        <form class="space-y-5" @submit.prevent="handleSignIn">
          <div>
            <label class="block text-[16px] font-medium mb-2">Email</label>
            <input type="email" required class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" :value="activeRole === 'mentor' ? 'grace@example.com' : 'sam@example.com'" />
          </div>
          <div>
            <label class="block text-[16px] font-medium mb-2">Password</label>
            <input type="password" required class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" value="password123" />
          </div>

          <button type="submit" class="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors mt-2">
            Sign in
          </button>
        </form>

        <p class="mt-8 text-center text-[16px]">
          New here? <router-link to="/sign-up" class="text-primary font-medium hover:underline">Create an account</router-link>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/store";
import AccessibilityControl from "@/components/AccessibilityControl.vue";
import BgLogos from "@/components/BgLogos.vue";

const router = useRouter();
const activeRole = computed(() => store.role ?? "learner");

function handleSignIn() {
  if (activeRole.value === "mentor") {
    store.setRole("mentor");
    store.setUser({ name: "Grace", age: 72, topics: ["Career", "Migration", "Resilience"] });
  } else {
    store.setRole("learner");
    store.setUser({ name: "Sam", age: 21, topics: ["Career", "Study"] });
  }
  router.push("/wall");
}
</script>
