export interface Category {
  name: string;
  slug: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  {
    description: "Agents for analyzing data, metrics, and user behavior.",
    name: "Analytics",
    slug: "analytics",
  },
  {
    description: "Agents for creating, managing, and publishing content.",
    name: "Content",
    slug: "content",
  },
  {
    description:
      "Agents for monitoring, debugging, and maintaining applications.",
    name: "DevOps",
    slug: "devops",
  },
  {
    description: "Agents for search engine optimization and web accessibility.",
    name: "SEO",
    slug: "seo",
  },
  {
    description: "Agents for customer support and communication.",
    name: "Support",
    slug: "support",
  },
  {
    description: "Agents for product analytics and user onboarding.",
    name: "Product",
    slug: "product",
  },
  {
    description: "Agents for developer experience and workflow automation.",
    name: "Developer",
    slug: "developer",
  },
];

export const AGENT_CATEGORIES: Record<string, string> = {
  "a11y-auditor": "seo",
  "analytics-digest": "analytics",
  "backlink-prospector": "seo",
  "community-support": "support",
  "competitor-analysis": "product",
  "content-agent": "content",
  "cro-optimizer": "analytics",
  "dep-guardian": "devops",
  "docs-sync": "devops",
  dunning: "support",
  "error-copy": "developer",
  "error-triage": "devops",
  "experiment-analyst": "analytics",
  "funnel-analyst": "analytics",
  "onboarding-coach": "product",
  "onboarding-tester": "product",
  "perf-auditor": "devops",
  postiz: "content",
  "ppc-assist": "analytics",
  "release-notes": "content",
  "sanity-docs-feedback": "content",
  "seo-improver": "seo",
  "standup-bot": "developer",
  "stripe-pulse": "product",
  "support-replies": "support",
  "ux-reviewer": "developer",
  "website-qa": "seo",
};
