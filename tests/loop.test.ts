import { FakeLlmClient } from '../src/harness/fakeLlmClient';
import { AgentLoop } from '../src/harness/loop';
import { FakeConfirmationPrompt } from '../src/safety/fakeConfirmationPrompt';
import { PermissionGate } from '../src/safety/permissions';
import { ToolDefinition, ToolResult } from '../src/tools/types';

const echoTool: ToolDefinition = {
  name: 'echo',
  description: 'Echoes the input',
  inputSchema: {
    type: 'object',
    properties: { message: { type: 'string' } },
    required: ['message'],
  },
  riskLevel: 'safe',
  async execute(input: unknown): Promise<ToolResult> {
    const { message } = input as { message: string };
    return { content: `echo: ${message}` };
  },
};

function createLoop(client: FakeLlmClient, maxIterations = 10): AgentLoop {
  return new AgentLoop(client, [echoTool], new PermissionGate(new FakeConfirmationPrompt(true)), {
    maxIterations,
    maxTokens: 100,
  });
}

describe('AgentLoop', () => {
  it('stops on end_turn and returns the assistant text', async () => {
    const client = new FakeLlmClient();
    client.enqueueResponse({
      content: [{ type: 'text', text: 'All done' }],
      stopReason: 'end_turn',
    });

    const loop = createLoop(client);
    const result = await loop.run('test input');

    expect(result.output).toBe('All done');
    expect(result.iterations).toBe(1);
    expect(result.stoppedDueToLimit).toBe(false);
    expect(client.requests).toHaveLength(1);
  });

  it('calls a tool and continues until end_turn', async () => {
    const client = new FakeLlmClient();
    client.enqueueResponse({
      content: [
        {
          type: 'tool_use',
          id: 'toolu_1',
          name: 'echo',
          input: { message: 'hello' },
        },
      ],
      stopReason: 'tool_use',
    });
    client.enqueueResponse({
      content: [{ type: 'text', text: 'Finished' }],
      stopReason: 'end_turn',
    });

    const loop = createLoop(client);
    const result = await loop.run('test input');

    expect(result.output).toBe('Finished');
    expect(result.iterations).toBe(2);
    expect(client.requests).toHaveLength(2);
  });

  it('stops safely after max iterations', async () => {
    const client = new FakeLlmClient();
    client.setResponses(
      Array.from({ length: 5 }, () => ({
        content: [
          { type: 'tool_use' as const, id: 'toolu_x', name: 'echo', input: { message: 'x' } },
        ],
        stopReason: 'tool_use' as const,
      }))
    );

    const loop = createLoop(client, 3);
    const result = await loop.run('test input');

    expect(result.stoppedDueToLimit).toBe(true);
    expect(result.iterations).toBe(3);
  });
});
