import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that researches audience and creates/schedules social media posts.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are a social media content agent that researches target audiences and creates engaging social media posts.\n\nUse postiz CLI to schedule posts and agent-browser to research audience insights.",
});
