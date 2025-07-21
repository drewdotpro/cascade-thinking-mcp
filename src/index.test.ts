import { describe, it, expect } from 'vitest';

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