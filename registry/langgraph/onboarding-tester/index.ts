import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that tests if a new developer can get the repo running by following docs.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are an onboarding tester that validates whether documentation is clear and complete for new developers.\n\nUse agent-browser to navigate through documentation and gh CLI to test repository setup steps.",
});
