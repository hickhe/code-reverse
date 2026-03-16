import { repoInventory } from "./repo_scanner.js";
import { traceDomainRules } from "./rule_extractor.js";
import type {
  RequirementItem,
  SynthesizeRequirementsInput,
  SynthesizeRequirementsOutput
} from "../models/tool_types.js";

function classifyRequirement(hasRoute: boolean, hasService: boolean, hasSql: boolean): RequirementItem["classification"] {
  const score = Number(hasRoute) + Number(hasService) + Number(hasSql);
  if (score >= 2) return "fact";
  if (score === 1) return "inference";
  return "needs_review";
}

function confidenceOf(c: RequirementItem["classification"]): RequirementItem["confidence"] {
  if (c === "fact") return "high";
  if (c === "inference") return "medium";
  return "low";
}

export async function synthesizeRequirements(
  input: SynthesizeRequirementsInput
): Promise<SynthesizeRequirementsOutput> {
  const [inventory, ruleView] = await Promise.all([
    repoInventory({ workspaceRoot: input.workspaceRoot, moduleHint: input.moduleHint }),
    traceDomainRules({ workspaceRoot: input.workspaceRoot, moduleHint: input.moduleHint })
  ]);

  const requirements: RequirementItem[] = [];
  let id = 1;

  const moduleNames = inventory.moduleDirectories.length ? inventory.moduleDirectories : [input.moduleHint ?? "core"];
  for (const moduleName of moduleNames) {
    const hasRoute = inventory.routes.some((r) => r.file.includes(moduleName));
    const hasService = inventory.services.some((s) => s.includes(moduleName));
    const hasSql = inventory.sqlFiles.some((s) => s.includes(moduleName));

    const classification = classifyRequirement(hasRoute, hasService, hasSql);
    const confidence = confidenceOf(classification);

    requirements.push({
      id: `REQ-${String(id++).padStart(4, "0")}`,
      title: `${moduleName} 模块支持基础业务流程`,
      description: `模块 ${moduleName} 在代码中具备入口/服务/持久化证据，建议作为需求基线候选。`,
      classification,
      confidence,
      evidenceRefs: [
        ...inventory.routes.filter((r) => r.file.includes(moduleName)).slice(0, 2).map((r) => r.file),
        ...inventory.services.filter((s) => s.includes(moduleName)).slice(0, 2),
        ...inventory.sqlFiles.filter((s) => s.includes(moduleName)).slice(0, 2)
      ]
    });
  }

  const openQuestions = [
    "是否存在配置关闭但代码仍保留的功能？",
    "是否有仅前端入口但后端未落库的流程？",
    "规则关键字命中是否真实属于业务规则而非注释或测试代码？"
  ];

  const summary = { high: 0, medium: 0, low: 0 };
  for (const item of requirements) {
    summary[item.confidence] += 1;
  }

  return {
    requirements,
    rules: ruleView.rules,
    openQuestions,
    confidenceSummary: summary
  };
}
