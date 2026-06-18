import { SITE } from "@/constants/site";

/**
 * Shared catalog of agent recipes and the frameworks they ship for.
 *
 * This is the single source of truth that drives the per-framework docs split,
 * the install command tabs, and the home page agent preview (sidebar, framework
 * switcher, and chat preview). Add a new recipe here and it shows up everywhere.
 */

export type FrameworkId = "eve" | "flue";

export interface Framework {
  id: FrameworkId;
  label: string;
}

export const FRAMEWORKS: readonly Framework[] = [
  { id: "eve", label: "Eve" },
  { id: "flue", label: "Flue" },
] as const;

export const FRAMEWORK_LABEL: Record<FrameworkId, string> = {
  eve: "Eve",
  flue: "Flue",
};

/** A single turn in an agent's sample chat transcript shown in the preview. */
export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "agent"; text: string }
  | { role: "tool"; tool: string; detail: string };

export interface AgentInputField {
  name: string;
  label: string;
  placeholder: string;
  type: "text" | "textarea" | "url-list";
}

export interface Agent {
  /** URL/registry slug, e.g. "competitor-intel". */
  slug: string;
  title: string;
  /** Short label used in the sidebar list. */
  shortTitle: string;
  description: string;
  /** Frameworks this recipe is available for. */
  frameworks: FrameworkId[];
  inputFields: AgentInputField[];
  /** Sample transcript per framework, rendered in the home chat preview. */
  transcript: Record<FrameworkId, ChatMessage[]>;
}

const competitorIntel: Agent = {
  description:
    "Scrapes and analyzes competitor pages, then returns a structured intelligence report.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Competitor URLs",
      name: "urls",
      placeholder: "https://competitor-a.com\nhttps://competitor-b.com",
      type: "url-list",
    },
  ],
  shortTitle: "Competitor Intelligence",
  slug: "competitor-intel",
  title: "Competitor Intelligence Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Analyze https://linear.app and https://height.app",
      },
      {
        detail: "https://linear.app",
        role: "tool",
        tool: "scrape_url",
      },
      {
        detail: "https://height.app",
        role: "tool",
        tool: "scrape_url",
      },
      {
        detail: "2 competitors",
        role: "tool",
        tool: "synthesize_report",
      },
      {
        role: "agent",
        text: "Report ready. Linear leads on speed and keyboard-first UX with usage-based pricing; Height positions around an AI-native, autonomous project tool. Both target product teams — Linear emphasizes craft, Height emphasizes automation.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Analyze https://linear.app and https://height.app",
      },
      {
        detail: "https://linear.app",
        role: "tool",
        tool: "dispatch analyst",
      },
      {
        detail: "https://height.app",
        role: "tool",
        tool: "dispatch analyst",
      },
      {
        detail: "fan-out to subagents",
        role: "tool",
        tool: "scrape_url",
      },
      {
        role: "agent",
        text: "Workflow complete. The analyst subagents returned structured findings per page; the orchestrator merged them into one report covering positioning, pricing tiers, and key features for both competitors.",
      },
    ],
  },
};

export const AGENTS: readonly Agent[] = [competitorIntel] as const;

export const getAgent = (slug: string): Agent | undefined =>
  AGENTS.find((agent) => agent.slug === slug);

/** `npx shadcn@latest add` command for a recipe in a given framework. */
export const installCommand = (framework: FrameworkId, slug: string): string =>
  `npx shadcn@latest add ${SITE.REGISTRY}/r/${framework}/${slug}`;
