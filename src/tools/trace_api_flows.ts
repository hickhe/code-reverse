import type { TraceApiFlowsInput, TraceApiFlowsOutput } from "../models/tool_types.js";
import { traceApiFlows } from "../services/api_flow_tracer.js";

export const traceApiFlowsTool = {
  name: "trace_api_flows",
  description: "Trace controller to service/repository/sql call flow from route/class/module hints.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceRoot: { type: "string" },
      apiPath: { type: "string" },
      className: { type: "string" },
      moduleHint: { type: "string" },
      depth: { type: "number", minimum: 1, maximum: 8 }
    },
    required: ["workspaceRoot"]
  },
  async execute(input: TraceApiFlowsInput): Promise<TraceApiFlowsOutput> {
    return traceApiFlows(input);
  }
};
