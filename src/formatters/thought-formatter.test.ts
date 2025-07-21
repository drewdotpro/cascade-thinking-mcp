import { describe, it, expect, vi } from 'vitest';
import { formatThought } from './thought-formatter.js';
import { ThoughtData } from '../types/thought.js';

// Mock chalk to return predictable output
vi.mock('chalk', () => ({
  default: {
    yellow: vi.fn((text: string) => `[YELLOW]${text}[/YELLOW]`),
    green: vi.fn((text: string) => `[GREEN]${text}[/GREEN]`),
    blue: vi.fn((text: string) => `[BLUE]${text}[/BLUE]`),
  }
}));

describe('formatThought', () => {
  it('should format a normal thought', () => {
    const thoughtData: ThoughtData = {
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[BLUE]💭 Thought[/BLUE] 1/5');
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
      totalThoughts: 5,
      nextThoughtNeeded: true,
      isRevision: true,
      revisesThought: 1
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[YELLOW]🔄 Revision[/YELLOW] 2/5 (revising thought 1)');
    expect(result).toContain('Revising previous thought');
  });

  it('should format a branch thought', () => {
    const thoughtData: ThoughtData = {
      thought: 'Branching thought',
      thoughtNumber: 3,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      branchFromThought: 2,
      branchId: 'branch-1'
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[GREEN]🌿 Branch[/GREEN] 3/5 (from thought 2, ID: branch-1)');
    expect(result).toContain('Branching thought');
  });

  it('should handle very long thoughts', () => {
    const longThought = 'A'.repeat(100);
    const thoughtData: ThoughtData = {
      thought: longThought,
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain(longThought);
    expect(result).toContain('─'.repeat(104)); // 100 + 4 for padding
  });

  it('should handle empty thoughts', () => {
    const thoughtData: ThoughtData = {
      thought: '',
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false
    };

    const result = formatThought(thoughtData);
    
    expect(result).toContain('[BLUE]💭 Thought[/BLUE] 1/1');
    // The plain header is "💭 Thought 1/1" which is 14 characters
    // The border should be at least 18 characters (14 + 4)
    expect(result).toContain('──────────────────');
  });

  it('should handle thoughts with special characters', () => {
    const thoughtData: ThoughtData = {
      thought: 'Test\nwith\nnewlines\tand\ttabs',
      thoughtNumber: 1,
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
    expect(result).toContain('[YELLOW]🔄 Revision[/YELLOW] 5/10 (revising thought 3)');
    expect(result).not.toContain('Branch');
  });
});