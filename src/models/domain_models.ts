export type RequirementClassification = "fact" | "inference" | "needs_review";
export type Confidence = "high" | "medium" | "low";

export interface Evidence {
  id: string;
  type: "route" | "service" | "sql" | "rule" | "config";
  file: string;
  symbol?: string;
  snippet?: string;
  tableRefs?: string[];
  lineRange?: string;
}

export interface Rule {
  id: string;
  domain: string;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  evidenceRefs: string[];
  confidence: Confidence;
}

export interface Requirement {
  id: string;
  domain: string;
  title: string;
  description: string;
  actors: string[];
  inputs: string[];
  outputs: string[];
  states: string[];
  rules: string[];
  dependencies: string[];
  evidenceRefs: string[];
  confidence: Confidence;
  classification: RequirementClassification;
}

export interface ProjectIndex {
  project: string;
  version: string;
  languages: string[];
  modules: string[];
  routes: number;
  services: number;
  mappers: number;
  tables: number;
  hash: string;
}
