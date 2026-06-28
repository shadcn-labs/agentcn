import type { RegistryFile } from "@/lib/db/schema";

export type Framework = "eve" | "flue";

/** Left-rail scope: every agent, the signed-in user's, or the ones they liked. */
export type Scope = "all" | "my" | "liked";

export type Sort = "popular" | "newest" | "oldest";

export type TimeWindow = "all" | "week" | "month" | "year";

export const SORTS: { value: Sort; label: string }[] = [
  { label: "Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

export const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { label: "All Time", value: "all" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

/** Curated tag suggestions used by the publish form. Free-form tags are allowed. */
export const SUGGESTED_TAGS = [
  "research",
  "automation",
  "coding",
  "data",
  "search",
  "content",
  "productivity",
  "support",
  "devtools",
  "fun",
] as const;

export interface CommunityAgentCard {
  code: string;
  framework: Framework;
  title: string;
  description: string;
  likeCount: number;
  createdAt: Date;
  isLiked: boolean;
  authorName: string;
  authorImage: string | null;
  tags: string[];
}

export interface CommunityAgentDetail extends CommunityAgentCard {
  files: RegistryFile[];
  dependencies: string[];
}

export const isFramework = (value: unknown): value is Framework =>
  value === "eve" || value === "flue";

export const parseSort = (value: unknown): Sort =>
  SORTS.some((s) => s.value === value) ? (value as Sort) : "popular";

export const parseWindow = (value: unknown): TimeWindow =>
  TIME_WINDOWS.some((w) => w.value === value) ? (value as TimeWindow) : "all";

export const parseScope = (value: unknown): Scope =>
  value === "my" || value === "liked" ? value : "all";

/** Returns the earliest createdAt allowed for a time window, or null for "all". */
export const windowStart = (window: TimeWindow): Date | null => {
  if (window === "all") {
    return null;
  }
  const now = Date.now();
  const daysByWindow = { month: 30, week: 7, year: 365 } as const;
  const days = daysByWindow[window];
  return new Date(now - days * 24 * 60 * 60 * 1000);
};
