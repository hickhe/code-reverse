import type { TraceDomainRulesInput, TraceDomainRulesOutput } from "../models/tool_types.js";
import { traceDomainRules } from "../services/rule_extractor.js";

export const traceDomainRulesTool = {
  name: "trace_domain_rules",
  description: "Extract domain rules including status transitions, validations, permission and retry/idempotent signals.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceRoot: { type: "string" },
      moduleHint: { type: "string" },
      focus: {
        type: "array",
        items: {
          type: "string",
          enum: ["status", "amount", "role", "approval", "callback", "idempotent", "retry"]
        }
      }
    },
    required: ["workspaceRoot"]
  },
  async execute(input: TraceDomainRulesInput): Promise<TraceDomainRulesOutput> {
    return traceDomainRules(input);
  }
};
