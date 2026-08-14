import { LlmTool } from '../ports/llmClient';
import { ToolDefinition } from './types';

export function toLlmTools(tools: ToolDefinition[]): LlmTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as LlmTool['input_schema'],
  }));
}

export function findTool(tools: ToolDefinition[], name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}
