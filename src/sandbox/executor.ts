import fs from 'fs/promises';
import path from 'path';

export class SandboxExecutor {
  constructor(private readonly workingDir: string) {}

  private resolveWithinWorkingDir(inputPath: string): string {
    const resolved = path.resolve(this.workingDir, inputPath);
    const relative = path.relative(this.workingDir, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Path traversal detected: ${inputPath}`);
    }
    return resolved;
  }

  async readFile(inputPath: string): Promise<string> {
    const target = this.resolveWithinWorkingDir(inputPath);
    return fs.readFile(target, 'utf-8');
  }

  async writeFile(inputPath: string, content: string): Promise<void> {
    const target = this.resolveWithinWorkingDir(inputPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf-8');
  }

  async listFiles(inputPath = '.'): Promise<string[]> {
    const target = this.resolveWithinWorkingDir(inputPath);
    const entries = await fs.readdir(target, { withFileTypes: true });
    return entries.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name));
  }
}
