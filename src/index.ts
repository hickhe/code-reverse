import { repoInventoryTool } from "./tools/repo_inventory.js";
import { traceApiFlowsTool } from "./tools/trace_api_flows.js";
import { traceDomainRulesTool } from "./tools/trace_domain_rules.js";
import { synthesizeRequirementsTool } from "./tools/synthesize_requirements.js";
import { exportRefactorMapTool } from "./tools/export_refactor_map.js";
import { rebuildIndexTool } from "./tools/rebuild_index.js";
import { runReqScanCommand } from "./commands/req_scan.js";

export interface OpenClawTool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (input: any) => Promise<any>;
}

export interface OpenClawCommand {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

export interface OpenClawPlugin {
  name: string;
  tools: OpenClawTool[];
  commands?: OpenClawCommand[];
}

const plugin: OpenClawPlugin = {
  name: "repo-reverse",
  tools: [
    repoInventoryTool,
    traceApiFlowsTool,
    traceDomainRulesTool,
    synthesizeRequirementsTool,
    exportRefactorMapTool,
    rebuildIndexTool
  ],
  commands: [
    {
      name: "req_scan",
      description: "run end-to-end requirement reverse analysis",
      execute: runReqScanCommand
    }
  ]
};

export default plugin;
