<template>
  <header class="bg-white border-b border-border sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <router-link to="/wall" class="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-base">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        VIOWISE
      </router-link>
      <nav class="hidden md:flex gap-6">
        <router-link to="/wall" :class="['font-medium', route.path === '/wall' ? 'text-primary' : 'text-foreground/70 hover:text-foreground']">Wisdom Wall</router-link>
        <router-link to="/matching" :class="['font-medium', route.path === '/matching' ? 'text-primary' : 'text-foreground/70 hover:text-foreground']">AI Matching</router-link>
      </nav>
    </div>

    <div class="flex items-center gap-4 relative">
      <router-link to="/help" class="font-medium text-foreground/70 hover:text-foreground hidden md:block">Help</router-link>

      <AccessibilityControl />

      <div class="relative">
        <button
          @click="menuOpen = !menuOpen"
          class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl border border-primary/20"
          :aria-expanded="menuOpen"
          aria-label="User menu"
        >
          {{ initial }}
        </button>

        <div v-if="menuOpen" class="absolute right-0 top-full mt-2 w-48 bg-white border border-border shadow-lg rounded-xl py-2 z-50">
          <router-link to="/profile" @click="menuOpen = false" class="block px-4 py-3 hover:bg-secondary">Profile</router-link>
          <button
            @click="signOut"
            class="w-full text-left px-4 py-3 hover:bg-secondary text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { store } from "@/store";
import AccessibilityControl from "./AccessibilityControl.vue";

const route = useRoute();
const router = useRouter();
const menuOpen = ref(false);

const initial = computed(() => store.user?.name ? store.user.name.charAt(0) : "G");

function signOut() {
  store.setUser(null);
  store.setRole(null);
  menuOpen.value = false;
  router.push("/");
}
</script>
