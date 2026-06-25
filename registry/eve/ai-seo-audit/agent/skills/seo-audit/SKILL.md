---
name: seo-audit
description: Rubric for auditing a page's readability to AI answer engines (ChatGPT, Claude, Perplexity). Use when scoring a page for AI discoverability and citation.
---

## What this measures

How well a page can be **crawled, chunked, understood, and cited by AI answer
engines** — not classic blue-link SEO. Score each of the six categories out of
its max, then sum to a 0–100 total.

## Categories (each scored out of its max)

1. **Technical AI Crawlability** (20) — Is the page reachable and renderable
   without JS? `robots`/`llms.txt` allow AI crawlers, clean status, canonical
   tag, content present in server HTML, no critical content behind client-side
   rendering.
2. **Content Structure & Chunking** (20) — One clear `<h1>`, logical heading
   hierarchy, self-contained sections, short answer-shaped paragraphs, lists and
   tables for facts, a TL;DR or summary near the top.
3. **Structured Data / Schema** (15) — Valid JSON-LD (`Article`, `FAQPage`,
   `Organization`, `Breadcrumb`, etc.), accurate types, entities marked up.
4. **E-E-A-T & Entity Authority** (20) — Named author with bio/credentials,
   clear publish/updated dates, citations to primary sources, an `Organization`
   /`Person` entity an engine can resolve.
5. **Off-site / Citation Surface** (15) — Signals that the page/brand is
   referenced elsewhere: consistent naming, outbound links to authorities,
   shareable canonical URLs, presence in knowledge sources.
6. **Measurement & Governance** (10) — Freshness cadence, a content owner,
   change tracking, and a way to verify the page stays accurate over time.

## Scoring

Per check: `pass` = full weight, `partial` = half, `fail` = 0, `na` = excluded
from the denominator. Category score = sum of its checks. Overall = sum of
categories, rounded to one decimal.

Bands: **Critical** ≤40 · **Below average** ≤55 · **Average** ≤70 ·
**Strong** ≤85 · **Excellent** >85.

## Output

Report, in order:

1. Overall score (0–100) and band.
2. A per-category table: score / max and a one-line reason.
3. The failing and partial checks, highest-impact first.
4. An **agent-ready fix prompt** — a copy-paste block a coding agent can run to
   fix the top failures, referencing the concrete page elements involved.

Only assert what the fetched Markdown and HTML support. Never invent tags,
schema, or content that is not in the page.
