import { exec } from 'child_process';
import { promisify } from 'util';
import { CommandResult, CommandRunner } from '../ports/commandRunner';

const execAsync = promisify(exec);

export class NodeCommandRunner implements CommandRunner {
  constructor(private readonly defaultCwd: string = process.cwd()) {}

  async run(command: string, cwd?: string): Promise<CommandResult> {
    const targetCwd = cwd ?? this.defaultCwd;
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: targetCwd,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });
      return {
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        exitCode: 0,
      };
    } catch (error: unknown) {
      const execError = error as {
        stdout?: string;
        stderr?: string;
        code?: number;
        message?: string;
      };
      return {
        stdout: execError.stdout ?? '',
        stderr: execError.stderr ?? execError.message ?? '',
        exitCode: execError.code ?? 1,
      };
    }
  }
}
