import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer, runServer } from './setup.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn()
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}));

interface MockServer {
  setRequestHandler: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
}

describe('Server Setup', () => {
  let mockServer: MockServer;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      setRequestHandler: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(Server).mockImplementation(() => mockServer as unknown as Server);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('createServer', () => {
    it('should create a server with correct configuration', () => {
      const server = createServer();
      
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'cascade-thinking-mcp',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );
      
      expect(server).toBe(mockServer);
    });

    it('should register request handlers', () => {
      createServer();
      
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(2);
      
      // Check that handlers were registered
      const calls = mockServer.setRequestHandler.mock.calls;
      expect(calls[0][0]).toBeDefined(); // ListToolsRequestSchema
      expect(calls[1][0]).toBeDefined(); // CallToolRequestSchema
    });

    it('should handle ListToolsRequest', () => {
      createServer();
      
      // Get the list tools handler
      const listToolsHandler = mockServer.setRequestHandler.mock.calls[0][1] as () => { tools: { name: string }[] };
      const result = listToolsHandler();
      
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('cascade_thinking');
    });

    it('should handle CallToolRequest for cascade_thinking', () => {
      createServer();
      
      // Get the call tool handler
      const callToolHandler = mockServer.setRequestHandler.mock.calls[1][1] as (request: { params: { name: string; arguments: unknown } }) => CallToolResult;
      
      const request = {
        params: {
          name: 'cascade_thinking',
          arguments: {
            thought: 'Test',
            thoughtNumber: 1,
            totalThoughts: 1,
            nextThoughtNeeded: false
          }
        }
      };
      
      const result = callToolHandler(request);
      
      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      const textContent = result.content[0] as TextContent;
      const data = JSON.parse(textContent.text) as { thoughtNumber: number };
      expect(data.thoughtNumber).toBe(1);
    });

    it('should handle CallToolRequest for unknown tool', () => {
      createServer();
      
      // Get the call tool handler
      const callToolHandler = mockServer.setRequestHandler.mock.calls[1][1] as (request: { params: { name: string; arguments: unknown } }) => CallToolResult;
      
      const request = {
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };
      
      const result = callToolHandler(request);
      
      expect(result.isError).toBe(true);
      const textContent = result.content[0] as TextContent;
      expect(textContent.text).toBe('Unknown tool: unknown_tool');
    });
  });

  describe('runServer', () => {
    it('should create server, connect transport, and log startup message', async () => {
      await runServer();
      
      expect(Server).toHaveBeenCalled();
      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockServer.connect).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Cascade Thinking MCP Server running on stdio');
    });

    it('should handle connection errors', async () => {
      mockServer.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(runServer()).rejects.toThrow('Connection failed');
    });
  });
});