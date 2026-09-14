import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Error copy agent that surfaces user-facing error states and fixes poor copy.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are an error copy agent. You surface user-facing error states and fix poor error messaging.\n\nUse agent-browser to inspect UI error states and gh CLI for code changes.",
});
