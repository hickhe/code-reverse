import { runFullAnalysis } from "../services/orchestrator.js";
import { exportMarkdown, exportJson } from "../services/exporter.js";

export interface ReqScanCommandArgs {
  workspaceRoot: string;
  moduleHint?: string;
  apiPath?: string;
  output?: "md" | "json";
}

export async function runReqScanCommand(args: ReqScanCommandArgs): Promise<{ outputPath: string }> {
  const result = await runFullAnalysis({
    workspaceRoot: args.workspaceRoot,
    moduleHint: args.moduleHint,
    apiPath: args.apiPath,
    mode: "detail"
  });

  if ((args.output ?? "md") === "json") {
    const outputPath = await exportJson(args.workspaceRoot, "req-scan-result.json", result);
    return { outputPath };
  }

  const lines = [
    "# Requirement Scan Result",
    `- modules: ${result.inventoryModules.join(", ")}`,
    `- routes: ${result.routeCount}`,
    `- rules: ${result.ruleCount}`,
    `- requirements: ${result.requirementCount}`,
    "",
    result.refactorMap
  ];
  const outputPath = await exportMarkdown(args.workspaceRoot, "req-scan-result.md", lines.join("\n"));
  return { outputPath };
}
