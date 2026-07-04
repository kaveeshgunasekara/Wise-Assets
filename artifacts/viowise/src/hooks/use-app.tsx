import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "mentor" | "learner" | null;

interface Story {
  id: string;
  author: string;
  age: number;
  credential?: string;
  quote: string;
  title?: string;
  topic: string;
  isNew?: boolean;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: { name: string; age: number; topics: string[] } | null;
  setUser: (user: any) => void;
  textSize: "Standard" | "Large" | "Extra large";
  setTextSize: (size: "Standard" | "Large" | "Extra large") => void;
  highContrast: boolean;
  setHighContrast: (high: boolean) => void;
  stories: Story[];
  addStory: (story: Story) => void;
  pendingStory: Story | null;
  setPendingStory: (story: Story | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const CANONICAL_STORIES: Story[] = [
  { id: "1", author: "Ahmed", age: 68, credential: "Engineer", quote: "I spent 30 years worrying about being behind. Nobody is keeping score but you.", topic: "Career" },
  { id: "2", author: "Maria", age: 75, credential: "Business Owner", quote: "Confidence isn't feeling ready. It's going anyway.", topic: "Confidence" },
  { id: "3", author: "John", age: 81, credential: "Married 55 yrs", quote: "We argued about everything except what mattered. Say the important things first.", topic: "Family" },
  { id: "4", author: "Rosa", age: 66, credential: "Retired Professor", quote: "Failing my first year of university was the best thing that happened to me. It taught me how I actually learn.", topic: "Study" },
  { id: "5", author: "Linh", age: 70, credential: "Moved from Vietnam", quote: "Homesickness never fully goes away. It just becomes a second heartbeat you learn to live with.", topic: "Migration" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<{ name: string; age: number; topics: string[] } | null>(null);
  const [textSize, setTextSize] = useState<"Standard" | "Large" | "Extra large">("Standard");
  const [highContrast, setHighContrast] = useState(false);
  const [stories, setStories] = useState<Story[]>(CANONICAL_STORIES);
  const [pendingStory, setPendingStory] = useState<Story | null>(null);

  useEffect(() => {
    let multiplier = 1;
    if (textSize === "Large") multiplier = 1.15;
    if (textSize === "Extra large") multiplier = 1.3;
    document.documentElement.style.setProperty("--text-size-multiplier", multiplier.toString());
  }, [textSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [highContrast]);

  const addStory = (story: Story) => setStories(prev => [story, ...prev]);

  return (
    <AppContext.Provider value={{
      role, setRole, user, setUser,
      textSize, setTextSize, highContrast, setHighContrast,
      stories, addStory, pendingStory, setPendingStory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within a AppProvider");
  return context;
}
