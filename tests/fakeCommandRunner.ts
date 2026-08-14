import { CommandResult, CommandRunner } from '../src/ports/commandRunner';

export class FakeCommandRunner implements CommandRunner {
  public commands: Array<{ command: string; cwd?: string }> = [];

  constructor(
    private readonly fixedResult: CommandResult = { stdout: '', stderr: '', exitCode: 0 }
  ) {}

  async run(command: string, cwd?: string): Promise<CommandResult> {
    this.commands.push({ command, cwd });
    return this.fixedResult;
  }
}
