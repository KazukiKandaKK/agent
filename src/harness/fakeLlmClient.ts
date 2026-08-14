import { LlmClient, LlmRequest, LlmResponse } from '../ports/llmClient';

export class FakeLlmClient implements LlmClient {
  public requests: LlmRequest[] = [];
  private responses: LlmResponse[] = [];
  private index = 0;

  enqueueResponse(response: LlmResponse): void {
    this.responses.push(response);
  }

  setResponses(responses: LlmResponse[]): void {
    this.responses = responses;
    this.index = 0;
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    this.requests.push(request);
    if (this.index >= this.responses.length) {
      return { content: [{ type: 'text', text: 'done' }], stopReason: 'end_turn' };
    }
    return this.responses[this.index++];
  }
}
