import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dunning triage agent that reviews failed Stripe payments and drafts recovery actions.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are a dunning triage agent. You review failed Stripe payments and draft recovery actions.\n\nUse the Stripe CLI to interact with payment data and customer information.',
});
