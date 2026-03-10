/**
 * HTTP client for UXLens API.
 * All MCP tools call uxlens.pro/api/mcp/* endpoints.
 */
const DEFAULT_BASE_URL = "https://uxlens.pro";
function getBaseUrl() {
    return process.env.UXLENS_BASE_URL || DEFAULT_BASE_URL;
}
function getApiKey() {
    const key = process.env.UXLENS_API_KEY;
    if (!key) {
        throw new Error("UXLENS_API_KEY environment variable is required. " +
            "Generate one at https://uxlens.pro/dashboard (Pro plan required).");
    }
    return key;
}
export async function mcpFetch(path, body) {
    const baseUrl = getBaseUrl();
    const apiKey = getApiKey();
    const res = await fetch(`${baseUrl}/api/mcp${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const message = errBody.error || errBody.detail || `API error ${res.status}`;
        if (res.status === 401) {
            throw new Error(`Authentication failed: ${message}. Check your UXLENS_API_KEY.`);
        }
        if (res.status === 403) {
            throw new Error(`Access denied: ${message}. Pro or Agency plan required.`);
        }
        if (res.status === 429) {
            throw new Error(`Rate limited: ${message}. Please wait and try again.`);
        }
        throw new Error(message);
    }
    return res.json();
}
//# sourceMappingURL=client.js.map