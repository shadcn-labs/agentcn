---
name: seo-audit
description: How to present the deterministic AI-SEO audit returned by audit_page. Use when reporting a page's readability and citation-readiness for AI answer engines (ChatGPT, Claude, Perplexity).
---

## What this measures

How well a page can be **crawled, chunked, understood, and cited by AI answer
engines** — not classic blue-link SEO. The `audit_page` tool computes this
deterministically: page data flows through context.dev, then a fixed rubric of
~30 checks scores six categories into a 0–100 total. Your job is to **present**
that result, not to re-score it.

## The result shape

`audit_page` returns JSON with:

- `score` (0–100) and `band` (`{ label, interpretation }`).
- `stats` — words, headings, links, externalLinks, jsonLdBlocks, char counts.
- `categories[]` — each `{ id, name, score, maxScore, naExcluded, items[] }`.
- `categories[].items[]` — each check: `{ id, label, status, evidence,
  recommendation, score, maxScore }`. `status` is `pass | partial | fail | na`.
- `topPriorities[]` — the highest-impact failing/partial checks, pre-sorted.
- `agentPrompts` — `{ full, topIssues[] }`, ready-to-run fix prompts.
- `diagnostics` — context.dev fetch status and JSON-LD parse failures.

## The six categories

| ID | Category | Max |
| -- | -------- | --- |
| A | Technical AI Crawlability | 28.4 |
| B | Content Structure & Chunking | 25.4 |
| C | Structured Data / Schema | 13.4 |
| D | E-E-A-T & Entity Authority | 21.4 |
| E | Off-site / Citation Surface Presence | 8.4 |
| F | Measurement & Governance | 3 |

Scoring (already applied by the tool): `pass` = full weight, `partial` = half,
`fail` = 0, `na` = excluded from the denominator. Bands: **Critical** ≤40 ·
**Below average** ≤55 · **Average** ≤70 · **Strong** ≤85 · **Excellent** >85.

## Output

Report, in order:

1. The overall `score`/100, its `band.label`, and the `band.interpretation`.
2. A per-category breakdown: for each category, `score`/`maxScore` and the
   pass/partial/fail counts.
3. The failing and partial checks, highest-impact first — use `topPriorities`
   and the matching `items` (cite each check's `id`, `evidence`, and
   `recommendation`).
4. The **agent-ready fix prompt**: present `agentPrompts.full` verbatim in a
   copy-paste block.

Report only the checks and numbers the tool returned. Never invent or recompute
scores, checks, evidence, or content.
