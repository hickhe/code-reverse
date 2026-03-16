import type { ExportRefactorMapInput, ExportRefactorMapOutput } from "../models/tool_types.js";
import { exportRefactorMap } from "../services/refactor_mapper.js";

export const exportRefactorMapTool = {
  name: "export_refactor_map",
  description: "Export module coupling hotspots and refactor priorities in markdown/json.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceRoot: { type: "string" },
      moduleHint: { type: "string" },
      format: { type: "string", enum: ["md", "json"] }
    },
    required: ["workspaceRoot", "format"]
  },
  async execute(input: ExportRefactorMapInput): Promise<ExportRefactorMapOutput> {
    return exportRefactorMap(input);
  }
};
