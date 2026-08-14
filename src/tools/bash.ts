import { CommandRunner } from '../ports/commandRunner';
import { ToolDefinition, ToolResult } from './types';

const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+/i,
  /rm\s+-r\s+\//i,
  /rm\s+-f\s+\//i,
  /mkfs\./i,
  /dd\s+if=[^\s]+\s+of=\/dev\//i,
  /:\(\)\{\s*:\s*\|\s*:\s*(&|;)\s*\}/,
  /curl\s+[^|]+\|\s*(ba)?sh/i,
  /wget\s+[^|]+\|\s*(ba)?sh/i,
  />\s*\/dev\/(sda|sdb|sd.)/i,
];

export function createBashTool(commandRunner: CommandRunner): ToolDefinition {
  return {
    name: 'bash',
    description:
      'Run an arbitrary shell command in the sandboxed working directory. Be careful with destructive operations.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute',
        },
      },
      required: ['command'],
    },
    riskLevel: 'confirm',
    async execute(input: unknown): Promise<ToolResult> {
      const { command } = input as { command: string };
      if (!command || typeof command !== 'string') {
        return { content: 'Missing or invalid "command" argument', is_error: true };
      }

      const dangerous = DANGEROUS_PATTERNS.find((pattern) => pattern.test(command));
      if (dangerous) {
        return {
          content: `Refused to run potentially dangerous command: ${command}`,
          is_error: true,
        };
      }

      const result = await commandRunner.run(command);
      const output = [result.stdout, result.stderr]
        .filter((part) => part.length > 0)
        .join('\n---\n');
      return {
        content: output || '(no output)',
        is_error: result.exitCode !== 0,
      };
    },
  };
}
