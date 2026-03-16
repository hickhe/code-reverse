declare module "node:fs" {
  export const promises: {
    readdir(path: string, opts: { withFileTypes: true }): Promise<Array<{ name: string; isDirectory(): boolean }>>;
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: string, encoding: string): Promise<void>;
    mkdir(path: string, opts: { recursive: true }): Promise<void>;
  };
}

declare module "node:path" {
  const path: {
    join(...parts: string[]): string;
    extname(file: string): string;
    relative(from: string, to: string): string;
    sep: string;
  };
  export default path;
}

declare module "node:child_process" {
  export function execSync(cmd: string, opts?: { encoding?: string }): string;
}
