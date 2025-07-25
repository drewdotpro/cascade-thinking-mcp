import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';

describe('CascadeThinkingServer - Sequence Numbering Reset', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  it('should reset thought numbering to S1 when starting a new sequence', () => {
    // First thought in initial sequence
    const result1 = server.processThought({
      thought: 'First thought in sequence 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });
    
    expect(result1.isError).toBeUndefined();
    const data1 = JSON.parse(result1.content[0].text);
    expect(data1.thoughtNumber).toBe('S1');
    expect(data1.expectedThoughtNumber).toBe('S2');

    // Second thought in initial sequence
    const result2 = server.processThought({
      thought: 'Second thought in sequence 1',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });
    
    const data2 = JSON.parse(result2.content[0].text);
    expect(data2.thoughtNumber).toBe('S2');
    expect(data2.expectedThoughtNumber).toBe('S3');

    // Start new sequence - should reset to S1
    const result3 = server.processThought({
      thought: 'First thought in new sequence',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      startNewSequence: true,
      sequenceDescription: 'Exploring a different approach'
    });
    
    const data3 = JSON.parse(result3.content[0].text);
    expect(data3.thoughtNumber).toBe('S1');
    expect(data3.currentSequence.thoughtsInSequence).toBe(1);
    expect(data3.expectedThoughtNumber).toBe('S2');
    expect(data3.totalSequences).toBe(2);
  });

  it('should reject incorrect thought numbers from users', () => {
    // First thought
    server.processThought({
      thought: 'First thought',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Try to provide wrong thought number
    const result = server.processThought({
      thought: 'This should fail',
      thoughtNumber: 'S7',  // Wrong! Should be S2
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text);
    expect(error.error).toContain('Invalid thought number: expected S2 for current sequence, but got S7');
  });

  it('should auto-correct thought numbers for tools/agents', () => {
    // First thought from user
    server.processThought({
      thought: 'User thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Agent provides wrong number but should be auto-corrected
    const result = server.processThought({
      thought: 'Agent thought with wrong number',
      thoughtNumber: 'S99',  // Wrong, but will be corrected to S2
      totalThoughts: 3,
      nextThoughtNeeded: true,
      toolSource: 'agent'
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.thoughtNumber).toBe('S2');  // Auto-corrected
    expect(data.toolSource).toBe('agent');
  });

  it('should maintain separate counters for each sequence', () => {
    // First sequence
    server.processThought({
      thought: 'Seq1 thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Seq1 thought 2',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Start new sequence
    server.processThought({
      thought: 'Seq2 thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      startNewSequence: true
    });

    server.processThought({
      thought: 'Seq2 thought 2',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Start third sequence
    const result = server.processThought({
      thought: 'Seq3 thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      startNewSequence: true
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.thoughtNumber).toBe('S1');
    expect(data.totalSequences).toBe(3);
    expect(data.totalThoughtsAllTime).toBe(5);
  });

  it('should handle isolated contexts with separate counters', () => {
    // Main context
    server.processThought({
      thought: 'Main thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Isolated agent context
    const result1 = server.processThought({
      thought: 'Isolated agent thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      toolSource: 'agent:1',
      isolatedContext: true
    });

    expect(result1.isError).toBeUndefined();
    const data1 = JSON.parse(result1.content[0].text);
    expect(data1.thoughtNumber).toBe('S1');
    expect(data1.totalThoughtsAllTime).toBe(1); // Isolated, so only 1 thought

    // Continue in main context
    const result2 = server.processThought({
      thought: 'Main thought 2',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false
    });

    const data2 = JSON.parse(result2.content[0].text);
    expect(data2.thoughtNumber).toBe('S2');
    expect(data2.totalThoughtsAllTime).toBe(2); // Main context has 2 thoughts
  });

  it('should not include expectedThoughtNumber when nextThoughtNeeded is false', () => {
    const result = server.processThought({
      thought: 'Final thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.expectedThoughtNumber).toBeUndefined();
  });
});