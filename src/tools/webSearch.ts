import { WebSearchClient } from '../ports/webSearchClient';
import { ToolDefinition, ToolResult } from './types';

export class MockWebSearchClient implements WebSearchClient {
  async search(query: string): Promise<string> {
    return JSON.stringify(
      {
        query,
        results: [
          {
            title: 'Mock search result',
            url: 'https://example.com',
            snippet: 'This is a mock web search result. Real search provider not configured.',
          },
        ],
      },
      null,
      2
    );
  }
}

export function createWebSearchTool(client: WebSearchClient): ToolDefinition {
  return {
    name: 'web_search',
    description: 'Search the web for a query and return a summary of results.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
    riskLevel: 'safe',
    async execute(input: unknown): Promise<ToolResult> {
      const { query } = input as { query: string };
      if (!query || typeof query !== 'string') {
        return { content: 'Missing or invalid "query" argument', is_error: true };
      }
      const result = await client.search(query);
      return { content: result };
    },
  };
}
