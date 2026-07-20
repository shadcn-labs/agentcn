import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Documentation sync agent that keeps documentation current with recently merged code.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are a documentation sync agent. You keep documentation current with recently merged code changes.\n\nUse the gh CLI to interact with GitHub for PR and commit history.',
});
