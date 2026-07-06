import { seedUsers, seedPosts } from "@/data/seed";
import type {
  User,
  Post,
  CallRequest,
  Interaction,
  Match,
  RequestIntent,
} from "@/types";

// Mock service layer. Every export here is async and returns data from
// in-memory state seeded from src/data/seed.ts. This is the ONLY place
// that touches "data" — components should never hardcode users/posts.
// TODO(backend): swap the bodies of these functions for real network
// calls (Supabase/REST) once a backend exists. Callers never change.

const NETWORK_DELAY_MS = 200;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

let usersStore: User[] = [...seedUsers];
let postsStore: Post[] = [...seedPosts];
let requestsStore: CallRequest[] = [];
let interactionsStore: Interaction[] = [];

let nextPostId = 1;
let nextRequestId = 1;
let nextInteractionId = 1;

export async function getUsers(): Promise<User[]> {
  return delay([...usersStore]);
}

export async function getUserById(id: string): Promise<User | undefined> {
  return delay(usersStore.find((u) => u.id === id));
}

export async function getPosts(): Promise<Post[]> {
  return delay([...postsStore]);
}

export async function createPost(
  input: Omit<Post, "id" | "createdAt">,
): Promise<Post> {
  const post: Post = {
    ...input,
    id: `post-${Date.now()}-${nextPostId++}`,
    createdAt: new Date().toISOString(),
  };
  postsStore = [post, ...postsStore];
  return delay(post);
}

export async function approvePost(id: string): Promise<Post | undefined> {
  const post = postsStore.find((p) => p.id === id);
  if (post) {
    post.status = "published";
    post.isNew = true;
  }
  return delay(post);
}

export async function declinePost(id: string): Promise<void> {
  postsStore = postsStore.filter((p) => p.id !== id);
  return delay(undefined);
}

const TOPIC_WEIGHT = 12;
const LANGUAGE_WEIGHT = 8;
const BASE_PERCENT = 55;

// Deterministic, rule-based score: shared topics + shared languages,
// normalized to a percentage. Same two users always produce the same %.
export async function getMatches(userId: string): Promise<Match[]> {
  const current = usersStore.find((u) => u.id === userId);
  if (!current) return delay([]);

  const pool = usersStore.filter((u) => u.role !== current.role);

  const maxPossible =
    current.topics.length * TOPIC_WEIGHT + current.languages.length * LANGUAGE_WEIGHT;

  const results: Match[] = pool.map((u) => {
    const sharedTopics = current.topics.filter((t) => u.topics.includes(t));
    const sharedLanguages = current.languages.filter((l) => u.languages.includes(l));
    const raw = sharedTopics.length * TOPIC_WEIGHT + sharedLanguages.length * LANGUAGE_WEIGHT;
    const percent =
      maxPossible > 0
        ? Math.min(99, Math.round(BASE_PERCENT + (raw / maxPossible) * (99 - BASE_PERCENT)))
        : BASE_PERCENT;
    return { user: u, percent, sharedTopics, sharedLanguages };
  });

  results.sort((a, b) => b.percent - a.percent);
  return delay(results);
}

// TODO(backend): replace this templated sentence with a real Claude call
// (via a backend proxy — never call an LLM key from the frontend).
export async function getMatchReason(aId: string, bId: string): Promise<string> {
  const a = usersStore.find((u) => u.id === aId);
  const b = usersStore.find((u) => u.id === bId);
  if (!a || !b) return delay("");

  const sharedTopics = a.topics.filter((t) => b.topics.includes(t));
  const sharedLanguages = a.languages.filter((l) => b.languages.includes(l));

  let reason: string;
  if (sharedTopics.length > 0) {
    reason = `You both share ${sharedTopics.join(" and ")} — ${b.name}'s experience lines up closely with what you're navigating now.`;
  } else if (sharedLanguages.length > 0) {
    reason = `You share a language with ${b.name}, which can make it easier to open up about what's on your mind.`;
  } else {
    reason = `${b.name}'s background offers a different perspective that could still be valuable for your journey.`;
  }
  return delay(reason);
}

// TODO(backend): replace with a real Claude-generated summary of the
// actual conversation transcript once calls are real.
export async function getStorySummary(_context?: {
  userId?: string;
  topic?: string;
}): Promise<string> {
  return delay(
    "It's never too late to begin again. I re-took my nursing exams at 38. It was hard, but it reminded me that courage grows with each small step.",
  );
}

export async function requestCall(
  fromId: string,
  toId: string,
  opts?: { postId?: string; intent?: RequestIntent; topic?: string },
): Promise<CallRequest> {
  const request: CallRequest = {
    id: `req-${Date.now()}-${nextRequestId++}`,
    fromId,
    toId,
    postId: opts?.postId,
    intent: opts?.intent ?? "seek",
    status: "pending",
    topic: opts?.topic,
    createdAt: new Date().toISOString(),
  };
  requestsStore = [request, ...requestsStore];
  return delay(request);
}

export async function getRequests(userId: string): Promise<CallRequest[]> {
  return delay(requestsStore.filter((r) => r.toId === userId));
}

export async function respondRequest(
  id: string,
  action: "accept" | "decline",
): Promise<CallRequest | undefined> {
  const request = requestsStore.find((r) => r.id === id);
  if (request) {
    request.status = action === "accept" ? "accepted" : "declined";
  }
  return delay(request);
}

// TODO(backend): persist interactions server-side for future ML-driven
// matching once a backend exists. Logged locally for now.
export async function logInteraction(
  event: Omit<Interaction, "id" | "createdAt">,
): Promise<Interaction> {
  const interaction: Interaction = {
    ...event,
    id: `int-${Date.now()}-${nextInteractionId++}`,
    createdAt: new Date().toISOString(),
  };
  interactionsStore = [interaction, ...interactionsStore];
  console.log("[viowise] interaction logged", interaction);
  return delay(interaction);
}
