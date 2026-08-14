import { LlmContentBlock, LlmMessage, LlmToolResultBlock } from '../ports/llmClient';

export class ConversationContext {
  private messages: LlmMessage[] = [];

  constructor(private readonly maxChars: number = 100_000) {}

  addUserText(text: string): void {
    this.messages.push({ role: 'user', content: text });
  }

  addAssistantContent(content: LlmContentBlock[]): void {
    this.messages.push({ role: 'assistant', content });
  }

  addToolResults(
    results: Array<{ tool_use_id: string; content: string; is_error?: boolean }>
  ): void {
    const blocks: LlmToolResultBlock[] = results.map((result) => ({
      type: 'tool_result',
      tool_use_id: result.tool_use_id,
      content: result.content,
      is_error: result.is_error,
    }));
    this.messages.push({ role: 'user', content: blocks });
  }

  getMessages(): LlmMessage[] {
    return this.messages;
  }

  async trimIfNeeded(): Promise<void> {
    let total = this.estimateChars();
    while (total > this.maxChars && this.messages.length > 2) {
      // Drop the oldest non-system message pair ( preserving the latest conversation )
      this.messages.shift();
      total = this.estimateChars();
    }
  }

  private estimateChars(): number {
    return JSON.stringify(this.messages).length;
  }
}
