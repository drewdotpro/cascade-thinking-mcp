import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse } from '../types/thought.js';

describe('CascadeThinkingServer - Limited Recent Thoughts Context', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  it('should use default limit of 5 when not specified', () => {
    // Create 5 thoughts
    for (let i = 1; i <= 5; i++) {
      server.processThought({
        thought: `Thought ${i}`,
        thoughtNumber: `S${i}`,
        totalThoughts: 5,
        nextThoughtNeeded: i < 5
      });
    }

    const result = server.processThought({
      thought: 'Final thought',
      thoughtNumber: 'S6',
      totalThoughts: 6,
      nextThoughtNeeded: false
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should show last 5 thoughts by default
    expect(data.recentThoughts).toHaveLength(5);
    expect(data.recentThoughts[0].absolute).toBe('A2');
    expect(data.recentThoughts[1].absolute).toBe('A3');
    expect(data.recentThoughts[2].absolute).toBe('A4');
    expect(data.recentThoughts[3].absolute).toBe('A5');
    expect(data.recentThoughts[4].absolute).toBe('A6');
    expect(data.recentThoughtsLimit).toBeUndefined(); // Default not included
  });

  it('should respect custom recentThoughtsLimit', () => {
    // Create 10 thoughts
    for (let i = 1; i <= 10; i++) {
      server.processThought({
        thought: `Thought ${i}`,
        thoughtNumber: `S${i}`,
        totalThoughts: 10,
        nextThoughtNeeded: true
      });
    }

    const result = server.processThought({
      thought: 'Check with limit',
      thoughtNumber: 'S11',
      totalThoughts: 11,
      nextThoughtNeeded: false,
      recentThoughtsLimit: 7
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should show last 7 thoughts
    expect(data.recentThoughts).toHaveLength(7);
    expect(data.recentThoughts[0].absolute).toBe('A5');
    expect(data.recentThoughts[1].absolute).toBe('A6');
    expect(data.recentThoughts[2].absolute).toBe('A7');
    expect(data.recentThoughts[3].absolute).toBe('A8');
    expect(data.recentThoughts[4].absolute).toBe('A9');
    expect(data.recentThoughts[5].absolute).toBe('A10');
    expect(data.recentThoughts[6].absolute).toBe('A11');
    expect(data.recentThoughtsLimit).toBe(7);
  });

  it('should handle limit of 0', () => {
    server.processThought({
      thought: 'First thought',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    const result = server.processThought({
      thought: 'Second thought',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false,
      recentThoughtsLimit: 0
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should show no recent thoughts
    expect(data.recentThoughts).toHaveLength(0);
    expect(data.recentThoughtsLimit).toBe(0);
  });

  it('should handle limit larger than available thoughts', () => {
    server.processThought({
      thought: 'Only thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      recentThoughtsLimit: 10
    });

    const result = server.processThought({
      thought: 'Second thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      startNewSequence: true,
      recentThoughtsLimit: 10
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should show all available thoughts (2)
    expect(data.recentThoughts).toHaveLength(2);
    expect(data.recentThoughts[0].absolute).toBe('A1');
    expect(data.recentThoughts[1].absolute).toBe('A2');
    expect(data.recentThoughtsLimit).toBe(10);
  });

  it('should validate recentThoughtsLimit is non-negative', () => {
    const result = server.processThought({
      thought: 'Test',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      recentThoughtsLimit: -1
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text);
    expect(error.error).toBe('recentThoughtsLimit must be non-negative');
  });

  it('should validate recentThoughtsLimit is integer', () => {
    const result = server.processThought({
      thought: 'Test',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      recentThoughtsLimit: 3.14
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text);
    expect(error.error).toBe('recentThoughtsLimit must be an integer');
  });

  it('should validate recentThoughtsLimit does not exceed 100', () => {
    const result = server.processThought({
      thought: 'Test',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      recentThoughtsLimit: 101
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text);
    expect(error.error).toBe('recentThoughtsLimit must not exceed 100');
  });

  it('should work with branches and custom limit', () => {
    // Create main thoughts
    for (let i = 1; i <= 3; i++) {
      server.processThought({
        thought: `Main ${i}`,
        thoughtNumber: `S${i}`,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
    }

    // Branch with custom limit
    const result = server.processThought({
      thought: 'Branch with custom limit',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A2',
      branchId: 'test-branch',
      recentThoughtsLimit: 2
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should show last 2 thoughts
    expect(data.recentThoughts).toHaveLength(2);
    expect(data.recentThoughts[0].absolute).toBe('A3');
    expect(data.recentThoughts[1].absolute).toBe('A4');
    expect(data.recentThoughtsLimit).toBe(2);
  });

  it('should work with isolated contexts', () => {
    // Create main thought
    server.processThought({
      thought: 'Main thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false
    });

    // Isolated context with custom limit
    const result = server.processThought({
      thought: 'Isolated thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      toolSource: 'agent',
      isolatedContext: true,
      recentThoughtsLimit: 1
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should show only the isolated thought
    expect(data.recentThoughts).toHaveLength(1);
    expect(data.recentThoughts[0].content).toContain('Isolated thought');
    expect(data.recentThoughtsLimit).toBe(1);
  });

  it('should not include recentThoughtsLimit when using default', () => {
    const result = server.processThought({
      thought: 'Test',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      recentThoughtsLimit: 5  // Default value
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Should not include the field when using default
    expect(data.recentThoughtsLimit).toBeUndefined();
  });
});