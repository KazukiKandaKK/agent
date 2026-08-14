export type RiskLevel = 'safe' | 'confirm' | 'dangerous';

export interface ToolResult {
  content: string;
  is_error?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  riskLevel: RiskLevel;
  execute: (input: unknown) => Promise<ToolResult>;
}
