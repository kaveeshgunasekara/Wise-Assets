export type Role = "mentor" | "learner";

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: Role;
  topics: string[];
  languages: string[];
  availability: string[];
  bio: string;
  credential?: string;
  verified: boolean;
}

export type PostType = "wisdom" | "reflection" | "call_summary";
export type PostSource = "direct" | "call";
export type PostStatus = "published" | "pending_approval";

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  quote: string;
  topic: string;
  source: PostSource;
  status: PostStatus;
  isNew?: boolean;
  createdAt: string;
}

export type RequestIntent = "seek" | "offer";
export type RequestStatus = "pending" | "accepted" | "declined" | "completed";

export interface CallRequest {
  id: string;
  fromId: string;
  toId: string;
  postId?: string;
  intent: RequestIntent;
  status: RequestStatus;
  topic?: string;
  createdAt: string;
}

export type InteractionEventType =
  | "match_shown"
  | "accepted"
  | "declined"
  | "post_viewed"
  | "call_requested";

export interface Interaction {
  id: string;
  userId: string;
  eventType: InteractionEventType;
  targetId: string;
  score?: number;
  createdAt: string;
}

export interface Match {
  user: User;
  percent: number;
  sharedTopics: string[];
  sharedLanguages: string[];
}
