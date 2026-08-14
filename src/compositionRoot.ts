import { config } from './config';
import { AnthropicLlmClient } from './harness/anthropicLlmClient';
import { AgentLoop } from './harness/loop';
import { LlmClient } from './ports/llmClient';
import { NodeCommandRunner } from './sandbox/nodeCommandRunner';
import { SandboxExecutor } from './sandbox/executor';
import { CliConfirmationPrompt } from './safety/cliConfirmationPrompt';
import { PermissionGate } from './safety/permissions';
import { createBashTool } from './tools/bash';
import { createReadFileTool } from './tools/fileRead';
import { createEditFileTool, createWriteFileTool } from './tools/fileWrite';
import { createWebSearchTool, MockWebSearchClient } from './tools/webSearch';
import { ToolDefinition } from './tools/types';

export interface AgentHarness {
  run(
    userInput: string
  ): Promise<{ output: string; iterations: number; stoppedDueToLimit: boolean }>;
}

export function createProductionHarness(): AgentHarness {
  const llmClient: LlmClient = new AnthropicLlmClient(config.anthropicApiKey, config.model);
  const commandRunner = new NodeCommandRunner(config.workingDir);
  const executor = new SandboxExecutor(config.workingDir);
  const confirmationPrompt = new CliConfirmationPrompt();
  const permissionGate = new PermissionGate(confirmationPrompt);

  const tools: ToolDefinition[] = [
    createBashTool(commandRunner),
    createReadFileTool(executor),
    createWriteFileTool(executor),
    createEditFileTool(executor),
    createWebSearchTool(new MockWebSearchClient()),
  ];

  const loop = new AgentLoop(llmClient, tools, permissionGate, {
    maxIterations: config.maxIterations,
    maxTokens: config.maxTokens,
  });

  return {
    async run(userInput: string) {
      return loop.run(userInput);
    },
  };
}
