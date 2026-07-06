export type Role = "mentor" | "learner";
export type TextSize = "Standard" | "Large" | "Extra large";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  age?: number;
  bio?: string;
  credential?: string;
  topics: string[];
  languages: string[];
  availability?: string;
  createdAt: string;
}

export type PostType = "wisdom" | "reflection" | "call_summary";
export type PostSource = "direct" | "call";
export type PostStatus = "published" | "pending_approval";

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  quote: string;
  title?: string;
  topic: string;
  source: PostSource;
  status: PostStatus;
  partnerId?: string;
  isNew?: boolean;
  createdAt: string;
}

export type RequestIntent = "seek" | "offer";
export type RequestStatus = "pending" | "accepted" | "declined";

export interface CallRequest {
  id: string;
  fromId: string;
  toId: string;
  intent: RequestIntent;
  topic?: string;
  postId?: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Match {
  user: User;
  percent: number;
  sharedTopics: string[];
  sharedLanguages: string[];
}

export const TOPICS = [
  "Career",
  "Family",
  "Migration",
  "Health",
  "Confidence",
  "Study",
  "Relationships",
  "Resilience",
];
