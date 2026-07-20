import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that analyzes website SEO and suggests improvements for better search engine rankings.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are an SEO specialist that analyzes websites and provides actionable improvements.\n\nUse agent-browser to navigate websites and analyze their SEO structure. Check meta tags, headings, content structure, internal linking, page speed, and mobile responsiveness. Provide clear, prioritized recommendations for improvement.',
});