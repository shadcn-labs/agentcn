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
  /** URL/registry slug, e.g. "deep-search". */
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

const deepSearch: Agent = {
  description:
    "Researches a question, evaluates its own findings, and iterates until the answer is complete and cited.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Research question",
      name: "question",
      placeholder:
        "What pricing models do the top 3 observability vendors use?",
      type: "textarea",
    },
  ],
  shortTitle: "Deep Search",
  slug: "deep-search",
  title: "Deep Search Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "What pricing models do the top observability vendors use?",
      },
      {
        detail: "observability vendor pricing 2026",
        role: "tool",
        tool: "web_search",
      },
      {
        detail: "evaluating coverage — 1 gap found",
        role: "tool",
        tool: "web_search",
      },
      {
        role: "agent",
        text: "Datadog and New Relic both moved to usage-based pricing (per-host + ingested GB); Grafana Cloud leads with a generous free tier and active-series billing. Each claim is cited to the vendor's pricing page.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "What pricing models do the top observability vendors use?",
      },
      {
        detail: "fan-out: 3 searcher subagents",
        role: "tool",
        tool: "dispatch searcher",
      },
      {
        detail: "no gaps remain",
        role: "tool",
        tool: "dispatch evaluator",
      },
      {
        role: "agent",
        text: "Workflow complete. Searcher subagents gathered sourced findings per vendor; the evaluator confirmed coverage before the orchestrator returned a cited answer.",
      },
    ],
  },
};

const csvToQuestions: Agent = {
  description:
    "Summarizes a CSV dataset to stay within token limits, then generates focused analytical questions.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "CSV URL",
      name: "url",
      placeholder: "https://example.com/world-gdp.csv",
      type: "text",
    },
  ],
  shortTitle: "CSV to Questions",
  slug: "csv-to-questions",
  title: "CSV to Questions Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Generate questions for https://example.com/world-gdp.csv",
      },
      {
        detail: "https://example.com/world-gdp.csv",
        role: "tool",
        tool: "fetch_csv",
      },
      {
        role: "agent",
        text: "Dataset: 190 rows × 5 columns (country, year, gdp_usd, growth_pct, population). Questions: Which countries had the highest GDP growth in 2025? How does GDP per capita correlate with growth? Which regions show declining GDP year over year?",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Generate questions for https://example.com/world-gdp.csv",
      },
      {
        detail: "summarizer → questioner",
        role: "tool",
        tool: "fetch_csv",
      },
      {
        role: "agent",
        text: "Workflow complete. The summarizer compressed the dataset to a column profile; the questioner produced analytical questions grounded in those columns.",
      },
    ],
  },
};

const feedbackSummary: Agent = {
  description:
    "Retrieves, categorizes, and summarizes customer feedback into an executive report with recommendations.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Request",
      name: "query",
      placeholder: "What are the critical issues from enterprise customers?",
      type: "text",
    },
  ],
  shortTitle: "Feedback Summary",
  slug: "feedback-summary",
  title: "Customer Feedback Summary Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "What are the critical issues from enterprise customers?",
      },
      {
        detail: "segment=enterprise, page 1–2",
        role: "tool",
        tool: "get_feedback",
      },
      {
        role: "agent",
        text: "Top enterprise themes: SSO reliability (12 reports, high severity), slow CSV exports (8), and unclear audit logs (5). Recommendation: prioritize the SSO fix this sprint and add export pagination.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "What are the critical issues from enterprise customers?",
      },
      {
        detail: "segment=enterprise, paginated",
        role: "tool",
        tool: "get_feedback",
      },
      {
        role: "agent",
        text: "Retrieved and categorized enterprise feedback, then returned an executive summary with the top themes by volume and severity plus concrete recommendations.",
      },
    ],
  },
};

const meetingNotes: Agent = {
  description:
    "Turns a raw meeting transcript into a structured summary, decisions, and action items.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Transcript",
      name: "transcript",
      placeholder: "Paste the raw meeting transcript here…",
      type: "textarea",
    },
  ],
  shortTitle: "Meeting Notes",
  slug: "meeting-notes",
  title: "Meeting Notes Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Turn this standup transcript into notes…",
      },
      {
        detail: "3 decisions, 4 action items",
        role: "tool",
        tool: "save_notes",
      },
      {
        role: "agent",
        text: "Summary captured. Decisions: ship v2 Friday, freeze the schema, drop the legacy export. Action items: Aniket — finalize migration; Sam — write release notes; unassigned — update docs.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Turn this standup transcript into notes…",
      },
      {
        detail: "structured Notes schema",
        role: "tool",
        tool: "notetaker workflow",
      },
      {
        role: "agent",
        text: "Workflow complete. The transcript was parsed into a typed Notes object: a summary, the key decisions, owner/task action items, and open questions.",
      },
    ],
  },
};

const chatWithPdf: Agent = {
  description:
    "Indexes a PDF into a vector store and answers questions over it with page-cited retrieval.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "PDF URL",
      name: "url",
      placeholder: "https://example.com/whitepaper.pdf",
      type: "text",
    },
    {
      label: "Question",
      name: "question",
      placeholder: "What does the paper conclude about latency?",
      type: "text",
    },
  ],
  shortTitle: "Chat with PDF",
  slug: "chat-with-pdf",
  title: "Chat with PDF Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Index whitepaper.pdf and tell me the main conclusion.",
      },
      {
        detail: "42 chunks across 12 pages",
        role: "tool",
        tool: "index_pdf",
      },
      {
        detail: "top 5 chunks",
        role: "tool",
        tool: "search_docs",
      },
      {
        role: "agent",
        text: "The paper concludes that batching cuts p99 latency by ~40% under load (p. 9), with the trade-off of higher memory use (p. 11).",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Index whitepaper.pdf and tell me the main conclusion.",
      },
      {
        detail: "embed + store",
        role: "tool",
        tool: "index_pdf",
      },
      {
        detail: "retrieve relevant chunks",
        role: "tool",
        tool: "search_docs",
      },
      {
        role: "agent",
        text: "Workflow complete. Retrieval returned a typed answer with page-level citations grounded only in the indexed chunks.",
      },
    ],
  },
};

const flashcardsPdf: Agent = {
  description:
    "Turns a PDF into study flash cards, with optional AI-generated images per concept.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "PDF URL",
      name: "url",
      placeholder: "https://example.com/biology-chapter.pdf",
      type: "text",
    },
  ],
  shortTitle: "Flash Cards from PDF",
  slug: "flashcards-pdf",
  title: "Flash Cards from PDF Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Make flash cards from biology-chapter.pdf",
      },
      {
        detail: "biology-chapter.pdf",
        role: "tool",
        tool: "parse_pdf",
      },
      {
        role: "agent",
        text: 'Created 18 cards. Front: "What is the powerhouse of the cell?" Back: "The mitochondrion." Ask for images to attach a generated illustration per card.',
      },
    ],
    flue: [
      {
        role: "user",
        text: "Make flash cards from biology-chapter.pdf with images",
      },
      {
        detail: "extract text",
        role: "tool",
        tool: "parse_pdf",
      },
      {
        detail: "one image per card",
        role: "tool",
        tool: "generate_image",
      },
      {
        role: "agent",
        text: "Workflow complete. Returned a typed Flashcards object — front/back pairs plus an image URL on each card.",
      },
    ],
  },
};

const chatWithYoutube: Agent = {
  description:
    "Fetches a video's metadata and transcript, then answers questions with clickable timestamp citations.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "YouTube URL",
      name: "url",
      placeholder: "https://youtu.be/dQw4w9WgXcQ",
      type: "text",
    },
    {
      label: "Question",
      name: "question",
      placeholder: "Summarize the video with chapter timestamps.",
      type: "text",
    },
  ],
  shortTitle: "Chat with YouTube",
  slug: "chat-with-youtube",
  title: "Chat with YouTube Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Summarize this talk with chapter timestamps.",
      },
      {
        detail: "title + author",
        role: "tool",
        tool: "video_metadata",
      },
      {
        detail: "1,240 segments",
        role: "tool",
        tool: "get_transcript",
      },
      {
        role: "agent",
        text: "Chapters: Intro (00:00), The problem (02:14), Live demo (08:40), Q&A (21:05). Each links straight to that moment in the video.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Summarize this talk with chapter timestamps.",
      },
      {
        detail: "context lookup",
        role: "tool",
        tool: "video_metadata",
      },
      {
        detail: "timestamped segments",
        role: "tool",
        tool: "get_transcript",
      },
      {
        role: "agent",
        text: "Composed the tools in order, then returned a chaptered summary with clickable youtu.be?t= citations grounded in the transcript.",
      },
    ],
  },
};

const docsChatbot: Agent = {
  description:
    "Answers questions about a library's functions by looking up structured documentation.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Question",
      name: "query",
      placeholder: "Tell me about the getPlanetaryData function.",
      type: "text",
    },
  ],
  shortTitle: "Docs Chatbot",
  slug: "docs-chatbot",
  title: "Docs Chatbot Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Tell me about the getPlanetaryData function.",
      },
      {
        detail: "getPlanetaryData",
        role: "tool",
        tool: "lookup_docs",
      },
      {
        role: "agent",
        text: "getPlanetaryData(planet: string): Promise<PlanetaryData> — fetches orbital and physical data for a planet. Example: await getPlanetaryData('mars').",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Tell me about the getPlanetaryData function.",
      },
      {
        detail: "getPlanetaryData",
        role: "tool",
        tool: "lookup_docs",
      },
      {
        role: "agent",
        text: "Returned the signature, description, and a usage example straight from the documentation source — no invented parameters.",
      },
    ],
  },
};

const textToSql: Agent = {
  description:
    "Introspects a database schema, converts questions to SQL, and runs read-only queries.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Question",
      name: "question",
      placeholder: "Show me the top 5 customers by revenue last quarter.",
      type: "text",
    },
  ],
  shortTitle: "Chat with Database",
  slug: "text-to-sql",
  title: "Chat with Database Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Show me the top 5 customers by revenue last quarter.",
      },
      {
        detail: "tables: customers, orders",
        role: "tool",
        tool: "introspect_schema",
      },
      {
        detail: "SELECT ... ORDER BY revenue DESC LIMIT 5",
        role: "tool",
        tool: "run_query",
      },
      {
        role: "agent",
        text: "Top 5 by Q3 revenue: Acme ($82k), Globex ($61k), Initech ($55k), Umbrella ($49k), Soylent ($44k). Query was read-only.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Show me the top 5 customers by revenue last quarter.",
      },
      {
        detail: "schema introspection",
        role: "tool",
        tool: "introspect_schema",
      },
      {
        detail: "execute SELECT",
        role: "tool",
        tool: "run_query",
      },
      {
        role: "agent",
        text: "Introspected the schema, generated a single SELECT, and ran it read-only — returning the ranked customers with the SQL used.",
      },
    ],
  },
};

const githubReview: Agent = {
  description:
    "Fetches a GitHub pull request and returns adaptive, file-by-file code review feedback.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Pull request URL",
      name: "url",
      placeholder: "https://github.com/owner/repo/pull/123",
      type: "text",
    },
  ],
  shortTitle: "GitHub PR Review",
  slug: "github-review",
  title: "GitHub PR Code Review Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Review github.com/acme/api/pull/482",
      },
      {
        detail: "owner=acme repo=api #482 — 7 files",
        role: "tool",
        tool: "fetch_pr",
      },
      {
        role: "agent",
        text: "Found 1 bug (unhandled null in auth.ts), 1 security note (logging a token), and 3 style nits. Recommendation: request changes — fix the null deref and the token log before merge.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Review github.com/acme/api/pull/482",
      },
      {
        detail: "fetch PR + patches",
        role: "tool",
        tool: "fetch_pr",
      },
      {
        role: "agent",
        text: "The pr-review workflow returned a typed Review: a summary, an approve/request-changes recommendation, and per-file comments tagged by severity.",
      },
    ],
  },
};

const slackAgent: Agent = {
  description:
    "Replies to Slack mentions and DMs, scoped to the thread, via the Slack Web API.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Message",
      name: "message",
      placeholder: "@bot what's the status of the deploy?",
      type: "text",
    },
  ],
  shortTitle: "Slack Agent",
  slug: "slack-agent",
  title: "Slack Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "@bot summarize the incident thread above.",
      },
      {
        detail: "channel=#incidents thread_ts=…",
        role: "tool",
        tool: "post_message",
      },
      {
        role: "agent",
        text: "Posted a threaded reply: root cause was a bad config push at 14:02, rolled back by 14:18; follow-up is to add a config canary.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "@bot summarize the incident thread above.",
      },
      {
        detail: "threaded reply",
        role: "tool",
        tool: "post_message",
      },
      {
        role: "agent",
        text: "The agent, mounted behind the Slack Events route, answered scoped to thread_ts and posted the summary back to the channel.",
      },
    ],
  },
};

const googleSheets: Agent = {
  description: "Reads, analyzes, and edits Google Sheets via the Sheets API.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Spreadsheet ID",
      name: "spreadsheetId",
      placeholder: "1A2b3C4d5E6f7G8h9I0j…",
      type: "text",
    },
    {
      label: "Request",
      name: "request",
      placeholder: "Total revenue by region and write it to F1.",
      type: "text",
    },
  ],
  shortTitle: "Google Sheets",
  slug: "google-sheets",
  title: "Google Sheets Analysis Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Total revenue by region in Sheet1.",
      },
      {
        detail: "Sheet1!A1:D200",
        role: "tool",
        tool: "read_range",
      },
      {
        role: "agent",
        text: "Read 200 rows. Totals — West $312k, East $287k, Central $198k. Ask me to write these back and I'll call update_range.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Total revenue by region and write it to F1.",
      },
      {
        detail: "Sheet1!A1:D200",
        role: "tool",
        tool: "read_range",
      },
      {
        detail: "Sheet1!F1:G4",
        role: "tool",
        tool: "update_range",
      },
      {
        role: "agent",
        text: "Read the data, computed per-region totals, and wrote them to F1:G4 — only touching the range you specified.",
      },
    ],
  },
};

const weather: Agent = {
  description:
    "Looks up the current weather for a location via the Open-Meteo API.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Location",
      name: "location",
      placeholder: "Pune",
      type: "text",
    },
  ],
  shortTitle: "Weather",
  slug: "weather",
  title: "Weather Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "What's the weather in Pune?",
      },
      {
        detail: "Pune",
        role: "tool",
        tool: "get_weather",
      },
      {
        role: "agent",
        text: "It's 31°C in Pune, feels like 33°C, light breeze at 9 km/h, mostly clear.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "What's the weather in Pune?",
      },
      {
        detail: "Pune",
        role: "tool",
        tool: "get_weather",
      },
      {
        role: "agent",
        text: "Geocoded the city and fetched current conditions: 31°C, feels like 33°C, light wind, mostly clear.",
      },
    ],
  },
};

const docsExpert: Agent = {
  description:
    "Answers questions about libraries and APIs by searching the live web and citing sources.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Question",
      name: "query",
      placeholder: "How do I stream responses with the Vercel AI SDK?",
      type: "textarea",
    },
  ],
  shortTitle: "Docs Expert",
  slug: "docs-expert",
  title: "Docs Expert Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "How do I stream responses with the Vercel AI SDK?",
      },
      {
        detail: "vercel ai sdk streamText",
        role: "tool",
        tool: "web_search",
      },
      {
        role: "agent",
        text: "Use `streamText` from `ai` and return `result.toDataStreamResponse()` from your route — example and details cited from the official AI SDK docs.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "How do I stream responses with the Vercel AI SDK?",
      },
      {
        detail: "official docs first",
        role: "tool",
        tool: "web_search",
      },
      {
        role: "agent",
        text: "Searched, preferred the official documentation, and returned a copy-pasteable example with every claim cited to a source URL.",
      },
    ],
  },
};

const claw: Agent = {
  description:
    "Operates a sandboxed workspace — read/write files and run shell commands — to finish multi-step tasks.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Task",
      name: "task",
      placeholder: "Scaffold a Vite + React app in ./app and run the build.",
      type: "textarea",
    },
  ],
  shortTitle: "Claw Assistant",
  slug: "claw",
  title: "Claw Autonomous Assistant",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Add a CHANGELOG.md summarizing recent commits.",
      },
      {
        detail: "git log --oneline -n 20",
        role: "tool",
        tool: "run_shell",
      },
      {
        detail: "CHANGELOG.md",
        role: "tool",
        tool: "write_file",
      },
      {
        role: "agent",
        text: "Done. Read the last 20 commits, grouped them by type, and wrote CHANGELOG.md in the workspace.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Add a CHANGELOG.md summarizing recent commits.",
      },
      {
        detail: "inspect repo",
        role: "tool",
        tool: "run_shell",
      },
      {
        detail: "CHANGELOG.md",
        role: "tool",
        tool: "write_file",
      },
      {
        role: "agent",
        text: "Planned the task, inspected before acting, and wrote the file — all scoped to the sandboxed workspace.",
      },
    ],
  },
};

const browserAgent: Agent = {
  description:
    "Drives a real browser with Playwright using a snapshot-and-selector pattern to complete web tasks.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Task",
      name: "task",
      placeholder:
        "Go to news.ycombinator.com and list the top 3 story titles.",
      type: "textarea",
    },
  ],
  shortTitle: "Browser Agent",
  slug: "browser-agent",
  title: "Browser Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "List the top 3 stories on Hacker News.",
      },
      {
        detail: "https://news.ycombinator.com",
        role: "tool",
        tool: "browser_goto",
      },
      {
        detail: "title + interactive elements",
        role: "tool",
        tool: "browser_snapshot",
      },
      {
        role: "agent",
        text: "Top 3 right now: 1) a Postgres performance deep-dive, 2) a new local-first sync engine, 3) Show HN for a terminal file manager.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "List the top 3 stories on Hacker News.",
      },
      {
        detail: "open + snapshot",
        role: "tool",
        tool: "browser_goto",
      },
      {
        detail: "read elements",
        role: "tool",
        tool: "browser_snapshot",
      },
      {
        role: "agent",
        text: "Opened the page, snapshotted it for stable selectors, and read off the top stories — re-snapshotting before acting.",
      },
    ],
  },
};

const companyKnowledge: Agent = {
  description:
    "Indexes internal documents into a vector store and answers questions over them, with PII redaction.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Question",
      name: "query",
      placeholder: "What's our policy on refund requests over $500?",
      type: "text",
    },
  ],
  shortTitle: "Company Knowledge",
  slug: "company-knowledge",
  title: "Company Knowledge Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "What's our policy on refunds over $500?",
      },
      {
        detail: "top 5 passages",
        role: "tool",
        tool: "search_knowledge",
      },
      {
        role: "agent",
        text: "Per the Finance wiki, refunds over $500 need manager approval and a logged reason. Source: finance/refunds. (Any personal data in the source is redacted.)",
      },
    ],
    flue: [
      {
        role: "user",
        text: "What's our policy on refunds over $500?",
      },
      {
        detail: "corpus search",
        role: "tool",
        tool: "search_knowledge",
      },
      {
        role: "agent",
        text: "Searched the indexed corpus first, answered from cited passages, and relied on the retrieval layer's PII redaction before responding.",
      },
    ],
  },
};

const aiSeoAudit: Agent = {
  description:
    "Fetches a page through context.dev and scores its readability to AI answer engines, returning failing checks and an agent-ready fix prompt.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Page URL",
      name: "url",
      placeholder: "https://example.com/blog/how-it-works",
      type: "text",
    },
  ],
  shortTitle: "AI SEO Audit",
  slug: "ai-seo-audit",
  title: "AI SEO Audit Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Audit https://example.com/blog/how-it-works for AI search.",
      },
      {
        detail: "markdown + html via context.dev",
        role: "tool",
        tool: "fetch_page",
      },
      {
        role: "agent",
        text: "Score: 62/100 (Average). Strong on content structure, weak on schema (no JSON-LD) and author authority (no byline or dates). Top fixes are in the agent-ready prompt below — paste it into Claude Code.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Audit https://example.com/blog/how-it-works for AI search.",
      },
      {
        detail: "markdown + html via context.dev",
        role: "tool",
        tool: "fetch_page",
      },
      {
        role: "agent",
        text: "Scored the six categories to 62/100 (Average), listed the failing checks by impact, and returned a copy-paste fix prompt — all grounded in the fetched page.",
      },
    ],
  },
};

const extractDesignMd: Agent = {
  description:
    "Pulls a site's design tokens, brand assets, screenshot, and page Markdown through context.dev and composes a self-contained DESIGN.md.",
  frameworks: ["eve", "flue"],
  inputFields: [
    {
      label: "Domain",
      name: "domain",
      placeholder: "stripe.com",
      type: "text",
    },
  ],
  shortTitle: "Extract DESIGN.md",
  slug: "extract-design-md",
  title: "Extract DESIGN.md Agent",
  transcript: {
    eve: [
      {
        role: "user",
        text: "Generate a DESIGN.md for stripe.com",
      },
      {
        detail: "tokens + brand + screenshot + markdown",
        role: "tool",
        tool: "extract_styleguide",
      },
      {
        role: "agent",
        text: "Composed DESIGN.md: frontmatter tokens (colors, typography, spacing, radii, components) plus Overview, Colors, Typography, Layout, Elevation, Shapes, Components, and Do's and Don'ts — values pulled from the styleguide.",
      },
    ],
    flue: [
      {
        role: "user",
        text: "Generate a DESIGN.md for stripe.com",
      },
      {
        detail: "four context.dev signals in parallel",
        role: "tool",
        tool: "extract_styleguide",
      },
      {
        role: "agent",
        text: "Gathered the four context.dev payloads, then emitted a self-contained DESIGN.md — token frontmatter followed by the canonical sections, grounded in the extracted styleguide and brand.",
      },
    ],
  },
};

export const AGENTS: readonly Agent[] = [
  deepSearch,
  aiSeoAudit,
  extractDesignMd,
  csvToQuestions,
  feedbackSummary,
  meetingNotes,
  chatWithPdf,
  flashcardsPdf,
  chatWithYoutube,
  docsChatbot,
  textToSql,
  githubReview,
  slackAgent,
  googleSheets,
  weather,
  docsExpert,
  claw,
  browserAgent,
  companyKnowledge,
] as const;

export const getAgent = (slug: string): Agent | undefined =>
  AGENTS.find((agent) => agent.slug === slug);

export const installCommand = (framework: FrameworkId, slug: string): string =>
  `npx shadcn@latest add ${SITE.REGISTRY}/${framework}/${slug}`;
