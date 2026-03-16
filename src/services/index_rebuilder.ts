import { repoInventory } from "./repo_scanner.js";
import { getChangedFiles, getImpactedModules } from "./diff_analyzer.js";
import type { RebuildIndexInput, RebuildIndexOutput } from "../models/tool_types.js";

export async function rebuildIndex(input: RebuildIndexInput): Promise<RebuildIndexOutput> {
  const inventory = await repoInventory({ workspaceRoot: input.workspaceRoot });

  const changedFiles =
    input.mode === "incremental" && input.gitBase ? getChangedFiles(input.workspaceRoot, input.gitBase) : [];

  const impacted = getImpactedModules(changedFiles);
  const impactedModules =
    input.mode === "full" || impacted.length === 0 ? inventory.moduleDirectories : impacted;

  return {
    mode: input.mode,
    impactedModules,
    changedFiles,
    summary: {
      routeCount: inventory.routes.length,
      serviceCount: inventory.services.length,
      sqlCount: inventory.sqlFiles.length
    }
  };
}
