export const AUDIENCE_TYPES = [
  "CHILDREN",
  "ADULTS",
  "STUDENTS",
  "PROFESSORS",
] as const;

export type AudienceType = (typeof AUDIENCE_TYPES)[number];

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  CHILDREN: "Children",
  ADULTS: "Adults",
  STUDENTS: "Students",
  PROFESSORS: "Professors / Researchers",
};

export const DEFAULT_AUDIENCE: AudienceType = "ADULTS";

export function isAudienceType(value: string): value is AudienceType {
  return (AUDIENCE_TYPES as readonly string[]).includes(value);
}
