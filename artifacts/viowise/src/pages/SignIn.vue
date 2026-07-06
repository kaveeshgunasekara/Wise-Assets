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
            <input type="email" required v-model="email" class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
          </div>
          <div>
            <label class="block text-[16px] font-medium mb-2">Password</label>
            <input type="password" required v-model="password" class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" />
          </div>

          <p v-if="error" class="text-[16px] text-destructive font-medium">{{ error }}</p>

          <button type="submit" :disabled="loading" class="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors mt-2 disabled:opacity-60">
            {{ loading ? "Signing in..." : "Sign in" }}
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/store";
import { getUserByEmail } from "@/services/api";
import AccessibilityControl from "@/components/AccessibilityControl.vue";
import BgLogos from "@/components/BgLogos.vue";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleSignIn() {
  error.value = "";
  loading.value = true;
  const user = await getUserByEmail(email.value);
  loading.value = false;
  if (!user) {
    error.value = "We couldn't find an account with that email. Sign up to create one.";
    return;
  }
  store.setUser(user);
  store.setRole(user.role);
  router.push("/wall");
}
</script>
