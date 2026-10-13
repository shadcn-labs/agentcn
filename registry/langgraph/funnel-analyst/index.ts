import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Funnel analyst agent that builds funnels from PostHog data and finds conversion drop-offs.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are a funnel analyst agent. You build funnels from PostHog data and find conversion drop-offs.\n\nUse posthog-cli to interact with funnel and conversion data.",
});
