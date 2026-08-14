import { SandboxExecutor } from '../sandbox/executor';
import { ToolDefinition, ToolResult } from './types';

export function createReadFileTool(executor: SandboxExecutor): ToolDefinition {
  return {
    name: 'read_file',
    description: 'Read the contents of a file within the working directory.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file to read',
        },
      },
      required: ['path'],
    },
    riskLevel: 'safe',
    async execute(input: unknown): Promise<ToolResult> {
      const { path } = input as { path: string };
      if (!path || typeof path !== 'string') {
        return { content: 'Missing or invalid "path" argument', is_error: true };
      }
      try {
        const content = await executor.readFile(path);
        return { content };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: `Error reading file: ${message}`, is_error: true };
      }
    },
  };
}
