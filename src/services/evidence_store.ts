import { promises as fs } from "node:fs";
import path from "node:path";
import type { Evidence } from "../models/domain_models.js";

const STORE_DIR = ".repo-reverse";
const EVIDENCE_FILE = "evidence_store.json";

async function ensureStore(root: string): Promise<string> {
  const dir = path.join(root, STORE_DIR);
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, EVIDENCE_FILE);
}

export async function loadEvidence(root: string): Promise<Evidence[]> {
  const file = await ensureStore(root);
  try {
    const text = await fs.readFile(file, "utf8");
    const data = JSON.parse(text) as Evidence[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveEvidence(root: string, evidence: Evidence[]): Promise<void> {
  const file = await ensureStore(root);
  await fs.writeFile(file, JSON.stringify(evidence, null, 2), "utf8");
}
