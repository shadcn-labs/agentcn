import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, react, next, vitest],
  ignorePatterns: [
    "public/r/**",
    "registry/eve/**",
    "registry/flue/**",
    // Verbatim ports from context-dot-dev (AI SEO audit engine + DESIGN.md
    // token deriver / prompt spec). Kept byte-faithful to the upstream repos,
    // so they are not held to this project's lint style.
    "lib/preview/seo-audit/**",
    "lib/preview/design-md/derive-tokens.ts",
    "lib/preview/design-md/prompt.ts",
    ".agents/**",
    ".cursor/**",
    ".changeset/**",
    ".claude/**",
    ".web-kits/**",
    "audio/**",
  ],
});
