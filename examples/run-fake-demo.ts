import path from 'path';
import { AgentLoop } from '../src/harness/loop';
import { FakeLlmClient } from '../src/harness/fakeLlmClient';
import { LlmResponse } from '../src/ports/llmClient';
import { NodeCommandRunner } from '../src/sandbox/nodeCommandRunner';
import { SandboxExecutor } from '../src/sandbox/executor';
import { FakeConfirmationPrompt } from '../src/safety/fakeConfirmationPrompt';
import { PermissionGate } from '../src/safety/permissions';
import { createBashTool } from '../src/tools/bash';
import { createReadFileTool } from '../src/tools/fileRead';
import { createEditFileTool, createWriteFileTool } from '../src/tools/fileWrite';
import { createWebSearchTool, MockWebSearchClient } from '../src/tools/webSearch';

const workingDir = path.resolve(__dirname, 'sample-project');
const commandRunner = new NodeCommandRunner(workingDir);
const executor = new SandboxExecutor(workingDir);

const tools = [
  createBashTool(commandRunner),
  createReadFileTool(executor),
  createWriteFileTool(executor),
  createEditFileTool(executor),
  createWebSearchTool(new MockWebSearchClient()),
];

const client = new FakeLlmClient();
const responses: LlmResponse[] = [
  {
    content: [
      {
        type: 'tool_use',
        id: 'toolu_1',
        name: 'bash',
        input: { command: 'grep -n "password" auth.ts' },
      },
    ],
    stopReason: 'tool_use',
  },
  {
    content: [
      {
        type: 'tool_use',
        id: 'toolu_2',
        name: 'read_file',
        input: { path: 'auth.ts' },
      },
    ],
    stopReason: 'tool_use',
  },
  {
    content: [
      {
        type: 'tool_use',
        id: 'toolu_3',
        name: 'edit_file',
        input: {
          path: 'auth.ts',
          old_string: "  if (password !== 'secret') {",
          new_string: "  if (password === 'secret') {",
        },
      },
    ],
    stopReason: 'tool_use',
  },
  {
    content: [
      {
        type: 'text',
        text: "Fixed the inverted condition in auth.ts. The function now returns true only when the password is 'secret'.",
      },
    ],
    stopReason: 'end_turn',
  },
];

client.setResponses(responses);

const loop = new AgentLoop(client, tools, new PermissionGate(new FakeConfirmationPrompt(true)), {
  maxIterations: 10,
  maxTokens: 1024,
});

async function main(): Promise<void> {
  const result = await loop.run('Fix the login bug in auth.ts');
  console.log('\n[結果]');
  console.log(result.output);
  console.log(`\n(iterations: ${result.iterations}, stoppedDueToLimit: ${result.stoppedDueToLimit})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
