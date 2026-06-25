export type AuditStatus = "pass" | "partial" | "fail" | "na";

export type AuditItem = {
  id: string;
  label: string;
  status: AuditStatus;
  evidence: string;
  recommendation: string;
  score: number;
  maxScore: number;
};

export type AuditCategory = {
  id: string;
  name: string;
  description: string;
  score: number;
  maxScore: number;
  naExcluded: number;
  items: AuditItem[];
};

export type AuditBand = {
  label: "Critical" | "Below average" | "Average" | "Strong" | "Excellent";
  interpretation: string;
};

export type AgentFixPrompts = {
  full: string;
  topIssues: Array<{
    id: string;
    label: string;
    prompt: string;
  }>;
};

export type AuditResult = {
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
};

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
