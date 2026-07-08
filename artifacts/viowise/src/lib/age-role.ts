import type { Role } from "@/types";

// The single source of truth for the mentor/learner age boundary.
// Mentors must be 60 or older; learners must be under 60.
export const MENTOR_MIN_AGE = 60;

// Friendly, on-brand copy explaining the rule — reused anywhere the rule is surfaced.
export const AGE_ROLE_EXPLANATION =
  "VIOWISE connects mentors (60+) who share wisdom with learners (under 60) who seek it.";

// Derives the only valid role for a given age. Returns null when age isn't a
// usable positive number yet (e.g. empty input mid-typing).
export function roleForAge(age: number): Role | null {
  if (!Number.isFinite(age) || age <= 0) return null;
  return age >= MENTOR_MIN_AGE ? "mentor" : "learner";
}

// True when the given age/role pair is a valid combination under the rule.
// Used as a final guard right before account creation or a profile save.
export function isAgeRoleConsistent(age: number, role: Role | null): boolean {
  const expected = roleForAge(age);
  return expected !== null && expected === role;
}
