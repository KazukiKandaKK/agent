import { LlmTool } from '../src/ports/llmClient';
import { SandboxExecutor } from '../src/sandbox/executor';
import { createReadFileTool } from '../src/tools/fileRead';
import { toLlmTools } from '../src/tools/registry';

describe('tool registry', () => {
  it('converts ToolDefinitions to Anthropic tool format', () => {
    const executor = new SandboxExecutor('/tmp');
    const tool = createReadFileTool(executor);

    const anthropicTools: LlmTool[] = toLlmTools([tool]);

    expect(anthropicTools).toHaveLength(1);
    expect(anthropicTools[0].name).toBe('read_file');
    expect(anthropicTools[0].description).toBe(tool.description);
    expect(anthropicTools[0].input_schema).toEqual(tool.inputSchema);
  });
});
