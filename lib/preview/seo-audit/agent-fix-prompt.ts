import type { AgentFixPrompts, AuditItem, AuditResult } from "./audit-types";

type PromptAudit = Omit<AuditResult, "agentPrompts">;

type PromptIssue = AuditItem & {
  categoryId: string;
  categoryName: string;
};

const ACTIONABLE_STATUSES = new Set(["fail", "partial"]);

export function buildAgentFixPrompts(audit: PromptAudit): AgentFixPrompts {
  const issues = audit.categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryId: category.id,
      categoryName: category.name,
    }))
  );

  const actionable = issues
    .filter((issue) => ACTIONABLE_STATUSES.has(issue.status))
    .toSorted((a, b) => b.maxScore - a.maxScore || a.id.localeCompare(b.id));

  const topIssues = actionable.slice(0, 8).map((issue) => ({
    id: issue.id,
    label: issue.label,
    prompt: buildIssuePrompt(audit, issue),
  }));

  return {
    full: buildFullPrompt(audit, actionable),
    topIssues,
  };
}

function buildFullPrompt(
  audit: PromptAudit,
  actionable: PromptIssue[]
): string {
  const issueLines = actionable.length
    ? actionable.map(formatIssue).join("\n\n")
    : "No failing or partial automated checks were found.";

  return `You are an AI SEO implementation agent. Improve the audited page so it is easier for AI answer engines to crawl, parse, trust, and cite.

Target URL: ${audit.url}
Current score: ${audit.score}/100 (${audit.band.label})
Audit source: guidelines.md in this repository

Rules:
- Fix the issues below in priority order.
- Preserve the page's existing product intent and brand voice.
- Do not fabricate off-site authority, reviews, authorship, credentials, dates, or analytics evidence.
- Prefer server-rendered HTML for critical copy, headings, FAQs, schema, and metadata.
- After changes, run the project's lint, typecheck, and build commands if available.

Automated issues to fix:
${issueLines}

Expected output from you:
1. A concise summary of what changed.
2. The files changed.
3. The verification commands run and their results.`;
}

function buildIssuePrompt(audit: PromptAudit, issue: PromptIssue): string {
  return `You are an AI SEO implementation agent. Fix this single audit finding.

Target URL: ${audit.url}
Finding: ${issue.id} ${issue.label}
Category: ${issue.categoryName}
Status: ${issue.status}
Score impact: ${issue.maxScore.toFixed(1)} possible points
Evidence: ${issue.evidence}
Required fix: ${issue.recommendation}

Acceptance criteria:
- The fix is visible in raw server-rendered HTML when relevant.
- The change does not fabricate facts, off-site authority, authors, credentials, or dates.
- The page remains useful to human readers.
- Lint, typecheck, and build pass if this is a codebase change.

Report back with files changed and verification performed.`;
}

function formatIssue(issue: PromptIssue): string {
  return `- ${issue.id} ${issue.label}
  Category: ${issue.categoryName}
  Status: ${issue.status}
  Score impact: ${issue.maxScore.toFixed(1)} possible points
  Evidence: ${issue.evidence}
  Required fix: ${issue.recommendation}`;
}
