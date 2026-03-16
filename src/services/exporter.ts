import { promises as fs } from "node:fs";
import path from "node:path";

const STORE_DIR = ".repo-reverse";

export async function exportMarkdown(root: string, fileName: string, content: string): Promise<string> {
  const dir = path.join(root, STORE_DIR, "exports");
  await fs.mkdir(dir, { recursive: true });
  const target = path.join(dir, fileName);
  await fs.writeFile(target, content, "utf8");
  return target;
}

export async function exportJson(root: string, fileName: string, data: unknown): Promise<string> {
  const dir = path.join(root, STORE_DIR, "exports");
  await fs.mkdir(dir, { recursive: true });
  const target = path.join(dir, fileName);
  await fs.writeFile(target, JSON.stringify(data, null, 2), "utf8");
  return target;
}
