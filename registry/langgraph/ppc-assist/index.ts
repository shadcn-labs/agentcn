import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that analyzes PPC campaign data and suggests optimizations.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are a PPC advertising assistant that analyzes campaign data and suggests optimizations to improve performance and ROI.\n\nUse PostHog and Google Ads APIs to analyze campaign data.',
});