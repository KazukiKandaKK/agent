import { SandboxExecutor } from '../sandbox/executor';
import { ToolDefinition, ToolResult } from './types';

export function createWriteFileTool(executor: SandboxExecutor): ToolDefinition {
  return {
    name: 'write_file',
    description:
      'Write (overwrite) a file within the working directory. Existing content will be replaced.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file',
        },
        content: {
          type: 'string',
          description: 'Full content to write',
        },
      },
      required: ['path', 'content'],
    },
    riskLevel: 'confirm',
    async execute(input: unknown): Promise<ToolResult> {
      const { path, content } = input as { path: string; content: string };
      if (!path || typeof path !== 'string' || typeof content !== 'string') {
        return { content: 'Missing or invalid arguments', is_error: true };
      }
      try {
        await executor.writeFile(path, content);
        return { content: `Wrote ${path}` };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: `Error writing file: ${message}`, is_error: true };
      }
    },
  };
}

export function createEditFileTool(executor: SandboxExecutor): ToolDefinition {
  return {
    name: 'edit_file',
    description:
      'Edit a file within the working directory by replacing an exact string with another string.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path to the file',
        },
        old_string: {
          type: 'string',
          description: 'Exact text to replace',
        },
        new_string: {
          type: 'string',
          description: 'Replacement text',
        },
      },
      required: ['path', 'old_string', 'new_string'],
    },
    riskLevel: 'confirm',
    async execute(input: unknown): Promise<ToolResult> {
      const { path, old_string, new_string } = input as {
        path: string;
        old_string: string;
        new_string: string;
      };
      if (
        !path ||
        typeof path !== 'string' ||
        typeof old_string !== 'string' ||
        typeof new_string !== 'string'
      ) {
        return { content: 'Missing or invalid arguments', is_error: true };
      }
      try {
        const current = await executor.readFile(path);
        if (!current.includes(old_string)) {
          return { content: `old_string not found in ${path}`, is_error: true };
        }
        const updated = current.replace(old_string, new_string);
        await executor.writeFile(path, updated);
        return { content: `Edited ${path}` };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: `Error editing file: ${message}`, is_error: true };
      }
    },
  };
}
