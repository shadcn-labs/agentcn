/** Preview tool catalog. */
import { runAudit } from "@/lib/preview/seo-audit/audit";
import { normalizeAuditUrl } from "@/lib/preview/seo-audit/url";

export interface PreviewTool {
  description: string;
  execute: (input: Record<string, unknown>) => Promise<unknown>;
  input_schema: {
    properties: Record<string, unknown>;
    required?: string[];
    type: "object";
  };
  name: string;
}

const str = (value: unknown): string =>
  typeof value === "string" ? value : "";
const num = (value: unknown, fallback: number): number =>
  typeof value === "number" ? value : fallback;

const disabled = (
  envOrReason: string,
  action: string
): Record<string, unknown> => ({
  disabled: true,
  note: `${action} is disabled in the hosted preview (${envOrReason}). Install the recipe and run it locally to enable it.`,
});

const CONTEXT_DEV_BASE_URL = "https://api.context.dev/v1";

const contextDevGet = async (
  action: string,
  path: string,
  query: Record<string, string | undefined>
): Promise<unknown> => {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) {
    return disabled("CONTEXT_DEV_API_KEY", action);
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, value);
    }
  }

  try {
    const res = await fetch(
      `${CONTEXT_DEV_BASE_URL}${path}?${params.toString()}`,
      { headers: { authorization: `Bearer ${apiKey}` } }
    );
    if (!res.ok) {
      const body = await res.text();
      return {
        error: `context.dev ${path} failed (${res.status}): ${body.slice(0, 200)}`,
      };
    }
    return await res.json();
  } catch (error) {
    return { error: String(error) };
  }
};

const SAMPLE_FEEDBACK = [
  {
    segment: "enterprise",
    severity: "high",
    text: "SSO randomly logs us out.",
  },
  {
    segment: "enterprise",
    severity: "medium",
    text: "CSV export is very slow.",
  },
  { segment: "pro", severity: "low", text: "Love the new dashboard." },
  {
    segment: "pro",
    severity: "medium",
    text: "Wish there were saved filters.",
  },
  {
    segment: "free",
    severity: "low",
    text: "Onboarding was confusing at first.",
  },
];

const SAMPLE_FUNCTIONS = [
  {
    description:
      "Fetches orbital and physical data for a planet in the solar system.",
    example: "const data = await getPlanetaryData('mars')",
    name: "getPlanetaryData",
    signature: "getPlanetaryData(planet: string): Promise<PlanetaryData>",
  },
  {
    description:
      "Computes the projected orbit of a body over a number of days.",
    example: "const orbit = computeOrbit('halley', 365)",
    name: "computeOrbit",
    signature: "computeOrbit(body: string, days: number): Orbit",
  },
];

const SAMPLE_SCHEMA = {
  customers: [
    { name: "id", type: "INTEGER" },
    { name: "name", type: "TEXT" },
    { name: "segment", type: "TEXT" },
  ],
  orders: [
    { name: "id", type: "INTEGER" },
    { name: "customer_id", type: "INTEGER" },
    { name: "amount_usd", type: "REAL" },
    { name: "created_at", type: "TEXT" },
  ],
};

const fetchTranscript = async (url: string): Promise<unknown> => {
  try {
    const page = await fetch(url, {
      headers: { "accept-language": "en-US,en;q=0.9" },
    }).then((r) => r.text());

    const match = page.match(/"captionTracks":(\[.*?\])/);
    if (!match) {
      return disabled("no captions found", "Transcript fetch");
    }

    const tracks = JSON.parse(match[1].replaceAll("\\u0026", "&")) as {
      baseUrl: string;
    }[];
    const baseUrl = tracks[0]?.baseUrl;
    if (!baseUrl) {
      return disabled("no captions found", "Transcript fetch");
    }

    const xml = await fetch(baseUrl).then((r) => r.text());
    const segments = [
      ...xml.matchAll(/<text start="([\d.]+)"[^>]*>(.*?)<\/text>/g),
    ]
      .slice(0, 200)
      .map((m) => ({
        seconds: Math.floor(Number(m[1])),
        text: m[2]
          .replaceAll("&amp;#39;", "'")
          .replaceAll("&amp;quot;", '"')
          .replaceAll("&amp;", "&")
          .replaceAll(/<[^>]+>/g, ""),
      }));

    return { segments };
  } catch {
    return disabled("fetch failed", "Transcript fetch");
  }
};

const TOOLS: Record<string, PreviewTool> = {
  audit_page: {
    description:
      "Runs the deterministic AI-SEO audit on a URL through context.dev and returns the full scored result: a 0–100 score and band, per-category checks (pass/partial/fail/na with evidence), top priorities, and ready-to-run agent fix prompts.",
    execute: async (input) => {
      const apiKey = process.env.CONTEXT_DEV_API_KEY;
      if (!apiKey) {
        return disabled("CONTEXT_DEV_API_KEY", "AI SEO audit");
      }
      const normalized = normalizeAuditUrl(str(input.url));
      if (!normalized) {
        return { error: "Provide a valid URL to audit." };
      }
      try {
        return await runAudit(normalized, apiKey);
      } catch (error) {
        return { error: String(error) };
      }
    },
    input_schema: {
      properties: { url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "audit_page",
  },
  browser_click: {
    description: "Clicks an element by selector and returns a page snapshot.",
    execute: () =>
      Promise.resolve(disabled("no headless browser", "Browser automation")),
    input_schema: {
      properties: { selector: { type: "string" } },
      required: ["selector"],
      type: "object",
    },
    name: "browser_click",
  },
  browser_goto: {
    description: "Navigates the browser to a URL and returns a page snapshot.",
    execute: () =>
      Promise.resolve(disabled("no headless browser", "Browser automation")),
    input_schema: {
      properties: { url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "browser_goto",
  },
  browser_snapshot: {
    description: "Returns the current page snapshot with interactive elements.",
    execute: () =>
      Promise.resolve(disabled("no headless browser", "Browser automation")),
    input_schema: { properties: {}, type: "object" },
    name: "browser_snapshot",
  },
  browser_type: {
    description:
      "Types text into an input by selector, then returns a snapshot.",
    execute: () =>
      Promise.resolve(disabled("no headless browser", "Browser automation")),
    input_schema: {
      properties: { selector: { type: "string" }, text: { type: "string" } },
      required: ["selector", "text"],
      type: "object",
    },
    name: "browser_type",
  },
  capture_screenshot: {
    description:
      "Captures a homepage screenshot for a domain and returns its URL.",
    execute: (input) =>
      contextDevGet("Screenshot capture", "/web/screenshot", {
        domain: str(input.domain),
        fullScreenshot: "false",
        handleCookiePopup: "true",
      }),
    input_schema: {
      properties: { domain: { type: "string" } },
      required: ["domain"],
      type: "object",
    },
    name: "capture_screenshot",
  },
  extract_styleguide: {
    description:
      "Extracts a domain's design tokens — colors, typography, spacing, radii, and components.",
    execute: (input) =>
      contextDevGet("Styleguide extraction", "/web/styleguide", {
        domain: str(input.domain),
        timeoutMS: "120000",
      }),
    input_schema: {
      properties: { domain: { type: "string" } },
      required: ["domain"],
      type: "object",
    },
    name: "extract_styleguide",
  },
  fetch_csv: {
    description: "Fetches a CSV file from a URL and returns its text content.",
    execute: async (input) => {
      const url = str(input.url);
      if (!url) {
        return { error: "No URL provided." };
      }
      try {
        const text = await fetch(url).then((r) => r.text());
        return { content: text.slice(0, 6000), url };
      } catch (error) {
        return { error: String(error) };
      }
    },
    input_schema: {
      properties: { url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "fetch_csv",
  },
  fetch_markdown: {
    description:
      "Converts a domain's homepage to clean Markdown for grounding the document.",
    execute: (input) =>
      contextDevGet("Markdown extraction", "/web/scrape/markdown", {
        includeImages: "false",
        includeLinks: "false",
        url: `https://${str(input.domain)}`,
        useMainContentOnly: "true",
      }),
    input_schema: {
      properties: { domain: { type: "string" } },
      required: ["domain"],
      type: "object",
    },
    name: "fetch_markdown",
  },
  fetch_pr: {
    description: "Fetches a GitHub pull request's metadata and changed files.",
    execute: async (input) => {
      const owner = str(input.owner);
      const repo = str(input.repo);
      const pull = num(input.pullNumber, 0);
      if (!(owner && repo && pull)) {
        return { error: "Provide owner, repo, and pullNumber." };
      }
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
      };
      if (token) {
        headers.authorization = `Bearer ${token}`;
      }
      try {
        const base = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`;
        const [pr, files] = await Promise.all([
          fetch(base, { headers }).then((r) => r.json()),
          fetch(`${base}/files?per_page=30`, { headers }).then((r) => r.json()),
        ]);
        return { files, pr };
      } catch (error) {
        return { error: String(error) };
      }
    },
    input_schema: {
      properties: {
        owner: { type: "string" },
        pullNumber: { type: "number" },
        repo: { type: "string" },
      },
      required: ["owner", "repo", "pullNumber"],
      type: "object",
    },
    name: "fetch_pr",
  },
  generate_image: {
    description:
      "Generates an illustrative image for a concept; returns a URL.",
    execute: () =>
      Promise.resolve(disabled("OPENAI_API_KEY", "Image generation")),
    input_schema: {
      properties: { prompt: { type: "string" } },
      required: ["prompt"],
      type: "object",
    },
    name: "generate_image",
  },
  get_brand: {
    description:
      "Retrieves a domain's brand assets — logos, backdrops, brand colors, slogan, and industry.",
    execute: (input) =>
      contextDevGet("Brand retrieval", "/brand/retrieve", {
        domain: str(input.domain),
      }),
    input_schema: {
      properties: { domain: { type: "string" } },
      required: ["domain"],
      type: "object",
    },
    name: "get_brand",
  },
  get_feedback: {
    description: "Retrieves a page of customer feedback entries.",
    execute: (input) => {
      const segment = str(input.segment);
      const rows = segment
        ? SAMPLE_FEEDBACK.filter((f) => f.segment === segment)
        : SAMPLE_FEEDBACK;
      return Promise.resolve({ entries: rows, sample: true });
    },
    input_schema: {
      properties: {
        page: { type: "number" },
        pageSize: { type: "number" },
        segment: { type: "string" },
      },
      type: "object",
    },
    name: "get_feedback",
  },
  get_transcript: {
    description: "Fetches the timestamped transcript of a YouTube video.",
    execute: (input) => fetchTranscript(str(input.url)),
    input_schema: {
      properties: { url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "get_transcript",
  },
  get_weather: {
    description: "Gets the current weather for a named location.",
    execute: async (input) => {
      const location = str(input.location);
      if (!location) {
        return { error: "No location provided." };
      }
      try {
        const geo = (await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
        ).then((r) => r.json())) as {
          results?: { latitude: number; longitude: number; name: string }[];
        };
        const place = geo.results?.[0];
        if (!place) {
          return { error: `No location found for "${location}".` };
        }
        const weather = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code`
        ).then((r) => r.json());
        return { place: place.name, weather };
      } catch (error) {
        return { error: String(error) };
      }
    },
    input_schema: {
      properties: { location: { type: "string" } },
      required: ["location"],
      type: "object",
    },
    name: "get_weather",
  },
  index_document: {
    description: "Adds a document to the knowledge corpus.",
    execute: () =>
      Promise.resolve(
        disabled("OPENAI_API_KEY + vector store", "Document indexing")
      ),
    input_schema: {
      properties: { content: { type: "string" }, source: { type: "string" } },
      required: ["source", "content"],
      type: "object",
    },
    name: "index_document",
  },
  index_pdf: {
    description: "Chunks, embeds, and stores a PDF for retrieval.",
    execute: () =>
      Promise.resolve(
        disabled("OPENAI_API_KEY + vector store", "PDF indexing")
      ),
    input_schema: {
      properties: { doc: { type: "string" }, url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "index_pdf",
  },
  introspect_schema: {
    description: "Lists the database tables and their columns.",
    execute: () => Promise.resolve({ sample: true, schema: SAMPLE_SCHEMA }),
    input_schema: { properties: {}, type: "object" },
    name: "introspect_schema",
  },
  lookup_docs: {
    description: "Looks up library functions matching a name or keyword.",
    execute: (input) => {
      const q = str(input.query).toLowerCase();
      const matches = SAMPLE_FUNCTIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
      return Promise.resolve(
        matches.length ? matches : SAMPLE_FUNCTIONS.map((d) => d.name)
      );
    },
    input_schema: {
      properties: { query: { type: "string" } },
      required: ["query"],
      type: "object",
    },
    name: "lookup_docs",
  },
  parse_pdf: {
    description: "Extracts the full text content from a PDF.",
    execute: () =>
      Promise.resolve(disabled("no PDF parser bundled", "PDF parsing")),
    input_schema: {
      properties: { url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "parse_pdf",
  },
  post_message: {
    description: "Posts a message to a Slack channel (threaded).",
    execute: (input) =>
      Promise.resolve({
        note: "Preview does not post to Slack. The recipe would send this message.",
        preview: { channel: str(input.channel), text: str(input.text) },
      }),
    input_schema: {
      properties: {
        channel: { type: "string" },
        text: { type: "string" },
        threadTs: { type: "string" },
      },
      required: ["channel", "text"],
      type: "object",
    },
    name: "post_message",
  },
  read_file: {
    description: "Reads a UTF-8 file from the workspace.",
    execute: () =>
      Promise.resolve(disabled("no filesystem access", "File read")),
    input_schema: {
      properties: { path: { type: "string" } },
      required: ["path"],
      type: "object",
    },
    name: "read_file",
  },
  read_range: {
    description: "Reads a range of cells from a Google Sheet (A1 notation).",
    execute: () =>
      Promise.resolve(disabled("GOOGLE_ACCESS_TOKEN", "Google Sheets access")),
    input_schema: {
      properties: {
        range: { type: "string" },
        spreadsheetId: { type: "string" },
      },
      required: ["spreadsheetId", "range"],
      type: "object",
    },
    name: "read_range",
  },
  run_query: {
    description: "Executes a read-only SELECT query and returns rows.",
    execute: () =>
      Promise.resolve(disabled("no database connected", "Query execution")),
    input_schema: {
      properties: { sql: { type: "string" } },
      required: ["sql"],
      type: "object",
    },
    name: "run_query",
  },
  run_shell: {
    description: "Runs a shell command inside the workspace directory.",
    execute: (input) =>
      Promise.resolve({
        note: "Preview does not execute shell commands. The recipe would run this in a sandboxed workspace.",
        preview: { command: str(input.command) },
      }),
    input_schema: {
      properties: { command: { type: "string" } },
      required: ["command"],
      type: "object",
    },
    name: "run_shell",
  },
  save_notes: {
    description: "Saves the structured meeting notes.",
    execute: (input) => Promise.resolve(input),
    input_schema: {
      properties: {
        actionItems: { items: { type: "object" }, type: "array" },
        decisions: { items: { type: "string" }, type: "array" },
        openQuestions: { items: { type: "string" }, type: "array" },
        summary: { type: "string" },
      },
      required: ["summary", "decisions", "actionItems"],
      type: "object",
    },
    name: "save_notes",
  },
  scrape_url: {
    description: "Scrapes a URL and returns the page content as markdown.",
    execute: async (input) => {
      const url = str(input.url);
      if (!url) {
        return { error: "No URL provided." };
      }
      try {
        const text = await fetch(`https://r.jina.ai/${url}`).then((r) =>
          r.text()
        );
        return { markdown: text.slice(0, 6000), url };
      } catch (error) {
        return { error: String(error) };
      }
    },
    input_schema: {
      properties: { url: { type: "string" } },
      required: ["url"],
      type: "object",
    },
    name: "scrape_url",
  },
  search_docs: {
    description: "Retrieves the most relevant PDF chunks for a question.",
    execute: () =>
      Promise.resolve(
        disabled("OPENAI_API_KEY + vector store", "Vector retrieval")
      ),
    input_schema: {
      properties: { query: { type: "string" }, topK: { type: "number" } },
      required: ["query"],
      type: "object",
    },
    name: "search_docs",
  },
  search_knowledge: {
    description: "Searches the company knowledge corpus.",
    execute: () =>
      Promise.resolve(
        disabled("OPENAI_API_KEY + vector store", "Knowledge search")
      ),
    input_schema: {
      properties: { query: { type: "string" }, topK: { type: "number" } },
      required: ["query"],
      type: "object",
    },
    name: "search_knowledge",
  },
  update_range: {
    description: "Writes values to a range in a Google Sheet (A1 notation).",
    execute: () =>
      Promise.resolve(disabled("GOOGLE_ACCESS_TOKEN", "Google Sheets writes")),
    input_schema: {
      properties: {
        range: { type: "string" },
        spreadsheetId: { type: "string" },
        values: { items: { type: "array" }, type: "array" },
      },
      required: ["spreadsheetId", "range", "values"],
      type: "object",
    },
    name: "update_range",
  },
  web_search: {
    description: "Searches the web and returns ranked results with snippets.",
    execute: async (input) => {
      const apiKey = process.env.EXA_API_KEY;
      if (!apiKey) {
        return disabled("EXA_API_KEY", "Web search");
      }
      try {
        const res = await fetch("https://api.exa.ai/search", {
          body: JSON.stringify({
            contents: { text: true },
            numResults: num(input.numResults, 5),
            query: str(input.query),
          }),
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
          },
          method: "POST",
        });
        return await res.json();
      } catch (error) {
        return { error: String(error) };
      }
    },
    input_schema: {
      properties: {
        numResults: { type: "number" },
        query: { type: "string" },
      },
      required: ["query"],
      type: "object",
    },
    name: "web_search",
  },
  write_file: {
    description: "Writes a UTF-8 file in the workspace.",
    execute: (input) =>
      Promise.resolve({
        note: "Preview does not write files. The recipe would write this in a sandboxed workspace.",
        preview: { bytes: str(input.content).length, path: str(input.path) },
      }),
    input_schema: {
      properties: { content: { type: "string" }, path: { type: "string" } },
      required: ["path", "content"],
      type: "object",
    },
    name: "write_file",
  },
};

export const getPreviewTool = (name: string): PreviewTool | undefined =>
  TOOLS[name];
