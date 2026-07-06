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
        <p class="text-primary text-[16px] uppercase tracking-widest font-semibold mb-2">Step 1 of 3</p>
        <h1 class="text-[40px] font-serif text-foreground mb-6 leading-tight">Create your account</h1>

        <div class="flex gap-4 mb-8">
          <div :class="['flex-1 p-4 rounded-xl border-2', store.role === 'mentor' ? 'border-primary bg-primary/5' : 'border-border opacity-50']">
            <div class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-serif text-xl mb-3">M</div>
            <p class="font-medium">Mentor</p>
          </div>
          <div :class="['flex-1 p-4 rounded-xl border-2', store.role === 'learner' ? 'border-primary bg-primary/5' : 'border-border opacity-50']">
            <div class="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-serif text-xl mb-3">L</div>
            <p class="font-medium">Learner</p>
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="router.push('/verify-id')">
          <div>
            <label class="block text-[16px] font-medium mb-2">Full name</label>
            <input type="text" required class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" :value="store.role === 'mentor' ? 'Grace' : 'Sam'" />
          </div>
          <div>
            <label class="block text-[16px] font-medium mb-2">Email</label>
            <input type="email" required class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" :value="store.role === 'mentor' ? 'grace@example.com' : 'sam@example.com'" />
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-[16px] font-medium">Password</label>
              <button type="button" @click="showPassword = !showPassword" class="text-primary text-[16px] font-medium">
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <input :type="showPassword ? 'text' : 'password'" required class="w-full px-4 h-[48px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none" value="password123" />
          </div>

          <p class="text-[16px] text-foreground/70 py-2">
            A government-issued ID is required to join.
          </p>

          <button type="submit" class="w-full bg-primary text-white h-[56px] rounded-[12px] text-[18px] font-medium hover:bg-primary-hover transition-colors">
            Continue to verification
          </button>
        </form>

        <p class="mt-6 text-center text-[16px]">
          Already a member? <router-link to="/sign-in" class="text-primary font-medium hover:underline">Sign in</router-link>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/store";
import AccessibilityControl from "@/components/AccessibilityControl.vue";
import BgLogos from "@/components/BgLogos.vue";

const router = useRouter();
const showPassword = ref(false);
</script>
