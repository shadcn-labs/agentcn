import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that tests website for broken links, errors, and quality issues.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are a website QA agent that tests websites for quality issues.\n\nUse agent-browser to crawl through websites and identify broken links, 404 errors, loading issues, content problems, and other quality concerns. Provide a comprehensive report of all issues found with specific locations and severity levels.',
});