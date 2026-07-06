import type { User, Post, CallRequest, Match, RequestIntent, PostType, PostStatus, PostSource } from "@/types";

const DELAY_MS = 200;
const STORAGE_KEY = "viowise:db:v1";

interface Db {
  users: User[];
  posts: Post[];
  requests: CallRequest[];
}

function loadDb(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Db>;
      return {
        users: parsed.users ?? [],
        posts: parsed.posts ?? [],
        requests: parsed.requests ?? [],
      };
    }
  } catch {
    // ignore corrupt storage, start fresh
  }
  return { users: [], posts: [], requests: [] };
}

function saveDb() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage unavailable (e.g. private mode) — data stays in-memory only
  }
}

const db: Db = loadDb();

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function getUsers(): Promise<User[]> {
  await delay();
  return [...db.users];
}

export async function getUserById(id: string | null | undefined): Promise<User | null> {
  await delay();
  if (!id) return null;
  return db.users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await delay();
  const normalized = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function createUser(input: Omit<User, "id" | "createdAt">): Promise<User> {
  await delay();
  const user: User = { ...input, id: uid(), createdAt: new Date().toISOString() };
  db.users.push(user);
  saveDb();
  return user;
}

export async function updateUser(id: string, patch: Partial<Omit<User, "id" | "createdAt">>): Promise<User | null> {
  await delay();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  Object.assign(user, patch);
  saveDb();
  return user;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function getPosts(): Promise<Post[]> {
  await delay();
  return [...db.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createPost(input: {
  authorId: string;
  type: PostType;
  quote: string;
  topic: string;
  title?: string;
  source: PostSource;
  status: PostStatus;
  partnerId?: string;
}): Promise<Post> {
  await delay();
  const post: Post = {
    id: uid(),
    createdAt: new Date().toISOString(),
    isNew: false,
    ...input,
  };
  db.posts.unshift(post);
  saveDb();
  return post;
}

export async function editPost(id: string, patch: Partial<Pick<Post, "quote" | "topic" | "title">>): Promise<Post | null> {
  await delay();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return null;
  Object.assign(post, patch);
  saveDb();
  return post;
}

export async function approvePost(id: string): Promise<Post | null> {
  await delay();
  const post = db.posts.find((p) => p.id === id);
  if (!post) return null;
  post.status = "published";
  post.isNew = true;
  saveDb();
  return post;
}

export async function declinePost(id: string): Promise<void> {
  await delay();
  db.posts = db.posts.filter((p) => p.id !== id);
  saveDb();
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function intersect(a: string[], b: string[]): string[] {
  const bSet = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => bSet.has(x.toLowerCase()));
}

export async function getMatches(userId: string): Promise<Match[]> {
  await delay();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return [];

  const opposite = db.users.filter((u) => u.id !== userId && u.role !== user.role);

  const scored = opposite.map((candidate) => {
    const sharedTopics = intersect(user.topics ?? [], candidate.topics ?? []);
    const sharedLanguages = intersect(user.languages ?? [], candidate.languages ?? []);

    const topicPool = new Set([...(user.topics ?? []), ...(candidate.topics ?? [])]).size || 1;
    const languagePool = new Set([...(user.languages ?? []), ...(candidate.languages ?? [])]).size || 1;

    const topicScore = sharedTopics.length / topicPool;
    const languageScore = sharedLanguages.length / languagePool;

    // Weighted: shared topics matter most, shared language is a smaller boost.
    const raw = topicScore * 0.8 + languageScore * 0.2;
    const percent = Math.max(40, Math.min(99, Math.round(raw * 100)));

    return { user: candidate, percent, sharedTopics, sharedLanguages };
  });

  return scored.sort((a, b) => b.percent - a.percent);
}

// TODO(backend): Replace with a Claude-generated, personalized match explanation.
export async function getMatchReason(viewer: User, candidate: User): Promise<string> {
  await delay(80);
  const shared = intersect(viewer.topics ?? [], candidate.topics ?? []);
  if (shared.length === 0) {
    return `${candidate.name} brings a different perspective that could still be valuable to you.`;
  }
  const topicsList = shared.join(" and ");
  return `You both selected ${topicsList} — ${candidate.name}'s experience there lines up closely with what you're navigating.`;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export async function requestCall(
  fromId: string,
  toId: string,
  intent: RequestIntent,
  opts?: { postId?: string; topic?: string }
): Promise<CallRequest> {
  await delay();
  const request: CallRequest = {
    id: uid(),
    fromId,
    toId,
    intent,
    postId: opts?.postId,
    topic: opts?.topic,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.requests.push(request);
  saveDb();
  return request;
}

export async function getRequests(userId: string): Promise<CallRequest[]> {
  await delay();
  return db.requests
    .filter((r) => r.toId === userId || r.fromId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function respondRequest(id: string, action: "accept" | "decline"): Promise<CallRequest | null> {
  await delay();
  const request = db.requests.find((r) => r.id === id);
  if (!request) return null;
  request.status = action === "accept" ? "accepted" : "declined";
  saveDb();
  return request;
}

// ---------------------------------------------------------------------------
// Story capture / analytics
// ---------------------------------------------------------------------------

// TODO(backend): Replace with a real AI-generated summary of the call transcript.
export async function getStorySummary(topic?: string): Promise<{ title: string; quote: string }> {
  await delay(400);
  return {
    title: topic ? `On ${topic.toLowerCase()}` : "A moment worth remembering",
    quote:
      "There was a moment in this conversation that felt worth holding onto. Edit this summary to capture it in your own words before sharing or keeping it private.",
  };
}

// TODO(backend): Send interaction events to the backend for analytics/ranking.
export function logInteraction(event: string, data?: Record<string, unknown>) {
  console.log("[interaction]", event, data ?? {});
}
