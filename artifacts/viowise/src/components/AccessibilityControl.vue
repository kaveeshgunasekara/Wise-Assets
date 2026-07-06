<template>
  <div class="relative">
    <button
      type="button"
      @click="open = !open"
      class="px-4 py-2 bg-white text-primary border border-primary/20 rounded-xl font-medium flex items-center gap-2 min-h-[48px]"
      :aria-expanded="open"
      aria-label="Accessibility settings"
    >
      <span>Aa</span> <span class="hidden sm:inline">Accessibility</span>
    </button>

    <div v-if="open" class="absolute right-0 top-full mt-2 w-64 bg-white border border-border shadow-lg rounded-xl p-4 z-50">
      <h3 class="font-semibold text-[16px] mb-3">Text size</h3>
      <div class="flex flex-col gap-2 mb-4">
        <button
          v-for="size in ['Standard', 'Large', 'Extra large']"
          :key="size"
          type="button"
          @click="store.setTextSize(size as any)"
          :class="['text-left px-3 py-2 rounded-lg border', store.textSize === size ? 'border-primary text-primary bg-primary/5' : 'border-transparent hover:bg-secondary']"
        >
          {{ size }} <span v-if="store.textSize === size">✓</span>
        </button>
      </div>
      <h3 class="font-semibold text-[16px] mb-3">High contrast</h3>
      <button
        type="button"
        @click="store.setHighContrast(!store.highContrast)"
        :class="['w-full text-left px-3 py-2 rounded-lg border', store.highContrast ? 'border-primary text-primary bg-primary/5' : 'border-border hover:bg-secondary']"
      >
        {{ store.highContrast ? 'On ✓' : 'Off' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { store } from "@/store";

const open = ref(false);
</script>
