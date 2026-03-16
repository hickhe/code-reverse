import { execSync } from "node:child_process";

export function getChangedFiles(workspaceRoot: string, baseRef: string): string[] {
  try {
    const output = execSync(`git -C ${workspaceRoot} diff --name-only ${baseRef}...HEAD`, { encoding: "utf8" });
    return output
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function getImpactedModules(files: string[]): string[] {
  const modules = new Set<string>();
  for (const file of files) {
    const [head] = file.split("/");
    if (head) {
      modules.add(head);
    }
  }
  return [...modules].sort();
}
