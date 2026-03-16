import { promises as fs } from "node:fs";
import path from "node:path";
import type { Requirement } from "../models/domain_models.js";

const STORE_DIR = ".repo-reverse";
const BASELINE_FILE = "requirements_baseline.json";

async function ensureStore(root: string): Promise<string> {
  const dir = path.join(root, STORE_DIR);
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, BASELINE_FILE);
}

export async function loadBaseline(root: string): Promise<Requirement[]> {
  const file = await ensureStore(root);
  try {
    const text = await fs.readFile(file, "utf8");
    const data = JSON.parse(text) as Requirement[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function saveBaseline(root: string, requirements: Requirement[]): Promise<void> {
  const file = await ensureStore(root);
  await fs.writeFile(file, JSON.stringify(requirements, null, 2), "utf8");
}
