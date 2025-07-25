import { describe, it, expect } from 'vitest';
import { validateThoughtData } from './thought-validator.js';

describe('validateThoughtData', () => {
  it('should validate a valid thought data object', () => {
    const input = {
      thought: 'Test thought',
      thoughtNumber: 'S1',
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    const result = validateThoughtData(input);
    
    expect(result).toEqual({
      thought: 'Test thought',
      thoughtNumber: 1, // Parsed from S1
      totalThoughts: 5,
      nextThoughtNeeded: true,
      isRevision: undefined,
      revisesThought: undefined,
      branchFromThought: undefined,
      branchId: undefined,
      branchDescription: undefined,
      needsMoreThoughts: undefined,
      verbose: undefined,
      startNewSequence: undefined,
      sequenceDescription: undefined,
      absoluteThoughtNumber: 0,
      sequenceId: ''
    });
  });

  it('should validate thought data with all optional fields', () => {
    const input = {
      thought: 'Test thought',
      thoughtNumber: 'S2',
      totalThoughts: 5,
      nextThoughtNeeded: false,
      isRevision: true,
      revisesThought: 'S1',
      branchFromThought: 'A1',
      branchId: 'branch-1',
      branchDescription: 'Test branch',
      needsMoreThoughts: true,
      responseMode: 'verbose',
      startNewSequence: true,
      sequenceDescription: 'Test sequence'
    };

    const result = validateThoughtData(input);
    
    expect(result).toEqual({
      ...input,
      thoughtNumber: 2, // Parsed from S2
      absoluteThoughtNumber: 0,
      sequenceId: ''
    });
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

    expect(() => validateThoughtData(input)).toThrow('Invalid thoughtNumber: must be a string with S prefix');
  });

  it('should throw error for invalid thoughtNumber format', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: '1', // Missing S prefix
      totalThoughts: 5,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid thoughtNumber: must match pattern');
  });

  it('should throw error for missing totalThoughts', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 'S1',
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid totalThoughts: must be a number');
  });

  it('should throw error for non-number totalThoughts', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 'S1',
      totalThoughts: '5',
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid totalThoughts: must be a number');
  });

  it('should throw error for missing nextThoughtNeeded', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 'S1',
      totalThoughts: 5
    };

    expect(() => validateThoughtData(input)).toThrow('Invalid nextThoughtNeeded: must be a boolean');
  });

  it('should throw error for non-boolean nextThoughtNeeded', () => {
    const input = {
      thought: 'Test',
      thoughtNumber: 'S1',
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

  it('should validate various thoughtNumber formats', () => {
    const baseInput = {
      thought: 'Test',
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    // Valid formats
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 'S1' })).not.toThrow();
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 'S99' })).not.toThrow();
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 'S123' })).not.toThrow();
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 's1' })).not.toThrow();
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 's99' })).not.toThrow();
    
    // Invalid formats
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 'A1' }))
      .toThrow('Invalid thoughtNumber: must match pattern S{n} or s{n}');
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 'S' }))
      .toThrow('Invalid thoughtNumber: must match pattern S{n} or s{n}');
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: '1' }))
      .toThrow('Invalid thoughtNumber: must match pattern S{n} or s{n}');
    expect(() => validateThoughtData({ ...baseInput, thoughtNumber: 'SS1' }))
      .toThrow('Invalid thoughtNumber: must match pattern S{n} or s{n}');
  });

  it('should throw error for invalid optional field types', () => {
    const baseInput = {
      thought: 'Test',
      thoughtNumber: 'S1',  
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData({ ...baseInput, revisesThought: 'invalid' }))
      .toThrow('Invalid revisesThought: must match pattern A{n} or S{n}');
    
    expect(() => validateThoughtData({ ...baseInput, branchFromThought: 'invalid' }))
      .toThrow('Invalid branchFromThought: must match pattern A{n} or S{n}');
    
    expect(() => validateThoughtData({ ...baseInput, revisesThought: 123 }))
      .toThrow('Invalid revisesThought: must be a string');
    
    expect(() => validateThoughtData({ ...baseInput, branchFromThought: 123 }))
      .toThrow('Invalid branchFromThought: must be a string');
    
    expect(() => validateThoughtData({ ...baseInput, branchId: 123 }))
      .toThrow('Invalid branchId: must be a string');
    
    expect(() => validateThoughtData({ ...baseInput, branchDescription: 123 }))
      .toThrow('Invalid branchDescription: must be a string');
    
    expect(() => validateThoughtData({ ...baseInput, sequenceDescription: 123 }))
      .toThrow('Invalid sequenceDescription: must be a string');
    
    expect(() => validateThoughtData({ ...baseInput, isRevision: 'not a boolean' }))
      .toThrow('Invalid isRevision: must be a boolean');
    
    expect(() => validateThoughtData({ ...baseInput, needsMoreThoughts: 'not a boolean' }))
      .toThrow('Invalid needsMoreThoughts: must be a boolean');
    
    expect(() => validateThoughtData({ ...baseInput, startNewSequence: 'not a boolean' }))
      .toThrow('Invalid startNewSequence: must be a boolean');
  });

  it('should validate toolSource when provided', () => {
    const baseInput = {
      thought: 'Test',
      thoughtNumber: 'S1',  
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData({ ...baseInput, toolSource: 123 }))
      .toThrow('Invalid toolSource: must be a string');
    
    const result = validateThoughtData({ ...baseInput, toolSource: 'agent' });
    expect(result.toolSource).toBe('agent');
  });

  it('should validate isolatedContext when provided', () => {
    const baseInput = {
      thought: 'Test',
      thoughtNumber: 'S1',  
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    expect(() => validateThoughtData({ ...baseInput, isolatedContext: 'not a boolean' }))
      .toThrow('Invalid isolatedContext: must be a boolean');
    
    const result = validateThoughtData({ ...baseInput, isolatedContext: true });
    expect(result.isolatedContext).toBe(true);
  });

  it('should validate switchToBranch when provided', () => {
    const baseInput = {
      thought: 'Test',
      thoughtNumber: 'S1',  
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    // Invalid type
    expect(() => validateThoughtData({ ...baseInput, switchToBranch: 123 }))
      .toThrow('Invalid switchToBranch: must be a string');
    
    // Valid string
    const result = validateThoughtData({ ...baseInput, switchToBranch: 'main' });
    expect(result.switchToBranch).toBe('main');
  });

  it('should validate recentThoughtsLimit when provided', () => {
    const baseInput = {
      thought: 'Test',
      thoughtNumber: 'S1',  
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    // Invalid type - string
    expect(() => validateThoughtData({ ...baseInput, recentThoughtsLimit: '5' }))
      .toThrow('recentThoughtsLimit must be an integer');

    // Invalid type - float
    expect(() => validateThoughtData({ ...baseInput, recentThoughtsLimit: 3.14 }))
      .toThrow('recentThoughtsLimit must be an integer');
    
    // Negative value
    expect(() => validateThoughtData({ ...baseInput, recentThoughtsLimit: -1 }))
      .toThrow('recentThoughtsLimit must be non-negative');
    
    // Too large
    expect(() => validateThoughtData({ ...baseInput, recentThoughtsLimit: 101 }))
      .toThrow('recentThoughtsLimit must not exceed 100');
    
    // Valid values
    expect(validateThoughtData({ ...baseInput, recentThoughtsLimit: 0 }).recentThoughtsLimit).toBe(0);
    expect(validateThoughtData({ ...baseInput, recentThoughtsLimit: 5 }).recentThoughtsLimit).toBe(5);
    expect(validateThoughtData({ ...baseInput, recentThoughtsLimit: 100 }).recentThoughtsLimit).toBe(100);
    
    // Undefined is ok
    expect(validateThoughtData(baseInput).recentThoughtsLimit).toBeUndefined();
  });

  it('should validate responseMode when provided', () => {
    const baseInput = {
      thought: 'Test',
      thoughtNumber: 'S1',  
      totalThoughts: 1,
      nextThoughtNeeded: true
    };

    // Invalid type
    expect(() => validateThoughtData({ ...baseInput, responseMode: 123 }))
      .toThrow('responseMode must be a string');
    
    // Invalid value
    expect(() => validateThoughtData({ ...baseInput, responseMode: 'invalid' }))
      .toThrow('responseMode must be one of: minimal, standard, verbose');
    
    // Valid values
    expect(validateThoughtData({ ...baseInput, responseMode: 'minimal' }).responseMode).toBe('minimal');
    expect(validateThoughtData({ ...baseInput, responseMode: 'standard' }).responseMode).toBe('standard');
    expect(validateThoughtData({ ...baseInput, responseMode: 'verbose' }).responseMode).toBe('verbose');
    
    // Undefined is ok
    expect(validateThoughtData(baseInput).responseMode).toBeUndefined();
  });
});