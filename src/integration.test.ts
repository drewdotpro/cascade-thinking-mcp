import { describe, it, expect } from 'vitest';
import { createServer } from './server/setup.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('Cascade Thinking MCP Server Integration', () => {
  it('should work end-to-end as an MCP server', () => {
    // Create a real server instance
    const server = createServer();
    
    // The server should be properly configured
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(Server);
  });

  it('should process a complete thought sequence', async () => {
    // This test simulates what would happen when the MCP client calls the tool
    const { CascadeThinkingServer } = await import('./services/cascade-thinking-server.js');
    const cascadeServer = new CascadeThinkingServer();
    
    // Simulate processing multiple thoughts
    const thoughts = [
      {
        thought: 'Starting my analysis of the problem',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      },
      {
        thought: 'Actually, I need to reconsider my approach',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        isRevision: true,
        revisesThought: 1
      },
      {
        thought: 'Exploring an alternative solution',
        thoughtNumber: 3,
        totalThoughts: 4, // Dynamically adjusted
        nextThoughtNeeded: true,
        branchFromThought: 2,
        branchId: 'alternative-1'
      },
      {
        thought: 'Final conclusion based on analysis',
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false
      }
    ];
    
    // Process each thought and verify the response
    for (let i = 0; i < thoughts.length; i++) {
      const result = cascadeServer.processThought(thoughts[i]);
      
      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const data = JSON.parse(result.content[0].text) as {
        thoughtNumber: number;
        thoughtHistoryLength: number;
        branches?: string[];
        nextThoughtNeeded: boolean;
      };
      expect(data.thoughtNumber).toBe(i + 1);
      expect(data.thoughtHistoryLength).toBe(i + 1);
      
      if (i === 2) {
        // Check that branch was recorded
        expect(data.branches).toContain('alternative-1');
      }
      
      if (i === 3) {
        // Final thought
        expect(data.nextThoughtNeeded).toBe(false);
      }
    }
  });

  it('should validate input properly', async () => {
    const { validateThoughtData } = await import('./validators/thought-validator.js');
    
    // Test valid input
    expect(() => validateThoughtData({
      thought: 'Valid thought',
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false
    })).not.toThrow();
    
    // Test invalid inputs
    expect(() => validateThoughtData(null)).toThrow('Invalid thought: must be a string');
    expect(() => validateThoughtData({})).toThrow('Invalid thought: must be a string');
    expect(() => validateThoughtData({
      thought: 123,
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false
    })).toThrow('Invalid thought: must be a string');
  });

  it('should format thoughts with proper visual structure', async () => {
    const { formatThought } = await import('./formatters/thought-formatter.js');
    
    const output = formatThought({
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 3,
      nextThoughtNeeded: true
    });
    
    // Check for box drawing characters
    expect(output).toContain('┌');
    expect(output).toContain('┐');
    expect(output).toContain('│');
    expect(output).toContain('└');
    expect(output).toContain('┘');
    
    // Check for content
    expect(output).toContain('Test thought');
    expect(output).toContain('1/3');
    
    // Test revision formatting
    const revisionOutput = formatThought({
      thought: 'Revised thought',
      thoughtNumber: 2,
      totalThoughts: 3,
      nextThoughtNeeded: true,
      isRevision: true,
      revisesThought: 1
    });
    
    expect(revisionOutput).toContain('Revision');
    expect(revisionOutput).toContain('revising thought 1');
    
    // Test branch formatting
    const branchOutput = formatThought({
      thought: 'Branch thought',
      thoughtNumber: 3,
      totalThoughts: 3,
      nextThoughtNeeded: false,
      branchFromThought: 2,
      branchId: 'test-branch'
    });
    
    expect(branchOutput).toContain('Branch');
    expect(branchOutput).toContain('from thought 2');
    expect(branchOutput).toContain('test-branch');
  });

  it('should handle console logging control via environment variable', async () => {
    const { CascadeThinkingServer } = await import('./services/cascade-thinking-server.js');
    
    // Test with logging enabled (default)
    const originalEnv = process.env.DISABLE_THOUGHT_LOGGING;
    delete process.env.DISABLE_THOUGHT_LOGGING;
    
    const consoleOutput: string[] = [];
    const originalConsoleError = console.error;
    console.error = (message: string) => {
      consoleOutput.push(message);
    };
    
    try {
      const server1 = new CascadeThinkingServer();
      server1.processThought({
        thought: 'This should be logged',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      
      expect(consoleOutput).toHaveLength(1);
      expect(consoleOutput[0]).toContain('This should be logged');
      
      // Test with logging disabled
      consoleOutput.length = 0; // Clear array
      process.env.DISABLE_THOUGHT_LOGGING = 'true';
      
      const server2 = new CascadeThinkingServer();
      server2.processThought({
        thought: 'This should NOT be logged',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      
      expect(consoleOutput).toHaveLength(0);
    } finally {
      console.error = originalConsoleError;
      if (originalEnv !== undefined) {
        process.env.DISABLE_THOUGHT_LOGGING = originalEnv;
      } else {
        delete process.env.DISABLE_THOUGHT_LOGGING;
      }
    }
  });

  it('should export the cascade_thinking tool with correct schema', async () => {
    const { CASCADE_THINKING_TOOL } = await import('./tools/cascade-thinking-tool.js');
    
    expect(CASCADE_THINKING_TOOL.name).toBe('cascade_thinking');
    expect(CASCADE_THINKING_TOOL.description).toBeDefined();
    expect(CASCADE_THINKING_TOOL.description?.length).toBeGreaterThan(100); // It's a detailed description
    
    // Verify the schema
    const schema = CASCADE_THINKING_TOOL.inputSchema;
    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts']);
    
    // Verify all properties are defined
    const properties = schema.properties;
    expect(properties).toBeDefined();
    
    if (properties) {
      expect(Object.keys(properties)).toHaveLength(9);
      expect(properties.thought).toBeDefined();
      expect(properties.nextThoughtNeeded).toBeDefined();
      expect(properties.thoughtNumber).toBeDefined();
      expect(properties.totalThoughts).toBeDefined();
      expect(properties.isRevision).toBeDefined();
      expect(properties.revisesThought).toBeDefined();
      expect(properties.branchFromThought).toBeDefined();
      expect(properties.branchId).toBeDefined();
      expect(properties.needsMoreThoughts).toBeDefined();
    }
  });
});