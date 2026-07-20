import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dependency guardian agent that triages dependency update PRs and security alerts, opening upgrade PRs for critical fixes.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are a dependency guardian agent. You triage dependency update PRs and security alerts, and open upgrade PRs for critical fixes.\n\nUse the gh CLI to interact with GitHub for PR triage and management.",
});
