import { describe, it, expect } from 'vitest';
import { validateThoughtData } from './thought-validator.js';

describe('validateThoughtData', () => {
  it('should validate a valid thought data object', () => {
    const input = {
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    const result = validateThoughtData(input);
    
    expect(result).toEqual({
      thought: 'Test thought',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true,
      isRevision: undefined,
      revisesThought: undefined,
      branchFromThought: undefined,
      branchId: undefined,
      needsMoreThoughts: undefined
    });
  });

  it('should validate thought data with all optional fields', () => {
    const input = {
      thought: 'Test thought',
      thoughtNumber: 2,
      totalThoughts: 5,
      nextThoughtNeeded: false,
      isRevision: true,
      revisesThought: 1,
      branchFromThought: 1,
      branchId: 'branch-1',
      needsMoreThoughts: true
    };

    const result = validateThoughtData(input);
    
    expect(result).toEqual(input);
  });

  it('should throw error for missing thought', () => {
    const input = {
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid thought: must be a string');
  });

  it('should throw error for non-string thought', () => {
    const input = {
      thought: 123,
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid thought: must be a string');
  });

  it('should throw error for empty string thought', () => {
    const input = {
      thought: '',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid thought: must be a string');
  });

  it('should throw error for missing thoughtNumber', () => {
    const input = {
      thought: 'Test',
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid thoughtNumber: must be a number');
  });

  it('should throw error for non-number thoughtNumber', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: '1',
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid thoughtNumber: must be a number');
  });

  it('should throw error for missing totalThoughts', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 1,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid totalThoughts: must be a number');
  });

  it('should throw error for non-number totalThoughts', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 1,
      totalThoughts: '5',
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid totalThoughts: must be a number');
  });

  it('should throw error for missing nextThoughtNeeded', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 1,
      totalThoughts: 5
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid nextThoughtNeeded: must be a boolean');
  });

  it('should throw error for non-boolean nextThoughtNeeded', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 1,
      totalThoughts: 5,
      nextThoughtNeeded: 'true'
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid nextThoughtNeeded: must be a boolean');
  });

  it('should handle null or undefined input', () => {
    expect(() => validateThoughtData(null)).toThrow('Invalid thought: must be a string');
    expect(() => validateThoughtData(undefined)).toThrow('Invalid thought: must be a string');
  });

  it('should handle non-object input', () => {
    expect(() => validateThoughtData('string')).toThrow('Invalid thought: must be a string');
    expect(() => validateThoughtData(123)).toThrow('Invalid thought: must be a string');
    expect(() => validateThoughtData([])).toThrow('Invalid thought: must be a string');
  });
});