/**
 * HTTP client for UXLens API.
 * All MCP tools call uxlens.pro/api/mcp/* endpoints.
 */
export declare function mcpFetch<T>(path: string, body: object): Promise<T>;
