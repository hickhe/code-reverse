import type { RebuildIndexInput, RebuildIndexOutput } from "../models/tool_types.js";
import { rebuildIndex } from "../services/index_rebuilder.js";

export const rebuildIndexTool = {
  name: "rebuild_index",
  description: "Rebuild project index in full or incremental mode using git diff baseline.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceRoot: { type: "string" },
      mode: { type: "string", enum: ["full", "incremental"] },
      gitBase: { type: "string" }
    },
    required: ["workspaceRoot", "mode"]
  },
  async execute(input: RebuildIndexInput): Promise<RebuildIndexOutput> {
    return rebuildIndex(input);
  }
};
