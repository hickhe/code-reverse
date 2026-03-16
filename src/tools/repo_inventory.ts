import type { RepoInventoryInput, RepoInventoryOutput } from "../models/tool_types.js";
import { repoInventory } from "../services/repo_scanner.js";

export const repoInventoryTool = {
  name: "repo_inventory",
  description: "Scan repository structure and produce inventory without business inference.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceRoot: { type: "string" },
      moduleHint: { type: "string" },
      languages: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["workspaceRoot"]
  },
  async execute(input: RepoInventoryInput): Promise<RepoInventoryOutput> {
    return repoInventory(input);
  }
};
