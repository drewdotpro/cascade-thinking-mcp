import { describe, it, expect } from 'vitest';
import { CASCADE_THINKING_TOOL } from './cascade-thinking-tool.js';
import { CASCADE_THINKING_TOOL_DESCRIPTION } from './tool-description.js';

describe('CASCADE_THINKING_TOOL', () => {
  it('should have correct name', () => {
    expect(CASCADE_THINKING_TOOL.name).toBe('cascade_thinking');
  });

  it('should use the description from tool-description', () => {
    expect(CASCADE_THINKING_TOOL.description).toBe(CASCADE_THINKING_TOOL_DESCRIPTION);
  });

  it('should have correct input schema', () => {
    const schema = CASCADE_THINKING_TOOL.inputSchema;
    
    expect(schema.type).toBe('object');
    expect(schema.required).toEqual(['thought', 'nextThoughtNeeded', 'totalThoughts']);
  });

  it('should define all expected properties', () => {
    const { properties } = CASCADE_THINKING_TOOL.inputSchema;
    
    if (!properties) {
      throw new Error('Properties should be defined');
    }
    
    // Required properties
    expect(properties.thought).toEqual({
      type: 'string',
      description: 'Your current thinking step'
    });
    
    expect(properties.nextThoughtNeeded).toEqual({
      type: 'boolean',
      description: 'Whether another thought step is needed'
    });
    
    expect(properties.thoughtNumber).toEqual({
      type: 'string',
      description: 'Current thought number with S prefix (e.g., \'S1\', \'S2\', \'S3\'). Optional when switchToBranch is provided - will be auto-calculated.',
      pattern: '^S\\d+$'
    });
    
    expect(properties.totalThoughts).toEqual({
      type: 'integer',
      description: 'Estimated total thoughts needed',
      minimum: 1
    });
    
    // Optional properties
    expect(properties.isRevision).toEqual({
      type: 'boolean',
      description: 'Whether this revises previous thinking'
    });
    
    expect(properties.revisesThought).toEqual({
      type: 'string',
      description: "Reference to revise: A{n} for absolute, S{n} for sequence-relative (e.g., 'A47', 'S3')",
      pattern: '^[AaSs]\\d+$'
    });
    
    expect(properties.branchFromThought).toEqual({
      type: 'string',
      description: "Reference to branch from: A{n} for absolute, S{n} for sequence-relative (e.g., 'A23', 'S5')",
      pattern: '^[AaSs]\\d+$'
    });
    
    expect(properties.branchId).toEqual({
      type: 'string',
      description: 'Branch identifier'
    });
    
    expect(properties.needsMoreThoughts).toEqual({
      type: 'boolean',
      description: 'If more thoughts are needed'
    });
    
    expect(properties.startNewSequence).toEqual({
      type: 'boolean',
      description: 'Explicitly start a new thinking sequence'
    });
    
    expect(properties.sequenceDescription).toEqual({
      type: 'string',
      description: 'Description of what this sequence will explore'
    });
    
    expect(properties.branchDescription).toEqual({
      type: 'string',
      description: 'Description of this branch\'s purpose'
    });
    
    expect(properties.toolSource).toEqual({
      type: 'string',
      description: 'Identifies which tool is using cascade_thinking (e.g., \'user\', \'agent\', \'task\')'
    });
    
    expect(properties.isolatedContext).toEqual({
      type: 'boolean',
      description: 'Use isolated state for this tool instead of shared global state'
    });
    
    expect(properties.switchToBranch).toEqual({
      type: 'string',
      description: 'Resume work on a specific branch by its ID'
    });
    
    expect(properties.recentThoughtsLimit).toEqual({
      type: 'integer',
      description: 'How many recent thoughts to include in response (default: 5, max: 100)',
      minimum: 0,
      maximum: 100
    });
    
    expect(properties.responseMode).toEqual({
      type: 'string',
      description: 'Control response verbosity: minimal (essentials only), standard (default, balanced), verbose (full details)',
      enum: ['minimal', 'standard', 'verbose']
    });
  });

  it('should have exactly 18 properties defined', () => {
    const { properties } = CASCADE_THINKING_TOOL.inputSchema;
    
    if (!properties) {
      throw new Error('Properties should be defined');
    }
    
    expect(Object.keys(properties)).toHaveLength(18);
  });
});