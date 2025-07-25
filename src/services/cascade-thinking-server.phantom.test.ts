import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';

describe('CascadeThinkingServer - Phantom Thoughts Prevention', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  describe('State consistency on validation errors', () => {
    it('should not increment sequence counter on invalid thought number', () => {
      // First valid thought
      const result1 = server.processThought({
        thought: 'First thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      expect(result1.isError).toBeUndefined();
      const data1 = JSON.parse(result1.content[0].text);
      expect(data1.expectedThoughtNumber).toBe('S2');

      // Try invalid thought number (should fail)
      const result2 = server.processThought({
        thought: 'Invalid thought',
        thoughtNumber: 'S1', // Wrong! Should be S2
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      expect(result2.isError).toBe(true);
      const error2 = JSON.parse(result2.content[0].text);
      expect(error2.error).toContain('Invalid thought number: expected S2');

      // Now try with correct number - should still expect S2
      const result3 = server.processThought({
        thought: 'Second thought',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      expect(result3.isError).toBeUndefined();
      const data3 = JSON.parse(result3.content[0].text);
      expect(data3.thoughtNumber).toBe('S2');
      expect(data3.absoluteThoughtNumber).toBe('A2'); // Should be A2, not A3
      expect(data3.expectedThoughtNumber).toBe('S3');
    });

    it('should not increment absolute counter on validation errors', () => {
      // Create first thought
      server.processThought({
        thought: 'First thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      // Multiple failed attempts
      for (let i = 0; i < 3; i++) {
        const result = server.processThought({
          thought: 'Failed attempt',
          thoughtNumber: 'S1', // Wrong number
          totalThoughts: 2,
          nextThoughtNeeded: true
        });
        expect(result.isError).toBe(true);
      }

      // Valid second thought
      const result = server.processThought({
        thought: 'Second thought',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.absoluteThoughtNumber).toBe('A2'); // Should be A2, not A5
      expect(data.totalThoughtsAllTime).toBe(2); // Only 2 valid thoughts
    });

    it('should not create gaps after validation errors', () => {
      // Create initial thought
      server.processThought({
        thought: 'First thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Failed attempt
      server.processThought({
        thought: 'Failed thought',
        thoughtNumber: 'S3', // Skip S2
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Valid second thought
      const result = server.processThought({
        thought: 'Second thought',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.gapInfo).toBeUndefined(); // No phantom gap
    });

    it('should not modify history on reference resolution errors', () => {
      // Create a thought
      server.processThought({
        thought: 'First thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      // Try to revise non-existent thought
      const result = server.processThought({
        thought: 'Revising non-existent',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'A999' // Doesn't exist
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.error).toContain('does not exist');

      // Next valid thought should still be S2
      const validResult = server.processThought({
        thought: 'Valid second thought',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(validResult.content[0].text);
      expect(data.thoughtNumber).toBe('S2');
      expect(data.absoluteThoughtNumber).toBe('A2');
    });

    it('should maintain sequence metadata consistency on errors', () => {
      // Start sequence
      const result1 = server.processThought({
        thought: 'First thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        sequenceDescription: 'Test sequence'
      });

      const data1 = JSON.parse(result1.content[0].text);
      expect(data1.currentSequence.thoughtsInSequence).toBe(1);

      // Multiple failed attempts
      for (let i = 0; i < 3; i++) {
        server.processThought({
          thought: 'Failed',
          thoughtNumber: 'S1',
          totalThoughts: 3,
          nextThoughtNeeded: true
        });
      }

      // Valid second thought
      const result2 = server.processThought({
        thought: 'Second thought',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      const data2 = JSON.parse(result2.content[0].text);
      expect(data2.currentSequence.thoughtsInSequence).toBe(2); // Should be 2, not 5
    });
  });

  describe('Branch switching validation', () => {
    it('should reject combining switchToBranch with startNewSequence', () => {
      // Create initial thoughts and branch
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch start',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'S1',
        branchId: 'test-branch'
      });

      // Try to combine switchToBranch with startNewSequence
      const result = server.processThought({
        thought: 'Invalid combination',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        switchToBranch: 'main',
        startNewSequence: true
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.error).toBe('Cannot combine switchToBranch with startNewSequence. Please use one or the other.');
    });

    it('should handle branch switching errors without state corruption', () => {
      // Try to switch to non-existent branch
      const result = server.processThought({
        thought: 'Switch attempt',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        switchToBranch: 'non-existent-branch'
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.error).toContain('does not exist');

      // Should still be able to create first thought
      const validResult = server.processThought({
        thought: 'First valid thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      expect(validResult.isError).toBeUndefined();
      const data = JSON.parse(validResult.content[0].text);
      expect(data.thoughtNumber).toBe('S1');
      expect(data.absoluteThoughtNumber).toBe('A1');
    });
  });

  describe('Negative totalThoughts validation', () => {
    it('should reject negative totalThoughts', () => {
      const result = server.processThought({
        thought: 'Test thought',
        thoughtNumber: 'S1',
        totalThoughts: -5,
        nextThoughtNeeded: true
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.error).toBe('Invalid totalThoughts: must be at least 1');
    });

    it('should reject zero totalThoughts', () => {
      const result = server.processThought({
        thought: 'Test thought',
        thoughtNumber: 'S1',
        totalThoughts: 0,
        nextThoughtNeeded: true
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.error).toBe('Invalid totalThoughts: must be at least 1');
    });
  });

  describe('Case sensitivity support', () => {
    it('should accept lowercase thoughtNumber', () => {
      const result = server.processThought({
        thought: 'Test with lowercase',
        thoughtNumber: 's1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text);
      expect(data.thoughtNumber).toBe('S1');
      expect(data.absoluteThoughtNumber).toBe('A1');
    });

    it('should accept mixed case in subsequent thoughts', () => {
      // First with uppercase
      server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Second with lowercase
      const result2 = server.processThought({
        thought: 'Second',
        thoughtNumber: 's2',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      expect(result2.isError).toBeUndefined();
      const data2 = JSON.parse(result2.content[0].text);
      expect(data2.thoughtNumber).toBe('S2');

      // Third with uppercase again
      const result3 = server.processThought({
        thought: 'Third',
        thoughtNumber: 'S3',
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      expect(result3.isError).toBeUndefined();
      const data3 = JSON.parse(result3.content[0].text);
      expect(data3.thoughtNumber).toBe('S3');
    });
  });
});