import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse } from '../types/thought.js';

describe('CascadeThinkingServer - needsMoreThoughts Functionality', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  it('should expand totalThoughts when needsMoreThoughts is true', () => {
    // Create initial thoughts
    server.processThought({
      thought: 'First thought',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Second thought',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Use needsMoreThoughts when approaching the end
    const result = server.processThought({
      thought: 'Third thought - realizing I need more',
      thoughtNumber: 'S3',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should expand totalThoughts
    expect(data.totalThoughts).toBeGreaterThan(3);
    expect(data.totalThoughts).toBe(6); // S3 + max(3, ceil(3 * 0.5)) = 3 + 3 = 6
    expect(data.needsMoreThoughts).toBe(true);
    expect(data.adjustedTotalThoughts).toBe(6);
  });

  it('should use 50% increase or minimum 3 thoughts', () => {
    // Test with small totalThoughts
    server.processThought({
      thought: 'Start',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    });

    let result = server.processThought({
      thought: 'Continue',
      thoughtNumber: 'S2',
      totalThoughts: 4, // Should have been adjusted to 4 (1 + 3)
      nextThoughtNeeded: false
    });

    let data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.totalThoughts).toBe(4);

    // Test with larger totalThoughts
    server.processThought({
      thought: 'New sequence',
      thoughtNumber: 'S1',
      totalThoughts: 10,
      nextThoughtNeeded: true,
      startNewSequence: true
    });

    for (let i = 2; i <= 9; i++) {
      server.processThought({
        thought: `Thought ${i}`,
        thoughtNumber: `S${i}`,
        totalThoughts: 10,
        nextThoughtNeeded: true
      });
    }

    result = server.processThought({
      thought: 'Need more at S10',
      thoughtNumber: 'S10',
      totalThoughts: 10,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    });

    data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    // S10 + max(3, ceil(10 * 0.5)) = 10 + 5 = 15
    expect(data.totalThoughts).toBe(15);
    expect(data.adjustedTotalThoughts).toBe(15);
  });

  it('should show needsMoreThoughts indicator in hint', () => {
    const result = server.processThought({
      thought: 'Starting with needsMoreThoughts',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.hint).toContain('[Total thoughts expanded]');
  });

  it('should not include needsMoreThoughts info when false', () => {
    const result = server.processThought({
      thought: 'Regular thought',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.needsMoreThoughts).toBeUndefined();
    expect(data.adjustedTotalThoughts).toBeUndefined();
    expect(data.hint).not.toContain('[Total thoughts expanded]');
  });

  it('should work with branches', () => {
    // Create main thought
    server.processThought({
      thought: 'Main analysis',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Branch with needsMoreThoughts
    const result = server.processThought({
      thought: 'Branching and need more thoughts',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'complex-branch',
      needsMoreThoughts: true
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.totalThoughts).toBe(4); // S1 + 3 = 4
    expect(data.needsMoreThoughts).toBe(true);
    expect(data.currentBranch).toBe('complex-branch');
  });

  it('should work with isolated contexts', () => {
    const result = server.processThought({
      thought: 'Isolated thought with needsMore',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      needsMoreThoughts: true,
      toolSource: 'agent',
      isolatedContext: true
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.totalThoughts).toBe(4); // S1 + 3 = 4
    expect(data.needsMoreThoughts).toBe(true);
    expect(data.adjustedTotalThoughts).toBe(4);
  });

  it('should handle needsMoreThoughts multiple times in same sequence', () => {
    // First expansion
    server.processThought({
      thought: 'Start',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    });

    // Continue with expanded total
    server.processThought({
      thought: 'Continue',
      thoughtNumber: 'S2',
      totalThoughts: 4,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'More',
      thoughtNumber: 'S3',
      totalThoughts: 4,
      nextThoughtNeeded: true
    });

    // Second expansion
    const result = server.processThought({
      thought: 'Need even more',
      thoughtNumber: 'S4',
      totalThoughts: 4,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    // S4 + max(3, ceil(4 * 0.5)) = 4 + 3 = 7
    expect(data.totalThoughts).toBe(7);
    expect(data.needsMoreThoughts).toBe(true);
    expect(data.adjustedTotalThoughts).toBe(7);
  });
});