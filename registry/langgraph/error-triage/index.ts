import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Error triage agent that pulls Sentry issues and drafts debugging reports.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are an error triage agent. You pull Sentry issues and draft debugging reports.\n\nUse the Sentry CLI to interact with error tracking data.',
});
