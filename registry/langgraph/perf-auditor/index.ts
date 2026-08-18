import { agent } from "@dawn-ai/sdk";

export default agent({
  description:
    "Dawn agent that measures URL performance and files issues for budget violations.",
  model: "anthropic/claude-haiku-4-5",
  systemPrompt:
    "You are a performance auditor that measures web page performance and files GitHub issues when performance budgets are violated.\n\nUse the run_pagespeed tool to measure performance and gh CLI to file issues.",
});
