export type AuditStatus = "pass" | "partial" | "fail" | "na";

export interface AuditItem {
  id: string;
  label: string;
  status: AuditStatus;
  evidence: string;
  recommendation: string;
  score: number;
  maxScore: number;
}

export interface AuditCategory {
  id: string;
  name: string;
  description: string;
  score: number;
  maxScore: number;
  naExcluded: number;
  items: AuditItem[];
}

export interface AuditBand {
  label: "Critical" | "Below average" | "Average" | "Strong" | "Excellent";
  interpretation: string;
}

export interface AgentFixPrompts {
  full: string;
  topIssues: {
    id: string;
    label: string;
    prompt: string;
  }[];
}

export interface AuditResult {
  url: string;
  host: string;
  title: string | null;
  description: string | null;
  fetchedAt: string;
  score: number;
  band: AuditBand;
  topPriorities: string[];
  agentPrompts: AgentFixPrompts;
  stats: {
    markdownChars: number;
    rawHtmlChars: number;
    words: number;
    headings: number;
    links: number;
    externalLinks: number;
    jsonLdBlocks: number;
  };
  categories: AuditCategory[];
  diagnostics: {
    contextDevMarkdown: "ready" | "empty" | "failed";
    contextDevHtml: "ready" | "empty" | "failed";
    jsonLdParseFailures: number;
  };
}

export type AuditApiResponse =
  | {
      status: "ready";
      audit: AuditResult;
      cached: boolean;
      updatedAt?: number;
    }
  | {
      status: "error" | "missing-env";
      message: string;
      missing?: string[];
    };
