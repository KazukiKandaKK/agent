export interface LlmTextBlock {
  type: 'text';
  text: string;
}

export interface LlmToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

export type LlmContentBlock = LlmTextBlock | LlmToolUseBlock;

export interface LlmToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content?: string;
  is_error?: boolean;
}

export type LlmContentBlockParam = LlmTextBlock | LlmToolUseBlock | LlmToolResultBlock;

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<LlmContentBlockParam>;
}

export interface LlmTool {
  name: string;
  description?: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface LlmRequest {
  systemPrompt?: string;
  messages: Array<LlmMessage>;
  tools?: Array<LlmTool>;
  maxTokens: number;
}

export interface LlmResponse {
  content: Array<LlmContentBlock>;
  stopReason:
    | 'end_turn'
    | 'tool_use'
    | 'max_tokens'
    | 'stop_sequence'
    | 'model_context_window_exceeded'
    | 'refusal'
    | 'pause_turn'
    | null;
}

export interface LlmClient {
  complete(request: LlmRequest): Promise<LlmResponse>;
}
