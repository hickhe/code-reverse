import { repoInventory } from "./repo_scanner.js";
import { traceApiFlows } from "./api_flow_tracer.js";
import type { ExportRefactorMapInput, ExportRefactorMapOutput } from "../models/tool_types.js";

export async function exportRefactorMap(input: ExportRefactorMapInput): Promise<ExportRefactorMapOutput> {
  const [inventory, flow] = await Promise.all([
    repoInventory({ workspaceRoot: input.workspaceRoot, moduleHint: input.moduleHint }),
    traceApiFlows({ workspaceRoot: input.workspaceRoot, moduleHint: input.moduleHint, depth: 3 })
  ]);

  const hotspots = inventory.services.slice(0, 10);
  const sharedTables = flow.relatedTables.slice(0, 20);
  const highRisk = flow.chain.filter((c) => c.kind === "repository" || c.kind === "sql").slice(0, 20);

  if (input.format === "json") {
    return {
      format: "json",
      content: JSON.stringify(
        {
          moduleHint: input.moduleHint,
          hotspots,
          sharedTables,
          highRisk,
          recommendation: "优先从热点 service + 共享表链路开始拆分，建立防腐层。"
        },
        null,
        2
      )
    };
  }

  const markdown = [
    `# Refactor Map${input.moduleHint ? ` - ${input.moduleHint}` : ""}`,
    "",
    "## 模块耦合热点",
    ...hotspots.map((h) => `- ${h}`),
    "",
    "## 共享表热点",
    ...sharedTables.map((t) => `- ${t}`),
    "",
    "## 高风险改造链路",
    ...highRisk.map((r) => `- [${r.kind}] ${r.file} -> ${r.symbol}`),
    "",
    "## 建议",
    "- 优先处理 repository/sql 密集链路，补充集成测试后再做拆分。"
  ].join("\n");

  return { format: "md", content: markdown };
}
