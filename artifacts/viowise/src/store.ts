import { reactive, watch } from "vue";

export interface Story {
  id: string;
  author: string;
  age: number;
  credential?: string;
  quote: string;
  title?: string;
  topic: string;
  isNew?: boolean;
}

export interface User {
  name: string;
  age: number;
  topics: string[];
  bio?: string;
  languages?: string;
}

export type Role = "mentor" | "learner" | null;
export type TextSize = "Standard" | "Large" | "Extra large";

export const CANONICAL_STORIES: Story[] = [
  { id: "1", author: "Ahmed", age: 68, credential: "Engineer", quote: "I spent 30 years worrying about being behind. Nobody is keeping score but you.", topic: "Career" },
  { id: "2", author: "Maria", age: 75, credential: "Business Owner", quote: "Confidence isn't feeling ready. It's going anyway.", topic: "Confidence" },
  { id: "3", author: "John", age: 81, credential: "Married 55 yrs", quote: "We argued about everything except what mattered. Say the important things first.", topic: "Family" },
  { id: "4", author: "Rosa", age: 66, credential: "Retired Professor", quote: "Failing my first year of university was the best thing that happened to me. It taught me how I actually learn.", topic: "Study" },
  { id: "5", author: "Linh", age: 70, credential: "Moved from Vietnam", quote: "Homesickness never fully goes away. It just becomes a second heartbeat you learn to live with.", topic: "Migration" },
];

export const store = reactive({
  role: null as Role,
  user: null as User | null,
  textSize: "Standard" as TextSize,
  highContrast: false,
  stories: [...CANONICAL_STORIES] as Story[],
  pendingStory: null as Story | null,

  setRole(role: Role) {
    this.role = role;
  },
  setUser(user: User | null) {
    this.user = user;
  },
  setTextSize(size: TextSize) {
    this.textSize = size;
  },
  setHighContrast(high: boolean) {
    this.highContrast = high;
  },
  addStory(story: Story) {
    this.stories.unshift(story);
  },
  setPendingStory(story: Story | null) {
    this.pendingStory = story;
  },
});

watch(
  () => store.textSize,
  (size) => {
    let multiplier = 1;
    if (size === "Large") multiplier = 1.15;
    if (size === "Extra large") multiplier = 1.3;
    document.documentElement.style.setProperty("--text-size-multiplier", multiplier.toString());
  }
);

watch(
  () => store.highContrast,
  (high) => {
    if (high) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }
);
