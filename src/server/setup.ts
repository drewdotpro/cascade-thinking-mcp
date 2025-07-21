import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CascadeThinkingServer } from '../services/cascade-thinking-server.js';
import { CASCADE_THINKING_TOOL } from '../tools/cascade-thinking-tool.js';

export function createServer(): Server {
  const server = new Server(
    {
      name: "cascade-thinking-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const thinkingServer = new CascadeThinkingServer();

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [CASCADE_THINKING_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    if (request.params.name === "cascade_thinking") {
      return thinkingServer.processThought(request.params.arguments);
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${request.params.name}`,
        },
      ],
      isError: true,
    };
  });

  return server;
}

export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cascade Thinking MCP Server running on stdio");
}