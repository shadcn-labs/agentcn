/**
 * Structured event protocol shared by the live preview backend and the
 * `AgentPreview` UI component. The Flue backend emits these directly; the Eve
 * backend forwards raw NDJSON which the UI renders generically.
 */
export type PreviewEvent =
  | { type: "tool:call"; tool: string; input: unknown }
  | { type: "tool:result"; tool: string }
  | { type: "subagent:dispatch"; agent: string }
  | { type: "text:delta"; text: string }
  | { type: "done"; result: unknown }
  | { type: "error"; message: string };

export type EmitEvent = (event: PreviewEvent) => void;
