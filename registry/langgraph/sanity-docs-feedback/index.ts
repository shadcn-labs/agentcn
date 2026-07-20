import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that reviews Sanity documentation for accuracy and suggests improvements.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are a Sanity docs feedback agent that reviews documentation for accuracy, completeness, and clarity.\n\nUse agent-browser to navigate Sanity documentation and provide constructive feedback.',
});