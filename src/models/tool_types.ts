export interface RepoInventoryInput {
  workspaceRoot: string;
  moduleHint?: string;
  languages?: string[];
}

export interface RouteInfo {
  file: string;
  method: string;
  path: string;
}

export interface RepoInventoryOutput {
  workspaceRoot: string;
  moduleDirectories: string[];
  languageSummary: Record<string, number>;
  routes: RouteInfo[];
  services: string[];
  repositoriesOrMappers: string[];
  sqlFiles: string[];
  configFiles: string[];
  enumsOrStatusFiles: string[];
}

export interface TraceApiFlowsInput {
  workspaceRoot: string;
  apiPath?: string;
  className?: string;
  moduleHint?: string;
  depth?: number;
}

export interface TraceNode {
  file: string;
  symbol: string;
  kind: "route" | "controller" | "service" | "repository" | "sql" | "external";
}

export interface TraceApiFlowsOutput {
  query: Omit<TraceApiFlowsInput, "workspaceRoot">;
  matchedRoutes: RouteInfo[];
  chain: TraceNode[];
  relatedTables: string[];
  relatedDtosOrEntities: string[];
}

export interface TraceDomainRulesInput {
  workspaceRoot: string;
  moduleHint?: string;
  focus?: Array<"status" | "amount" | "role" | "approval" | "callback" | "idempotent" | "retry">;
}

export interface RuleItem {
  id: string;
  type: "status" | "validation" | "permission" | "callback" | "idempotent" | "retry";
  name: string;
  condition: string;
  action: string;
  evidenceRefs: string[];
  confidence: "high" | "medium" | "low";
}

export interface TraceDomainRulesOutput {
  moduleHint?: string;
  rules: RuleItem[];
  statusTransitions: string[];
  validations: string[];
  idempotentOrRetryPoints: string[];
}

export interface SynthesizeRequirementsInput {
  workspaceRoot: string;
  moduleHint?: string;
  evidenceRefs?: string[];
  mode?: "summary" | "detail";
}

export interface RequirementItem {
  id: string;
  title: string;
  description: string;
  classification: "fact" | "inference" | "needs_review";
  confidence: "high" | "medium" | "low";
  evidenceRefs: string[];
}

export interface SynthesizeRequirementsOutput {
  requirements: RequirementItem[];
  rules: RuleItem[];
  openQuestions: string[];
  confidenceSummary: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface ExportRefactorMapInput {
  workspaceRoot: string;
  moduleHint?: string;
  format: "md" | "json";
}

export interface ExportRefactorMapOutput {
  format: "md" | "json";
  content: string;
}

export interface RebuildIndexInput {
  workspaceRoot: string;
  mode: "full" | "incremental";
  gitBase?: string;
}

export interface RebuildIndexOutput {
  mode: "full" | "incremental";
  impactedModules: string[];
  changedFiles: string[];
  summary: {
    routeCount: number;
    serviceCount: number;
    sqlCount: number;
  };
}
