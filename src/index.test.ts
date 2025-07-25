import { describe, it, expect, vi } from 'vitest';

// Mock the server module before importing index to prevent actual server startup
vi.mock('./server/setup.js', () => ({
  runServer: vi.fn().mockResolvedValue(undefined),
  createServer: vi.fn()
}));

describe('index.ts exports', () => {
  it('should export all necessary functions and classes', async () => {
    const exports = await import('./index.js');
    
    // Just verify the exports exist - TypeScript already ensures this at compile time
    expect(exports.createServer).toBeDefined();
    expect(exports.runServer).toBeDefined();
    expect(exports.CascadeThinkingServer).toBeDefined();
    expect(exports.CASCADE_THINKING_TOOL).toBeDefined();
    expect(exports.validateThoughtData).toBeDefined();
    expect(exports.formatThought).toBeDefined();
  });
});