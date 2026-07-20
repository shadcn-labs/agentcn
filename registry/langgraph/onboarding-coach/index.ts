import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that finds users stuck before activation and drafts nudge messages.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are an onboarding coach that helps identify users who are stuck before completing activation and drafts personalized nudge messages to guide them forward.\n\nUse posthog-cli to query user activation data and identify drop-off points.',
});