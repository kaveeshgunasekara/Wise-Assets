import { supabase } from "./supabase";
import type {
  User,
  Post,
  CallRequest,
  Interaction,
  Match,
  RequestIntent,
} from "@/types";

// Supabase-backed service layer. Every export is async and returns fully-typed
// data from the real database. Function signatures are identical to the previous
// mock layer so no page/component changes are needed.
//
// COLUMN MAPPING (DB snake_case → TS camelCase):
//   posts        : author_id → authorId, is_new → isNew, created_at → createdAt
//   requests     : from_id → fromId, to_id → toId, post_id → postId, created_at → createdAt
//   interactions : user_id → userId, event_type → eventType, target_id → targetId, created_at → createdAt
//   users        : all DB columns match TS field names directly (no mapping needed)
//
// TODO(backend): replace getStorySummary with a real LLM call via a backend proxy.
// TODO(backend): replace getMatchReason templating with a real Claude call via a backend proxy.

// ─── DB row types (snake_case shape returned by Supabase) ─────────────────

type DbPost = {
  id: string;
  author_id: string;
  type: Post["type"];
  quote: string;
  topic: string;
  source: Post["source"];
  status: Post["status"];
  is_new: boolean | null;
  created_at: string;
};

type DbRequest = {
  id: string;
  from_id: string;
  to_id: string;
  post_id: string | null;
  intent: CallRequest["intent"];
  status: CallRequest["status"];
  created_at: string;
};

type DbInteraction = {
  id: string;
  user_id: string;
  event_type: Interaction["eventType"];
  target_id: string;
  score: number | null;
  created_at: string;
};

// ─── Row → type mappers ───────────────────────────────────────────────────

function toPost(r: DbPost): Post {
  return {
    id: r.id,
    authorId: r.author_id,
    type: r.type,
    quote: r.quote,
    topic: r.topic,
    source: r.source,
    status: r.status,
    ...(r.is_new != null && { isNew: r.is_new }),
    createdAt: r.created_at,
  };
}

function toRequest(r: DbRequest): CallRequest {
  return {
    id: r.id,
    fromId: r.from_id,
    toId: r.to_id,
    ...(r.post_id != null && { postId: r.post_id }),
    intent: r.intent,
    status: r.status,
    createdAt: r.created_at,
  };
}

function toInteraction(r: DbInteraction): Interaction {
  return {
    id: r.id,
    userId: r.user_id,
    eventType: r.event_type,
    targetId: r.target_id,
    ...(r.score != null && { score: r.score }),
    createdAt: r.created_at,
  };
}

// ─── 1. Users ─────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) { console.error("[api] getUsers:", error.message); return []; }
  return (data as User[]) ?? [];
  // MOCK: return [...usersStore];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("[api] getUserById:", error.message); return undefined; }
  return (data as User) ?? undefined;
  // MOCK: return usersStore.find((u) => u.id === id);
}

// getUserByEmail is intentionally non-operational: the `email` column does not
// exist on public.users (email lives in auth.users, which is managed by Supabase
// Auth). Sign-in uses supabase.auth.signInWithPassword instead of this function.
// Kept as a stub so any accidental call fails loudly rather than silently.
export async function getUserByEmail(_email: string): Promise<User | undefined> {
  console.error("[api] getUserByEmail: email is not a column on public.users — use supabase.auth.signInWithPassword for authentication.");
  return undefined;
}

// createUser was removed: the handle_new_user() Supabase DB trigger auto-inserts
// the public.users row on auth.signUp, reading name/age/role from user_metadata.
// Inserting again here would conflict with (or duplicate) that trigger row.
// Profile updates (topics, languages, bio) are handled by updateUser() below.

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, "id">>,
): Promise<User | undefined> {
  // Strip fields that do not exist as columns in public.users.
  // email lives in auth.users (managed by Supabase Auth).
  // credential is not a column in this project's schema.
  const { email: _e, credential: _c, ...safeUpdates } = updates as Record<string, unknown>;
  const { data, error } = await supabase
    .from("users")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[api] updateUser:", error.message); return undefined; }
  return (data as User) ?? undefined;
  // MOCK: const user = usersStore.find((u) => u.id === id); if (user) Object.assign(user, updates); return user;
}

// ─── 2. Posts ─────────────────────────────────────────────────────────────

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("[api] getPosts:", error.message); return []; }
  return ((data as DbPost[]) ?? []).map(toPost);
  // MOCK: return [...postsStore];
}

export async function createPost(input: Omit<Post, "id" | "createdAt">): Promise<Post> {
  const row = {
    author_id: input.authorId,
    type: input.type,
    quote: input.quote,
    topic: input.topic,
    source: input.source,
    status: input.status,
    is_new: input.isNew ?? false,
  };
  const { data, error } = await supabase.from("posts").insert(row).select().single();
  if (error || !data) throw new Error(`[api] createPost: ${error?.message ?? "no data returned"}`);
  return toPost(data as DbPost);
  // MOCK: const post: Post = { ...input, id: `post-${Date.now()}`, createdAt: new Date().toISOString() }; postsStore = [post, ...postsStore]; return post;
}

export async function approvePost(id: string): Promise<Post | undefined> {
  const { data, error } = await supabase
    .from("posts")
    .update({ status: "published", is_new: true })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[api] approvePost:", error.message); return undefined; }
  return data ? toPost(data as DbPost) : undefined;
  // MOCK: const post = postsStore.find((p) => p.id === id); if (post) { post.status = "published"; post.isNew = true; } return post;
}

export async function declinePost(id: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) console.error("[api] declinePost:", error.message);
  // MOCK: postsStore = postsStore.filter((p) => p.id !== id);
}

// Posts can be edited by their author but never deleted — a story someone
// shared should stay attributable and auditable, just correctable.
export async function editPost(
  id: string,
  updates: Partial<Pick<Post, "quote" | "topic">>,
): Promise<Post | undefined> {
  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[api] editPost:", error.message); return undefined; }
  return data ? toPost(data as DbPost) : undefined;
  // MOCK: const post = postsStore.find((p) => p.id === id); if (post) Object.assign(post, updates); return post;
}

// ─── 3. Matching (scoring stays in JS, user pool comes from DB) ───────────

const TOPIC_WEIGHT = 12;
const LANGUAGE_WEIGHT = 8;
const BASE_PERCENT = 55;

export async function getMatches(userId: string): Promise<Match[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) { console.error("[api] getMatches:", error.message); return []; }

  const users = (data as User[]) ?? [];
  const current = users.find((u) => u.id === userId);
  if (!current) return [];

  const pool = users.filter((u) => u.role !== current.role);
  const maxPossible =
    current.topics.length * TOPIC_WEIGHT + current.languages.length * LANGUAGE_WEIGHT;

  const results: Match[] = pool.map((u) => {
    const sharedTopics = current.topics.filter((t) => u.topics.includes(t));
    const sharedLanguages = current.languages.filter((l) => u.languages.includes(l));
    const raw =
      sharedTopics.length * TOPIC_WEIGHT + sharedLanguages.length * LANGUAGE_WEIGHT;
    const percent =
      maxPossible > 0
        ? Math.min(99, Math.round(BASE_PERCENT + (raw / maxPossible) * (99 - BASE_PERCENT)))
        : BASE_PERCENT;
    return { user: u, percent, sharedTopics, sharedLanguages };
  });

  results.sort((a, b) => b.percent - a.percent);
  return results;
  // MOCK: pool was from usersStore filtered by role — scoring logic identical
}

// TODO(backend): replace this templated sentence with a real Claude call
// (via a backend proxy — never call an LLM key from the frontend).
export async function getMatchReason(aId: string, bId: string): Promise<string> {
  const [{ data: aRow }, { data: bRow }] = await Promise.all([
    supabase.from("users").select("*").eq("id", aId).maybeSingle(),
    supabase.from("users").select("*").eq("id", bId).maybeSingle(),
  ]);
  const a = aRow as User | null;
  const b = bRow as User | null;
  if (!a || !b) return "";

  const sharedTopics = a.topics.filter((t) => b.topics.includes(t));
  const sharedLanguages = a.languages.filter((l) => b.languages.includes(l));

  if (sharedTopics.length > 0) {
    return `You both share ${sharedTopics.join(" and ")} — ${b.name}'s experience lines up closely with what you're navigating now.`;
  }
  if (sharedLanguages.length > 0) {
    return `You share a language with ${b.name}, which can make it easier to open up about what's on your mind.`;
  }
  return `${b.name}'s background offers a different perspective that could still be valuable for your journey.`;
  // MOCK: used usersStore directly — templating logic identical
}

// TODO(backend): replace with a real LLM-generated summary of the actual
// conversation transcript once calls are real.
export async function getStorySummary(_context?: {
  userId?: string;
  topic?: string;
}): Promise<string> {
  return "It's never too late to begin again. I re-took my nursing exams at 38. It was hard, but it reminded me that courage grows with each small step.";
}

// ─── 4. Requests ──────────────────────────────────────────────────────────

export async function requestCall(
  fromId: string,
  toId: string,
  opts?: { postId?: string; intent?: RequestIntent },
): Promise<CallRequest> {
  const row = {
    from_id: fromId,
    to_id: toId,
    ...(opts?.postId && { post_id: opts.postId }),
    intent: opts?.intent ?? "seek",
    status: "pending" as const,
  };
  const { data, error } = await supabase.from("requests").insert(row).select().single();
  if (error || !data) throw new Error(`[api] requestCall: ${error?.message ?? "no data returned"}`);
  return toRequest(data as DbRequest);
  // MOCK: const request = { id: `req-${Date.now()}`, fromId, toId, ...opts, status: "pending", intent: opts?.intent ?? "seek", createdAt: new Date().toISOString() }; requestsStore = [request, ...requestsStore]; return request;
}

export async function getRequests(userId: string): Promise<CallRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("to_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[api] getRequests:", error.message); return []; }
  return ((data as DbRequest[]) ?? []).map(toRequest);
  // MOCK: return requestsStore.filter((r) => r.toId === userId);
}

export async function getSentRequests(userId: string): Promise<CallRequest[]> {
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("from_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[api] getSentRequests:", error.message); return []; }
  return ((data as DbRequest[]) ?? []).map(toRequest);
}

export async function respondRequest(
  id: string,
  action: "accept" | "decline",
): Promise<CallRequest | undefined> {
  const status = action === "accept" ? "accepted" : "declined";
  const { data, error } = await supabase
    .from("requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) { console.error("[api] respondRequest:", error.message); return undefined; }
  return data ? toRequest(data as DbRequest) : undefined;
  // MOCK: const request = requestsStore.find((r) => r.id === id); if (request) request.status = action === "accept" ? "accepted" : "declined"; return request;
}

// ─── 5. Interactions ──────────────────────────────────────────────────────

// TODO(backend): persist interactions server-side for future ML-driven matching.
export async function logInteraction(
  event: Omit<Interaction, "id" | "createdAt">,
): Promise<Interaction> {
  const row = {
    user_id: event.userId,
    event_type: event.eventType,
    target_id: event.targetId,
    ...(event.score != null && { score: event.score }),
  };
  const { data, error } = await supabase.from("interactions").insert(row).select().single();
  if (error || !data) {
    // Non-fatal: return a local-only interaction so a logging failure never
    // breaks the user-facing flow it's attached to.
    console.error("[api] logInteraction (non-fatal):", error?.message);
    return { ...event, id: `int-local-${Date.now()}`, createdAt: new Date().toISOString() };
  }
  return toInteraction(data as DbInteraction);
  // MOCK: const interaction = { ...event, id: `int-${Date.now()}`, createdAt: new Date().toISOString() }; interactionsStore = [...]; return interaction;
}
