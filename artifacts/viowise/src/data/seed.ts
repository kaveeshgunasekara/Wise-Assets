import type { User, Post } from "@/types";

// Intentionally empty. This app ships as a functional shell with no
// hardcoded sample people or posts — every user and post is created
// through the real sign-up and posting flows and stored via
// src/services/api.ts. Swapping this mock service for a real backend
// later is a one-file change; nothing here needs to change.
export const seedUsers: User[] = [];

export const seedPosts: Post[] = [];
