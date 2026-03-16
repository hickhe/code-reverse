import path from "node:path";
import { safeRead, walkFiles } from "../utils/fs.js";
import type { RouteInfo, TraceApiFlowsInput, TraceApiFlowsOutput, TraceNode } from "../models/tool_types.js";

const CALL_PATTERN = /([A-Za-z0-9_]+)\s*\(/g;
const TABLE_PATTERN = /(from|join|update|into)\s+([A-Za-z0-9_]+)/gi;

function rel(file: string, root: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

function findRoutes(content: string, file: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const patterns = [
    /@(Get|Post|Put|Delete|Patch)Mapping\((?:value\s*=\s*)?["'`]([^"'`]+)["'`]\)/g,
    /router\.(get|post|put|delete|patch)\(["'`]([^"'`]+)["'`]/g
  ];
  for (const p of patterns) {
    p.lastIndex = 0;
    let m = p.exec(content);
    while (m) {
      routes.push({ file, method: m[1].toUpperCase(), path: m[2] });
      m = p.exec(content);
    }
  }
  return routes;
}

export async function traceApiFlows(input: TraceApiFlowsInput): Promise<TraceApiFlowsOutput> {
  const maxDepth = input.depth ?? 3;
  const allFiles = await walkFiles(input.workspaceRoot);
  const codeFiles = allFiles.filter((f) => /\.(java|ts|js|sql)$/i.test(f));

  const contentMap = new Map<string, string>();
  for (const file of codeFiles) {
    contentMap.set(file, await safeRead(file));
  }

  const matchedRoutes: RouteInfo[] = [];
  const chain: TraceNode[] = [];
  const relatedTables = new Set<string>();
  const relatedDtosOrEntities = new Set<string>();

  for (const [file, content] of contentMap.entries()) {
    const relative = rel(file, input.workspaceRoot);
    if (input.moduleHint && !relative.includes(input.moduleHint)) {
      continue;
    }
    for (const route of findRoutes(content, relative)) {
      const hitByPath = input.apiPath ? route.path.includes(input.apiPath) : false;
      const hitByClass = input.className ? relative.includes(input.className) : false;
      const hitByModuleOnly = !input.apiPath && !input.className && !!input.moduleHint;
      if (hitByPath || hitByClass || hitByModuleOnly) {
        matchedRoutes.push(route);
        chain.push({ file: route.file, symbol: `${route.method} ${route.path}`, kind: "route" });
      }
    }
  }

  const queue = [...matchedRoutes.map((r) => r.file)];
  const visited = new Set<string>(queue);
  let level = 0;

  while (queue.length && level < maxDepth) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const currentRel = queue.shift();
      if (!currentRel) {
        continue;
      }
      const currentAbs = path.join(input.workspaceRoot, currentRel);
      const content = contentMap.get(currentAbs) ?? "";
      const symbols = new Set<string>();
      let match = CALL_PATTERN.exec(content);
      while (match) {
        symbols.add(match[1]);
        match = CALL_PATTERN.exec(content);
      }
      CALL_PATTERN.lastIndex = 0;

      for (const symbol of symbols) {
        const symbolLc = symbol.toLowerCase();
        const target = [...contentMap.keys()].find((f) => rel(f, input.workspaceRoot).toLowerCase().includes(symbolLc));
        if (target) {
          const targetRel = rel(target, input.workspaceRoot);
          if (!visited.has(targetRel)) {
            visited.add(targetRel);
            queue.push(targetRel);
          }
          const kind: TraceNode["kind"] = /service/i.test(targetRel)
            ? "service"
            : /(repository|mapper)/i.test(targetRel)
              ? "repository"
              : targetRel.endsWith(".sql")
                ? "sql"
                : "controller";
          chain.push({ file: targetRel, symbol, kind });
          if (/(dto|entity|vo)/i.test(targetRel)) {
            relatedDtosOrEntities.add(targetRel);
          }
          if (targetRel.endsWith(".sql")) {
            const sqlText = contentMap.get(target) ?? "";
            let tm = TABLE_PATTERN.exec(sqlText);
            while (tm) {
              relatedTables.add(tm[2]);
              tm = TABLE_PATTERN.exec(sqlText);
            }
            TABLE_PATTERN.lastIndex = 0;
          }
        }
      }
    }
    level += 1;
  }

  return {
    query: {
      apiPath: input.apiPath,
      className: input.className,
      moduleHint: input.moduleHint,
      depth: maxDepth
    },
    matchedRoutes,
    chain,
    relatedTables: [...relatedTables].sort(),
    relatedDtosOrEntities: [...relatedDtosOrEntities].sort()
  };
}
