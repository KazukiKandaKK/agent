export interface WebSearchClient {
  search(query: string): Promise<string>;
}
