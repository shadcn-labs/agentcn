import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Experiment analyst agent that reads PostHog A/B experiment results and summarizes learnings.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are an experiment analyst agent. You read PostHog A/B experiment results and summarize learnings.\n\nUse posthog-cli to interact with experiment data.",
});
