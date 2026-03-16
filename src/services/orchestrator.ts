import { repoInventory } from "./repo_scanner.js";
import { traceApiFlows } from "./api_flow_tracer.js";
import { traceDomainRules } from "./rule_extractor.js";
import { synthesizeRequirements } from "./requirement_engine.js";
import { exportRefactorMap } from "./refactor_mapper.js";
import { saveEvidence } from "./evidence_store.js";
import { saveBaseline } from "./baseline_store.js";
import type { Evidence, Requirement } from "../models/domain_models.js";

export interface AnalyzeRequest {
  workspaceRoot: string;
  moduleHint?: string;
  apiPath?: string;
  mode?: "summary" | "detail";
}

export interface AnalyzeResult {
  inventoryModules: string[];
  routeCount: number;
  ruleCount: number;
  requirementCount: number;
  refactorMap: string;
}

export async function runFullAnalysis(request: AnalyzeRequest): Promise<AnalyzeResult> {
  const inventory = await repoInventory({ workspaceRoot: request.workspaceRoot, moduleHint: request.moduleHint });
  const flow = await traceApiFlows({
    workspaceRoot: request.workspaceRoot,
    moduleHint: request.moduleHint,
    apiPath: request.apiPath,
    depth: 4
  });
  const rules = await traceDomainRules({ workspaceRoot: request.workspaceRoot, moduleHint: request.moduleHint });
  const requirements = await synthesizeRequirements({
    workspaceRoot: request.workspaceRoot,
    moduleHint: request.moduleHint,
    mode: request.mode
  });
  const map = await exportRefactorMap({ workspaceRoot: request.workspaceRoot, moduleHint: request.moduleHint, format: "md" });

  const evidence: Evidence[] = [
    ...inventory.routes.map((route, i) => ({
      id: `EV-ROUTE-${i + 1}`,
      type: "route" as const,
      file: route.file,
      symbol: `${route.method} ${route.path}`
    })),
    ...flow.chain.slice(0, 100).map((node, i) => ({
      id: `EV-CHAIN-${i + 1}`,
      type: node.kind === "sql" ? ("sql" as const) : ("service" as const),
      file: node.file,
      symbol: node.symbol
    }))
  ];

  const baseline: Requirement[] = requirements.requirements.map((req) => ({
    id: req.id,
    domain: request.moduleHint ?? "unknown",
    title: req.title,
    description: req.description,
    actors: [],
    inputs: [],
    outputs: [],
    states: [],
    rules: [],
    dependencies: [],
    evidenceRefs: req.evidenceRefs,
    confidence: req.confidence,
    classification: req.classification
  }));

  await saveEvidence(request.workspaceRoot, evidence);
  await saveBaseline(request.workspaceRoot, baseline);

  return {
    inventoryModules: inventory.moduleDirectories,
    routeCount: inventory.routes.length,
    ruleCount: rules.rules.length,
    requirementCount: requirements.requirements.length,
    refactorMap: map.content
  };
}
