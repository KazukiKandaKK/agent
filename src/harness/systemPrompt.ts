import { ToolDefinition } from '../tools/types';

export function buildSystemPrompt(tools: ToolDefinition[]): string {
  const toolList = tools
    .map((tool) => {
      return `- ${tool.name}: ${tool.description} (risk: ${tool.riskLevel})\n  Input schema: ${JSON.stringify(
        tool.inputSchema
      )}`;
    })
    .join('\n');

  return [
    'You are a helpful coding agent that can use tools to complete tasks.',
    'Work step by step: think, act, observe, and decide.',
    'Before editing files, always read them first unless you are creating a new file.',
    'When a tool asks for confirmation, wait for the user response before assuming success.',
    'Never run obviously destructive commands (rm -rf, mkfs, etc.).',
    '',
    'Available tools:',
    toolList || '(none)',
    '',
    'Return your final answer only after the task is complete.',
  ].join('\n');
}
