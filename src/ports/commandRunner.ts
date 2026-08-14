export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CommandRunner {
  run(command: string, cwd?: string): Promise<CommandResult>;
}
