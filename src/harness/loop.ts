import { LlmClient, LlmToolUseBlock } from '../ports/llmClient';
import { PermissionGate } from '../safety/permissions';
import { findTool, toLlmTools } from '../tools/registry';
import { ToolDefinition } from '../tools/types';
import { buildSystemPrompt } from './systemPrompt';
import { ConversationContext } from './context';

export interface AgentResult {
  output: string;
  iterations: number;
  stoppedDueToLimit: boolean;
}

export class AgentLoop {
  constructor(
    private readonly llmClient: LlmClient,
    private readonly tools: ToolDefinition[],
    private readonly permissionGate: PermissionGate,
    private readonly options: { maxIterations: number; maxTokens: number }
  ) {}

  async run(userInput: string): Promise<AgentResult> {
    const systemPrompt = buildSystemPrompt(this.tools);
    const context = new ConversationContext();
    context.addUserText(userInput);

    for (let iteration = 1; iteration <= this.options.maxIterations; iteration++) {
      await context.trimIfNeeded();
      const response = await this.llmClient.complete({
        systemPrompt,
        messages: context.getMessages(),
        tools: toLlmTools(this.tools),
        maxTokens: this.options.maxTokens,
      });

      console.log(`\n[思考] ${iteration}: ${this.summarizeResponse(response.content)}`);
      context.addAssistantContent(response.content);

      if (response.stopReason === 'end_turn' || response.stopReason === 'stop_sequence') {
        const output = response.content
          .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
          .map((block) => block.text)
          .join('\n');
        return { output, iterations: iteration, stoppedDueToLimit: false };
      }

      if (response.stopReason !== 'tool_use') {
        return {
          output: `Stopped with reason: ${response.stopReason ?? 'unknown'}`,
          iterations: iteration,
          stoppedDueToLimit: false,
        };
      }

      const toolUseBlocks = response.content.filter(
        (block): block is LlmToolUseBlock => block.type === 'tool_use'
      );

      const results: Array<{ tool_use_id: string; content: string; is_error?: boolean }> = [];

      for (const block of toolUseBlocks) {
        const tool = findTool(this.tools, block.name);
        if (!tool) {
          results.push({
            tool_use_id: block.id,
            content: `Tool "${block.name}" not found`,
            is_error: true,
          });
          continue;
        }

        const description = `${tool.name}: ${JSON.stringify(block.input)}`;
        console.log(`[行動] ${description}`);

        const allowed = await this.permissionGate.canExecute(tool.riskLevel, description);
        if (!allowed) {
          results.push({
            tool_use_id: block.id,
            content: `Permission denied for ${tool.name}`,
            is_error: true,
          });
          continue;
        }

        try {
          const toolResult = await tool.execute(block.input);
          results.push({
            tool_use_id: block.id,
            content: toolResult.content,
            is_error: toolResult.is_error,
          });
          console.log(`[観察] ${tool.name}: ${toolResult.content.slice(0, 200)}`);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          results.push({
            tool_use_id: block.id,
            content: `Error executing ${tool.name}: ${message}`,
            is_error: true,
          });
          console.log(`[観察] ${tool.name}: Error - ${message}`);
        }
      }

      context.addToolResults(results);
    }

    return {
      output: `Stopped after reaching the maximum number of iterations (${this.options.maxIterations}).`,
      iterations: this.options.maxIterations,
      stoppedDueToLimit: true,
    };
  }

  private summarizeResponse(content: Array<{ type: string; text?: string }>): string {
    const text = content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join(' ');
    const toolNames = content
      .filter((block) => block.type === 'tool_use')
      .map((block) => (block as LlmToolUseBlock).name);
    const parts = [];
    if (text) parts.push(text.slice(0, 200));
    if (toolNames.length > 0) parts.push(`tools: ${toolNames.join(', ')}`);
    return parts.join(' | ') || '(no content)';
  }
}
