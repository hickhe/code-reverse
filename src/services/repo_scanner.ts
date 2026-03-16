import path from "node:path";
import { safeRead, walkFiles } from "../utils/fs.js";
import type { RepoInventoryInput, RepoInventoryOutput, RouteInfo } from "../models/tool_types.js";

const LANG_BY_EXT: Record<string, string> = {
  ".java": "java",
  ".ts": "typescript",
  ".js": "javascript",
  ".vue": "vue",
  ".tsx": "typescript",
  ".jsx": "javascript",
  ".sql": "sql",
  ".xml": "xml"
};

const ROUTE_PATTERNS: RegExp[] = [
  /@(Get|Post|Put|Delete|Patch)Mapping\((?:value\s*=\s*)?["'`]([^"'`]+)["'`]\)/g,
  /router\.(get|post|put|delete|patch)\(["'`]([^"'`]+)["'`]/g,
  /app\.(get|post|put|delete|patch)\(["'`]([^"'`]+)["'`]/g
];

function normalizePath(file: string, root: string): string {
  return path.relative(root, file).split(path.sep).join("/");
}

export async function repoInventory(input: RepoInventoryInput): Promise<RepoInventoryOutput> {
  const files = await walkFiles(input.workspaceRoot);
  const moduleSet = new Set<string>();
  const languageSummary: Record<string, number> = {};
  const routes: RouteInfo[] = [];
  const services: string[] = [];
  const repositoriesOrMappers: string[] = [];
  const sqlFiles: string[] = [];
  const configFiles: string[] = [];
  const enumsOrStatusFiles: string[] = [];

  const allowedLanguages = input.languages?.length ? new Set(input.languages.map((x) => x.toLowerCase())) : undefined;

  for (const file of files) {
    const rel = normalizePath(file, input.workspaceRoot);
    const ext = path.extname(file);
    const language = (LANG_BY_EXT[ext] ?? "other").toLowerCase();
    languageSummary[language] = (languageSummary[language] ?? 0) + 1;
    if (allowedLanguages && !allowedLanguages.has(language)) {
      continue;
    }

    const [topDir] = rel.split("/");
    if (topDir && topDir !== rel) {
      moduleSet.add(topDir);
    }

    const lowered = rel.toLowerCase();
    if (lowered.includes("service") && /\.(java|ts|js)$/.test(lowered)) {
      services.push(rel);
    }
    if (/(repository|mapper)/i.test(rel)) {
      repositoriesOrMappers.push(rel);
    }
    if (ext === ".sql") {
      sqlFiles.push(rel);
    }
    if (/(application\.|\.ya?ml$|\.properties$|\.env$|config)/i.test(rel)) {
      configFiles.push(rel);
    }
    if (/(enum|status|state|errorcode)/i.test(rel)) {
      enumsOrStatusFiles.push(rel);
    }

    if ([".java", ".ts", ".js"].includes(ext)) {
      const content = await safeRead(file);
      for (const pattern of ROUTE_PATTERNS) {
        pattern.lastIndex = 0;
        let match = pattern.exec(content);
        while (match) {
          routes.push({ file: rel, method: match[1].toUpperCase(), path: match[2] });
          match = pattern.exec(content);
        }
      }
    }
  }

  return {
    workspaceRoot: input.workspaceRoot,
    moduleDirectories: [...moduleSet].sort(),
    languageSummary,
    routes,
    services: services.sort(),
    repositoriesOrMappers: repositoriesOrMappers.sort(),
    sqlFiles: sqlFiles.sort(),
    configFiles: configFiles.sort(),
    enumsOrStatusFiles: enumsOrStatusFiles.sort()
  };
}
