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
    expect(schema.required).toEqual(['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts']);
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
      type: 'integer',
      description: 'Current thought number',
      minimum: 1
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
      type: 'integer',
      description: 'Which thought is being reconsidered',
      minimum: 1
    });
    
    expect(properties.branchFromThought).toEqual({
      type: 'integer',
      description: 'Branching point thought number',
      minimum: 1
    });
    
    expect(properties.branchId).toEqual({
      type: 'string',
      description: 'Branch identifier'
    });
    
    expect(properties.needsMoreThoughts).toEqual({
      type: 'boolean',
      description: 'If more thoughts are needed'
    });
  });

  it('should have exactly 9 properties defined', () => {
    const { properties } = CASCADE_THINKING_TOOL.inputSchema;
    
    if (!properties) {
      throw new Error('Properties should be defined');
    }
    
    expect(Object.keys(properties)).toHaveLength(9);
  });
});