import path from "node:path";
import { safeRead, walkFiles } from "../utils/fs.js";
import type { RuleItem, TraceDomainRulesInput, TraceDomainRulesOutput } from "../models/tool_types.js";

const STATUS_PATTERN = /(status|state)\s*(==|!=|=|\.equals\()\s*([A-Za-z0-9_"'().]+)/gi;
const AMOUNT_PATTERN = /(amount|money|price|fee)\s*(<=|>=|<|>|==|!=)\s*([A-Za-z0-9_.]+)/gi;
const ROLE_PATTERN = /(role|permission|auth|authorize|hasRole)/gi;
const IDEMPOTENT_PATTERN = /(idempotent|幂等|duplicate|重复提交|already processed)/gi;
const RETRY_PATTERN = /(retry|重试|compensat|补偿)/gi;
const CALLBACK_PATTERN = /(callback|webhook|notify)/gi;

function rel(file: string, root: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

function shouldInclude(type: RuleItem["type"], focus?: TraceDomainRulesInput["focus"]): boolean {
  if (!focus || focus.length === 0) {
    return true;
  }
  if (type === "validation" && focus.includes("amount")) return true;
  if (type === "permission" && focus.includes("role")) return true;
  if (type === "status" && focus.includes("status")) return true;
  if (type === "callback" && focus.includes("callback")) return true;
  if (type === "idempotent" && focus.includes("idempotent")) return true;
  if (type === "retry" && focus.includes("retry")) return true;
  return false;
}

export async function traceDomainRules(input: TraceDomainRulesInput): Promise<TraceDomainRulesOutput> {
  const files = await walkFiles(input.workspaceRoot);
  const codeFiles = files.filter((f) => /\.(java|ts|js|sql|xml)$/i.test(f));

  const rules: RuleItem[] = [];
  const statusTransitions = new Set<string>();
  const validations = new Set<string>();
  const idempotentOrRetryPoints = new Set<string>();

  let idx = 1;
  for (const abs of codeFiles) {
    const file = rel(abs, input.workspaceRoot);
    if (input.moduleHint && !file.includes(input.moduleHint)) {
      continue;
    }
    const content = await safeRead(abs);

    const statusMatch = content.match(STATUS_PATTERN);
    if (statusMatch?.length && shouldInclude("status", input.focus)) {
      statusTransitions.add(`${file}: ${statusMatch[0]}`);
      rules.push({
        id: `RULE-${idx++}`,
        type: "status",
        name: "状态流转或状态校验",
        condition: statusMatch[0],
        action: "状态判断触发分支处理",
        evidenceRefs: [file],
        confidence: "medium"
      });
    }

    const amountMatch = content.match(AMOUNT_PATTERN);
    if (amountMatch?.length && shouldInclude("validation", input.focus)) {
      validations.add(`${file}: ${amountMatch[0]}`);
      rules.push({
        id: `RULE-${idx++}`,
        type: "validation",
        name: "金额类校验",
        condition: amountMatch[0],
        action: "参数或业务数据校验",
        evidenceRefs: [file],
        confidence: "medium"
      });
    }

    if (ROLE_PATTERN.test(content) && shouldInclude("permission", input.focus)) {
      rules.push({
        id: `RULE-${idx++}`,
        type: "permission",
        name: "角色/权限控制",
        condition: "命中权限关键字",
        action: "可能存在基于角色或权限的访问控制",
        evidenceRefs: [file],
        confidence: "low"
      });
    }
    ROLE_PATTERN.lastIndex = 0;

    if (IDEMPOTENT_PATTERN.test(content) && shouldInclude("idempotent", input.focus)) {
      idempotentOrRetryPoints.add(`${file}: idempotent`);
      rules.push({
        id: `RULE-${idx++}`,
        type: "idempotent",
        name: "幂等处理",
        condition: "命中幂等/重复提交关键字",
        action: "疑似防重复执行控制",
        evidenceRefs: [file],
        confidence: "low"
      });
    }
    IDEMPOTENT_PATTERN.lastIndex = 0;

    if (RETRY_PATTERN.test(content) && shouldInclude("retry", input.focus)) {
      idempotentOrRetryPoints.add(`${file}: retry`);
      rules.push({
        id: `RULE-${idx++}`,
        type: "retry",
        name: "补偿或重试机制",
        condition: "命中 retry/compensate 关键字",
        action: "疑似失败重试或补偿逻辑",
        evidenceRefs: [file],
        confidence: "low"
      });
    }
    RETRY_PATTERN.lastIndex = 0;

    if (CALLBACK_PATTERN.test(content) && shouldInclude("callback", input.focus)) {
      rules.push({
        id: `RULE-${idx++}`,
        type: "callback",
        name: "回调处理",
        condition: "命中 callback/webhook/notify 关键字",
        action: "疑似外部回调入口或通知处理",
        evidenceRefs: [file],
        confidence: "low"
      });
    }
    CALLBACK_PATTERN.lastIndex = 0;
  }

  return {
    moduleHint: input.moduleHint,
    rules,
    statusTransitions: [...statusTransitions],
    validations: [...validations],
    idempotentOrRetryPoints: [...idempotentOrRetryPoints]
  };
}
