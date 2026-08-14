import Anthropic from '@anthropic-ai/sdk';
import {
  ContentBlock,
  ContentBlockParam,
  MessageParam,
  Tool,
} from '@anthropic-ai/sdk/resources/messages/messages';
import {
  LlmClient,
  LlmContentBlock,
  LlmMessage,
  LlmRequest,
  LlmResponse,
} from '../ports/llmClient';

export class AnthropicLlmClient implements LlmClient {
  private readonly anthropic: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string
  ) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const messages: MessageParam[] = request.messages.map(toAnthropicMessage);
    const tools: Tool[] | undefined = request.tools?.map(toAnthropicTool);

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: request.maxTokens,
      system: request.systemPrompt,
      messages,
      tools,
      tool_choice: { type: 'auto' },
    });

    return {
      content: response.content.map(toLlmContentBlock),
      stopReason: response.stop_reason,
    };
  }
}

function toAnthropicMessage(message: LlmMessage): MessageParam {
  if (typeof message.content === 'string') {
    return { role: message.role, content: message.content };
  }
  return {
    role: message.role,
    content: message.content as ContentBlockParam[],
  };
}

function toAnthropicTool(tool: {
  name: string;
  description?: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}): Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as Tool['input_schema'],
  };
}

function toLlmContentBlock(block: ContentBlock): LlmContentBlock {
  if (block.type === 'text') {
    return { type: 'text', text: block.text };
  }
  if (block.type === 'tool_use') {
    return {
      type: 'tool_use',
      id: block.id,
      name: block.name,
      input: block.input,
    };
  }
  // Other block types (thinking, etc.) are coerced to text for the harness.
  return { type: 'text', text: JSON.stringify(block) };
}
