import type { SynthesizeRequirementsInput, SynthesizeRequirementsOutput } from "../models/tool_types.js";
import { synthesizeRequirements } from "../services/requirement_engine.js";

export const synthesizeRequirementsTool = {
  name: "synthesize_requirements",
  description: "Generate fact/inference/needs_review requirement list from extracted evidence.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceRoot: { type: "string" },
      moduleHint: { type: "string" },
      evidenceRefs: {
        type: "array",
        items: { type: "string" }
      },
      mode: { type: "string", enum: ["summary", "detail"] }
    },
    required: ["workspaceRoot"]
  },
  async execute(input: SynthesizeRequirementsInput): Promise<SynthesizeRequirementsOutput> {
    return synthesizeRequirements(input);
  }
};
