<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <AppNav />

    <div class="bg-white/30 backdrop-blur-sm p-2 text-center text-base font-medium border-b border-white/30 z-10 relative text-white/90">
      Demo: Viewing as {{ store.role === 'mentor' ? 'Grace (Mentor)' : 'Sam (Learner)' }}
      <button @click="store.setRole(store.role === 'mentor' ? 'learner' : 'mentor')" class="ml-4 text-white underline">Switch role</button>
    </div>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

      <!-- Learner Approval Card -->
      <div v-if="store.role === 'learner' && store.pendingStory && tab === 'For you'" class="bg-white/90 border border-white/60 rounded-[16px] p-6 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between shadow-sm">
        <div>
          <h3 class="font-semibold text-[18px] text-primary mb-2">Grace wants to share a story from your conversation</h3>
          <p class="font-serif italic text-[18px] mb-2">"{{ store.pendingStory.quote }}"</p>
        </div>
        <div class="flex gap-3 shrink-0">
          <button @click="store.setPendingStory(null)" class="px-6 py-3 border border-border rounded-[12px] bg-white text-[16px] font-medium hover:bg-secondary">Decline</button>
          <button @click="handleApproveStory" class="px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover">Approve</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-white/40 mb-8 overflow-x-auto pb-1">
        <button
          v-for="t in tabs"
          :key="t"
          @click="tab = t"
          :class="['px-4 py-3 text-[18px] font-medium whitespace-nowrap relative', tab === t ? 'text-white' : 'text-white/60 hover:text-white/90']"
        >
          {{ t }}
          <span v-if="t === 'Requests' && requests.length > 0" class="ml-2 bg-white text-primary text-base px-2 py-0.5 rounded-full">{{ requests.length }}</span>
          <div v-if="tab === t" class="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-full" />
        </button>
      </div>

      <!-- Requests Tab -->
      <div v-if="tab === 'Requests' && store.role === 'mentor'" class="space-y-4">
        <div v-for="req in requests" :key="req.id" class="bg-white/90 p-6 rounded-[16px] card-shadow flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl">{{ req.name[0] }}</div>
            <div>
              <h3 class="font-semibold text-[18px]">{{ req.name }}, {{ req.age }}</h3>
              <p class="text-foreground/70">wants to talk about <span class="font-medium">{{ req.topic }}</span></p>
            </div>
          </div>
          <p v-if="requestAction[req.id]" class="text-foreground/70 font-medium px-4 py-2">{{ requestAction[req.id] }}</p>
          <div v-else class="flex gap-3">
            <button @click="requestAction[req.id] = 'Request declined'" class="px-6 py-3 border border-border rounded-[12px] font-medium hover:bg-secondary bg-white">Decline</button>
            <button @click="router.push('/pre-call')" class="px-6 py-3 bg-primary text-white rounded-[12px] font-medium hover:bg-primary-hover">Accept</button>
          </div>
        </div>
        <p v-if="requests.length === 0" class="text-center text-white/60 py-12">No pending requests.</p>
      </div>

      <!-- My Posts Empty -->
      <div v-else-if="tab === 'My posts' && filteredStories.length === 0" class="text-center py-20 bg-white/80 rounded-[16px] border border-white/50">
        <p class="text-[18px] text-foreground/60">Stories from your conversations will appear here.</p>
      </div>

      <!-- Stories -->
      <template v-else>
        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 justify-between mb-8">
          <div class="flex gap-2 overflow-x-auto pb-2 flex-1">
            <button
              v-for="t in topics"
              :key="t"
              @click="topicFilter = topicFilter === t ? null : t"
              :aria-pressed="topicFilter === t"
              :class="['px-4 py-2 rounded-full border text-[16px] whitespace-nowrap transition-colors', topicFilter === t ? 'bg-white text-primary border-white' : 'border-white/50 bg-white/20 text-white hover:bg-white/35']"
            >
              {{ t }}
            </button>
          </div>
          <div class="relative w-full md:w-64 shrink-0">
            <input
              type="text"
              placeholder="Search wisdom..."
              v-model="search"
              class="w-full px-4 h-[44px] rounded-[12px] border border-white/40 focus:ring-3 focus:ring-white/20 outline-none pl-10 bg-white/80 placeholder:text-foreground/40"
              aria-label="Search wisdom"
            />
            <svg class="absolute left-3 top-3 text-foreground/40" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        <!-- Stories Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="story in filteredStories" :key="story.id" class="bg-white/90 p-8 rounded-[16px] card-shadow flex flex-col h-full relative">
            <span v-if="story.isNew" class="absolute top-6 right-6 bg-accent text-white px-3 py-1 rounded-full text-base font-semibold tracking-wide uppercase">NEW</span>

            <div class="mb-4">
              <span class="inline-block px-3 py-1 rounded-full bg-secondary text-primary text-base font-medium border border-border/50">
                {{ story.topic }}
              </span>
            </div>

            <p class="font-serif italic text-[24px] leading-relaxed flex-1 mb-8">
              "{{ story.quote }}"
            </p>

            <div class="flex items-center justify-between mt-auto pt-6 border-t border-border">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl shrink-0">
                  {{ story.author[0] }}
                </div>
                <div>
                  <div class="font-semibold text-[16px]">{{ story.author }}, {{ story.age }}</div>
                  <div v-if="story.credential" class="text-foreground/60 text-base">{{ story.credential }}</div>
                </div>
              </div>
              <button
                v-if="store.role !== 'mentor'"
                @click="callRequests[story.id] = true"
                :class="['px-4 py-2 rounded-[12px] text-[16px] font-medium transition-colors', callRequests[story.id] ? 'bg-success/10 text-success' : 'bg-white border border-border hover:bg-secondary']"
                aria-live="polite"
              >
                {{ callRequests[story.id] ? 'Request sent' : 'Request a call' }}
              </button>
            </div>
            <div v-if="callRequests[story.id]" class="mt-4 text-base text-success font-medium text-right">
              {{ story.author }} will respond within 2 days.
            </div>
          </div>

          <div v-if="filteredStories.length === 0" class="col-span-1 md:col-span-2 text-center py-20">
            <p class="text-[18px] text-white/70">No wisdom found matching your filters.</p>
            <button @click="search = ''; topicFilter = null" class="mt-4 text-white font-medium underline">Reset filters</button>
          </div>
        </div>
      </template>
    </main>

    <footer class="py-8 text-center text-white/60 text-[16px] border-t border-white/20">
      Every storyteller is ID-verified. Stories are published only with both participants' consent.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/store";
import AppNav from "@/components/AppNav.vue";

const router = useRouter();
const tab = ref("For you");
const search = ref("");
const topicFilter = ref<string | null>(null);
const requests = ref([{ id: 1, name: "Sam", age: 21, topic: "Career" }]);
const requestAction = reactive<Record<string, string>>({});
const callRequests = reactive<Record<string, boolean>>({});

const topics = ["Career", "Family", "Migration", "Health", "Confidence", "Study", "Relationships", "Resilience"];

const tabs = computed(() => {
  const base = ["For you", "All wisdom", "My posts"];
  return store.role === "mentor" ? [...base, "Requests"] : base;
});

function handleApproveStory() {
  if (store.pendingStory) {
    store.addStory({ ...store.pendingStory, isNew: true });
    store.setPendingStory(null);
  }
}

const filteredStories = computed(() => {
  return store.stories.filter(s => {
    if (topicFilter.value && s.topic !== topicFilter.value) return false;
    if (search.value && !s.quote.toLowerCase().includes(search.value.toLowerCase()) && !s.topic.toLowerCase().includes(search.value.toLowerCase())) return false;
    if (tab.value === "My posts" && s.author !== (store.role === "mentor" ? "Grace" : "Sam")) return false;
    if (tab.value === "For you" && store.user?.topics && store.user.topics.length > 0 && !store.user.topics.includes(s.topic)) return false;
    return true;
  });
});
</script>
