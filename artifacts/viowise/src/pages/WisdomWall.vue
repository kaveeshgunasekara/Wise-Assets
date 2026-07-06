<template>
  <div class="min-h-screen bg-pattern flex flex-col">
    <AppNav />

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

      <!-- Pending approval banner(s): call-summary posts written about this user, awaiting their sign-off -->
      <div v-for="p in pendingApprovals" :key="p.id" class="bg-white/90 border border-white/60 rounded-[16px] p-6 mb-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between shadow-sm">
        <div>
          <h3 class="font-semibold text-[18px] text-primary mb-2">{{ authorName(p) }} wants to share a story from your conversation</h3>
          <p class="font-serif italic text-[18px] mb-2">"{{ p.quote }}"</p>
        </div>
        <div class="flex gap-3 shrink-0">
          <button @click="handleDecline(p.id)" class="px-6 py-3 border border-border rounded-[12px] bg-white text-[16px] font-medium hover:bg-secondary">Decline</button>
          <button @click="handleApprove(p.id)" class="px-6 py-3 bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover">Approve</button>
        </div>
      </div>

      <!-- Composer -->
      <div class="bg-white/90 rounded-[16px] p-6 mb-8 card-shadow">
        <h2 class="text-[18px] font-semibold mb-3">{{ store.role === "mentor" ? "Share a piece of wisdom" : "Share a reflection" }}</h2>
        <form @submit.prevent="handlePost" class="space-y-4">
          <textarea
            v-model="composerQuote"
            rows="3"
            :placeholder="store.role === 'mentor' ? 'What have you learned that someone else could use right now?' : 'What are you working through right now?'"
            class="w-full px-4 py-3 rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none resize-none"
          ></textarea>
          <div class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <select v-model="composerTopic" class="px-4 h-[44px] rounded-[12px] border border-input focus:ring-3 focus:ring-primary/20 outline-none bg-white">
              <option v-for="t in topics" :key="t" :value="t">{{ t }}</option>
            </select>
            <button type="submit" :disabled="!composerQuote.trim() || posting" class="px-6 h-[44px] bg-primary text-white rounded-[12px] text-[16px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-50">
              {{ posting ? "Posting..." : "Post to the Wall" }}
            </button>
          </div>
        </form>
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
          <span v-if="t === 'Requests' && incomingPendingRequests.length > 0" class="ml-2 bg-white text-primary text-base px-2 py-0.5 rounded-full">{{ incomingPendingRequests.length }}</span>
          <div v-if="tab === t" class="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-full" />
        </button>
      </div>

      <!-- Requests Tab -->
      <div v-if="tab === 'Requests'" class="space-y-4">
        <div v-for="req in myRequests" :key="req.id" class="bg-white/90 p-6 rounded-[16px] card-shadow flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl">{{ requestCounterpartName(req)[0] }}</div>
            <div>
              <h3 class="font-semibold text-[18px]">{{ requestCounterpartName(req) }}</h3>
              <p class="text-foreground/70">
                <template v-if="req.toId === store.user?.id">wants to talk<span v-if="req.topic"> about <span class="font-medium">{{ req.topic }}</span></span></template>
                <template v-else>Request sent<span v-if="req.topic"> about <span class="font-medium">{{ req.topic }}</span></span></template>
              </p>
            </div>
          </div>
          <p v-if="req.toId !== store.user?.id" class="text-foreground/70 font-medium px-4 py-2 capitalize">{{ req.status }}</p>
          <p v-else-if="req.status !== 'pending'" class="text-foreground/70 font-medium px-4 py-2 capitalize">{{ req.status }}</p>
          <div v-else class="flex gap-3">
            <button @click="handleDeclineRequest(req.id)" class="px-6 py-3 border border-border rounded-[12px] font-medium hover:bg-secondary bg-white">Decline</button>
            <button @click="handleAcceptRequest(req)" class="px-6 py-3 bg-primary text-white rounded-[12px] font-medium hover:bg-primary-hover">Accept</button>
          </div>
        </div>
        <p v-if="myRequests.length === 0" class="text-center text-white/60 py-12">No call requests yet.</p>
      </div>

      <!-- My Posts Empty -->
      <div v-else-if="tab === 'My posts' && filteredPosts.length === 0" class="text-center py-20 bg-white/80 rounded-[16px] border border-white/50">
        <p class="text-[18px] text-foreground/60">Your posts will appear here.</p>
      </div>

      <!-- Posts -->
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

        <!-- Empty state for whole wall (no posts at all yet, no filters applied) -->
        <div v-if="posts.length === 0" class="text-center py-20 bg-white/80 rounded-[16px] border border-white/50">
          <p class="text-[18px] text-foreground/60">No wisdom shared yet — be the first to post.</p>
        </div>

        <!-- Posts Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-for="post in filteredPosts" :key="post.id" class="bg-white/90 p-8 rounded-[16px] card-shadow flex flex-col h-full relative">
            <span v-if="post.isNew" class="absolute top-6 right-6 bg-accent text-white px-3 py-1 rounded-full text-base font-semibold tracking-wide uppercase">NEW</span>

            <div class="mb-4 flex gap-2">
              <span class="inline-block px-3 py-1 rounded-full bg-secondary text-primary text-base font-medium border border-border/50">
                {{ post.topic }}
              </span>
              <span class="inline-block px-3 py-1 rounded-full bg-white text-foreground/60 text-base font-medium border border-border/50">
                {{ postTypeLabel(post) }}
              </span>
            </div>

            <p class="font-serif italic text-[24px] leading-relaxed flex-1 mb-8">
              "{{ post.quote }}"
            </p>

            <div class="flex items-center justify-between mt-auto pt-6 border-t border-border">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-xl shrink-0">
                  {{ authorName(post)[0] }}
                </div>
                <div>
                  <div class="font-semibold text-[16px]">{{ authorName(post) }}<span v-if="authorOf(post)?.age">, {{ authorOf(post)?.age }}</span></div>
                  <div v-if="authorOf(post)?.credential" class="text-foreground/60 text-base">{{ authorOf(post)?.credential }}</div>
                </div>
              </div>
              <button
                v-if="canRequestCall(post)"
                @click="handleRequestCall(post)"
                :class="['px-4 py-2 rounded-[12px] text-[16px] font-medium transition-colors', alreadyRequested(post.authorId) ? 'bg-success/10 text-success' : 'bg-white border border-border hover:bg-secondary']"
                aria-live="polite"
              >
                {{ alreadyRequested(post.authorId) ? 'Request sent' : (store.role === 'mentor' ? 'Offer a call' : 'Request a call') }}
              </button>
            </div>
            <div v-if="alreadyRequested(post.authorId)" class="mt-4 text-base text-success font-medium text-right">
              {{ authorName(post) }} will respond within 2 days.
            </div>
          </div>

          <div v-if="filteredPosts.length === 0" class="col-span-1 md:col-span-2 text-center py-20">
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/store";
import { TOPICS } from "@/types";
import type { Post, CallRequest, User } from "@/types";
import * as api from "@/services/api";
import AppNav from "@/components/AppNav.vue";

const router = useRouter();
const tab = ref("For you");
const search = ref("");
const topicFilter = ref<string | null>(null);
const topics = TOPICS;

const posts = ref<Post[]>([]);
const users = ref<User[]>([]);
const requests = ref<CallRequest[]>([]);
const composerQuote = ref("");
const composerTopic = ref(topics[0]);
const posting = ref(false);

const tabs = ["For you", "All wisdom", "My posts", "Requests"];

async function loadAll() {
  const [p, u, r] = await Promise.all([
    api.getPosts(),
    api.getUsers(),
    store.user ? api.getRequests(store.user.id) : Promise.resolve([] as CallRequest[]),
  ]);
  posts.value = p;
  users.value = u;
  requests.value = r;
}

onMounted(loadAll);

function authorOf(post: Post): User | undefined {
  return users.value.find((u) => u.id === post.authorId);
}
function authorName(post: Post): string {
  return authorOf(post)?.name ?? "Someone";
}
function postTypeLabel(post: Post): string {
  if (post.type === "wisdom") return "Wisdom";
  if (post.type === "reflection") return "Reflection";
  return "Call story";
}

const pendingApprovals = computed(() =>
  posts.value.filter((p) => p.status === "pending_approval" && p.partnerId === store.user?.id)
);

const myRequests = computed(() =>
  requests.value.filter((r) => r.toId === store.user?.id || r.fromId === store.user?.id)
);
const incomingPendingRequests = computed(() =>
  requests.value.filter((r) => r.toId === store.user?.id && r.status === "pending")
);

function requestCounterpartName(req: CallRequest): string {
  const otherId = req.toId === store.user?.id ? req.fromId : req.toId;
  return users.value.find((u) => u.id === otherId)?.name ?? "Someone";
}

function canRequestCall(post: Post): boolean {
  if (!store.user) return false;
  const author = authorOf(post);
  if (!author) return false;
  if (author.id === store.user.id) return false;
  if (post.status !== "published") return false;
  return author.role !== store.user.role;
}

function alreadyRequested(authorId: string): boolean {
  return requests.value.some((r) => r.fromId === store.user?.id && r.toId === authorId && r.status === "pending");
}

async function handleRequestCall(post: Post) {
  if (!store.user) return;
  const intent = store.role === "learner" ? "seek" : "offer";
  await api.requestCall(store.user.id, post.authorId, intent, { postId: post.id, topic: post.topic });
  requests.value = await api.getRequests(store.user.id);
}

async function handleAcceptRequest(req: CallRequest) {
  await api.respondRequest(req.id, "accept");
  router.push(`/pre-call?with=${req.fromId}`);
}
async function handleDeclineRequest(id: string) {
  await api.respondRequest(id, "decline");
  if (store.user) requests.value = await api.getRequests(store.user.id);
}

async function handleApprove(id: string) {
  await api.approvePost(id);
  posts.value = await api.getPosts();
}
async function handleDecline(id: string) {
  await api.declinePost(id);
  posts.value = await api.getPosts();
}

async function handlePost() {
  if (!store.user || !composerQuote.value.trim()) return;
  posting.value = true;
  await api.createPost({
    authorId: store.user.id,
    type: store.role === "mentor" ? "wisdom" : "reflection",
    quote: composerQuote.value.trim(),
    topic: composerTopic.value,
    source: "direct",
    status: "published",
  });
  composerQuote.value = "";
  posts.value = await api.getPosts();
  posting.value = false;
}

const filteredPosts = computed(() => {
  let list = posts.value.filter((p) => p.status === "published");

  if (tab.value === "My posts") {
    list = posts.value.filter((p) => p.authorId === store.user?.id);
  }

  if (topicFilter.value) list = list.filter((p) => p.topic === topicFilter.value);
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter((p) => p.quote.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q));
  }

  if (tab.value === "For you" && store.user?.topics && store.user.topics.length > 0) {
    const userTopics = new Set(store.user.topics);
    list = [...list].sort((a, b) => {
      const aMatch = userTopics.has(a.topic) ? 1 : 0;
      const bMatch = userTopics.has(b.topic) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return list;
});
</script>
