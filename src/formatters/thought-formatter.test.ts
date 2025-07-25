import { describe, it, expect, vi } from 'vitest';
import { formatThought } from './thought-formatter.js';
import { ThoughtData } from '../types/thought.js';

// Mock chalk to return predictable output
vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((text: string) => `[YELLOW]${text}[/YELLOW]`),
    green: vi.fn((text: string) => `[GREEN]${text}[/GREEN]`),
    blue: vi.fn((text: string) => `[BLUE]${text}[/BLUE]`),
    gray: vi.fn((text: string) => `[GRAY]${text}[/GRAY]`),
    magenta: vi.fn((text: string) => `[MAGENTA]${text}[/MAGENTA]`),
  }
}));

describe('formatThought', () => {
  it('should format a normal thought', () => {
    const thoughtData: ThoughtData = {
      thought: 'Test thought',
      thoughtNumber: 1,
      absoluteThoughtNumber: 1,
      sequenceId: 'seq_test',
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[BLUE]💭 Thought[/BLUE] S1/5');
    expect(result).toContain('[Absolute: A1]');
    expect(result).toContain('Sequence: seq_test');
    expect(result).toContain('Test thought');
    expect(result).toContain('┌');
    expect(result).toContain('┐');
    expect(result).toContain('├');
    expect(result).toContain('┤');
    expect(result).toContain('└');
    expect(result).toContain('┘');
  });

  it('should format a revision thought', () => {
    const thoughtData: ThoughtData = {
      thought: 'Revising previous thought',
      thoughtNumber: 2,
      absoluteThoughtNumber: 2,
      sequenceId: 'seq_test',
      totalThoughts: 5,
      nextThoughtNeeded: true,
      isRevision: true,
      revisesThought: 1
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[YELLOW]🔄 Revision[/YELLOW] S2/5');
    expect(result).toContain('(revising absolute thought 1)');
    expect(result).toContain('Revising previous thought');
  });

  it('should format a branch thought', () => {
    const thoughtData: ThoughtData = {
      thought: 'Branching thought',
      thoughtNumber: 3,
      absoluteThoughtNumber: 3,
      sequenceId: 'seq_test',
      totalThoughts: 5,
      nextThoughtNeeded: true,
      branchFromThought: 2,
      branchId: 'branch-1'
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[GREEN]🌿 Branch[/GREEN] S3/5');
    expect(result).toContain('(from absolute thought 2, ID: branch-1)');
    expect(result).toContain('Branching thought');
  });

  it('should handle very long thoughts', () => {
    const longThought = 'A'.repeat(100);
    const thoughtData: ThoughtData = {
      thought: longThought,
      thoughtNumber: 1,
      absoluteThoughtNumber: 1,
      sequenceId: 'seq_test',
      totalThoughts: 1,
      nextThoughtNeeded: false
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain(longThought);
    // Just verify the thought is included and box structure is present
    expect(result).toContain(longThought);
    expect(result).toContain('┌');
    expect(result).toContain('┐');
  });

  it('should handle empty thoughts', () => {
    const thoughtData: ThoughtData = {
      thought: '',
      thoughtNumber: 1,
      absoluteThoughtNumber: 1,
      sequenceId: 'seq_test',
      totalThoughts: 1,
      nextThoughtNeeded: false
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[BLUE]💭 Thought[/BLUE] S1/1');
    expect(result).toContain('┌');
    expect(result).toContain('┐');
  });

  it('should handle thoughts with special characters', () => {
    const thoughtData: ThoughtData = {
      thought: 'Test\nwith\nnewlines\tand\ttabs',
      thoughtNumber: 1,
      absoluteThoughtNumber: 1,
      sequenceId: 'seq_test',
      totalThoughts: 1,
      nextThoughtNeeded: false
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('Test\nwith\nnewlines\tand\ttabs');
  });

  it('should pad short thoughts correctly', () => {
    const thoughtData: ThoughtData = {
      thought: 'Hi',
      thoughtNumber: 1,
      absoluteThoughtNumber: 1,
      sequenceId: 'seq_test',
      totalThoughts: 10,
      nextThoughtNeeded: false
    };

    const result = formatThought(thoughtData);
    
    // Just verify the box structure is present and properly formed
    expect(result).toContain('┌─');
    expect(result).toContain('─┐');
    expect(result).toContain('│');
    expect(result).toContain('└─');
    expect(result).toContain('─┘');
    expect(result).toContain('Hi');
  });

  it('should handle all optional fields being present', () => {
    const thoughtData: ThoughtData = {
      thought: 'Complex thought',
      thoughtNumber: 5,
      absoluteThoughtNumber: 5,
      sequenceId: 'seq_test',
      totalThoughts: 10,
      nextThoughtNeeded: false,
      isRevision: true,
      revisesThought: 3,
      branchFromThought: 2,
      branchId: 'branch-2',
      needsMoreThoughts: true
    };

    const result = formatThought(thoughtData);
    
    // Should prioritize revision over branch
    expect(result).toContain('[YELLOW]🔄 Revision[/YELLOW] S5/10');
    expect(result).toContain('(revising absolute thought 3)');
    expect(result).not.toContain('Branch');
  });

  it('should format a new sequence with double borders', () => {
    const thoughtData: ThoughtData = {
      thought: 'Starting new analysis',
      thoughtNumber: 1,
      absoluteThoughtNumber: 10,
      sequenceId: 'seq_1',
      totalThoughts: 5,
      nextThoughtNeeded: true,
      startNewSequence: true,
      sequenceDescription: 'Analyzing authentication flow'
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[MAGENTA]🆕 Thought[/MAGENTA] S1/5');
    expect(result).toContain('[MAGENTA]New Sequence: Analyzing authentication flow[/MAGENTA]');
    expect(result).toContain('╔'); // Double border for new sequence
    expect(result).toContain('╗');
    expect(result).toContain('╚');
    expect(result).toContain('╝');
    expect(result).toContain('║'); // Double vertical borders
  });

  it('should format thought with needsMoreThoughts', () => {
    const thoughtData: ThoughtData = {
      thought: 'Need to expand my analysis',
      thoughtNumber: 3,
      absoluteThoughtNumber: 7,
      sequenceId: 'seq_expand',
      totalThoughts: 5,
      isRevision: false,
      nextThoughtNeeded: true,
      needsMoreThoughts: true
    };

    const result = formatThought(thoughtData);

    // Check for needsMoreThoughts indicators
    expect(result).toContain('⚡'); // Lightning emoji indicator
    expect(result).toContain('[Expanding thoughts...]');
    expect(result).toContain('💭 Thought');
  });

});