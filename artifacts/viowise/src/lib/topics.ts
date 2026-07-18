// Canonical list that matches the posts_topic_check DB constraint.
// Import from here everywhere topics are displayed or validated.
export const ALLOWED_TOPICS = [
  "Career",
  "Family",
  "Migration",
  "Health",
  "Confidence",
  "Study",
  "Relationships",
  "Resilience",
] as const;

export type AllowedTopic = (typeof ALLOWED_TOPICS)[number];
