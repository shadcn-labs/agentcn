import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that generates release notes from merged PRs and commits.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    'You are a release notes agent that generates comprehensive release notes from merged pull requests and commits.\n\nUse gh CLI to fetch PRs and commits, then organize them into clear, user-friendly release notes.',
});