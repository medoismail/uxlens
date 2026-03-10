import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAuditTool } from "./tools/audit.js";
import { registerVisualTool } from "./tools/visual.js";
import { registerCompetitorTool } from "./tools/competitor.js";
import { registerFullAuditTool } from "./tools/full-audit.js";

const server = new McpServer({
  name: "uxlens",
  version: "0.1.0",
});

// Register all tools
registerAuditTool(server);
registerVisualTool(server);
registerCompetitorTool(server);
registerFullAuditTool(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
