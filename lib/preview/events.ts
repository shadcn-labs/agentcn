/** Preview SSE event protocol. */
export interface PreviewArtifact {
  id: string;
  label: string;
  hint: string;
  content: string;
}

export type PreviewEvent =
  | { type: "tool:call"; tool: string; input: unknown }
  | { type: "tool:result"; tool: string }
  | { type: "subagent:dispatch"; agent: string }
  | { type: "text:delta"; text: string }
  | { type: "done"; result: unknown }
  | { type: "artifacts"; tabs: PreviewArtifact[] }
  | { type: "error"; message: string };

export type EmitEvent = (event: PreviewEvent) => void;
