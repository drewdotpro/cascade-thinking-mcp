import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse } from '../types/thought.js';

describe('CascadeThinkingServer - Enhanced Recent Thoughts Context', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  describe('Sequence Summary', () => {
    it('should not generate summary for sequences with 10 or fewer thoughts', () => {
      // Create 10 thoughts
      for (let i = 1; i <= 10; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 10,
          nextThoughtNeeded: i < 10
        });
      }

      const result = server.processThought({
        thought: 'Check summary',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.sequenceSummary).toBeUndefined();
    });

    it('should generate summary for sequences with more than 10 thoughts', () => {
      // Create 12 thoughts
      for (let i = 1; i <= 12; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 12,
          nextThoughtNeeded: i < 12
        });
      }

      const result = server.processThought({
        thought: 'Final thought to check summary',
        thoughtNumber: 'S13',
        totalThoughts: 13,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.sequenceSummary).toBeDefined();
      expect(data.sequenceSummary).toContain('Progress: 100%');
      expect(data.sequenceSummary).toContain('(13/13)');
    });

    it('should include revision info in summary', () => {
      // Create initial thoughts
      for (let i = 1; i <= 11; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 15,
          nextThoughtNeeded: true
        });
      }

      // Add a revision
      server.processThought({
        thought: 'Revising earlier thought',
        thoughtNumber: 'S12',
        totalThoughts: 15,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'A5'
      });

      const result = server.processThought({
        thought: 'Check summary with revision',
        thoughtNumber: 'S13',
        totalThoughts: 15,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.sequenceSummary).toContain('Key revisions: 1 thoughts revised');
    });

    it('should include branch info in summary', () => {
      // Create initial thoughts
      for (let i = 1; i <= 11; i++) {
        server.processThought({
          thought: `Main thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 15,
          nextThoughtNeeded: true
        });
      }

      // Create a branch
      server.processThought({
        thought: 'Branch thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        branchFromThought: 'A5',
        branchId: 'test-branch'
      });

      // Back to main
      const result = server.processThought({
        thought: 'Back to main',
        thoughtNumber: 'S12',
        totalThoughts: 15,
        nextThoughtNeeded: false,
        switchToBranch: 'main'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.sequenceSummary).toContain('Branches created: test-branch');
    });

    it('should include expansion info in summary', () => {
      // Create thoughts with expansion
      for (let i = 1; i <= 11; i++) {
        const needsMore = i === 10;
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: needsMore ? 15 : 10,
          nextThoughtNeeded: true,
          needsMoreThoughts: needsMore
        });
      }

      const result = server.processThought({
        thought: 'Final thought',
        thoughtNumber: 'S12',
        totalThoughts: 15,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.sequenceSummary).toContain('Expanded thinking 1 time(s)');
    });

    it('should only show summary in standard and verbose modes', () => {
      // Create 12 thoughts
      for (let i = 1; i <= 12; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 12,
          nextThoughtNeeded: i < 12
        });
      }

      // Test minimal mode
      const minimalResult = server.processThought({
        thought: 'Check minimal',
        thoughtNumber: 'S13',
        totalThoughts: 13,
        nextThoughtNeeded: false,
        responseMode: 'minimal'
      });

      const minimalData = JSON.parse(minimalResult.content[0].text) as CascadeThinkingResponse;
      expect(minimalData.sequenceSummary).toBeUndefined();

      // Test standard mode
      const standardResult = server.processThought({
        thought: 'Check standard',
        thoughtNumber: 'S14',
        totalThoughts: 14,
        nextThoughtNeeded: false,
        responseMode: 'standard'
      });

      const standardData = JSON.parse(standardResult.content[0].text) as CascadeThinkingResponse;
      expect(standardData.sequenceSummary).toBeDefined();
    });
  });

  describe('Retrieve Thoughts', () => {
    it('should retrieve last N thoughts', () => {
      // Create test thoughts in sequence 1
      for (let i = 1; i <= 15; i++) {
        server.processThought({
          thought: `Thought number ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 15,
          nextThoughtNeeded: i < 15
        });
      }

      // Start new sequence to test retrieval
      const result = server.processThought({
        thought: 'Retrieve last 3',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        retrieveThoughts: 'last:3'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts).toHaveLength(3);
      expect(data.retrievedThoughts[0].absolute).toBe('A14');
      expect(data.retrievedThoughts[1].absolute).toBe('A15');
      expect(data.retrievedThoughts[2].absolute).toBe('A16');
    });

    it('should retrieve absolute range', () => {
      // Create test thoughts first
      for (let i = 1; i <= 10; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 10,
          nextThoughtNeeded: i < 10
        });
      }

      // New sequence to test
      const result = server.processThought({
        thought: 'Retrieve range',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        retrieveThoughts: 'A5-A8'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts).toHaveLength(4);
      expect(data.retrievedThoughts[0].absolute).toBe('A5');
      expect(data.retrievedThoughts[1].absolute).toBe('A6');
      expect(data.retrievedThoughts[2].absolute).toBe('A7');
      expect(data.retrievedThoughts[3].absolute).toBe('A8');
    });

    it('should retrieve sequence range from current sequence', () => {
      // Create test thoughts in a sequence
      for (let i = 1; i <= 15; i++) {
        server.processThought({
          thought: `Seq thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 16,
          nextThoughtNeeded: true
        });
      }

      // Test retrieving from current sequence
      const result = server.processThought({
        thought: 'Retrieve sequence range',
        thoughtNumber: 'S16',
        totalThoughts: 16,
        nextThoughtNeeded: false,
        retrieveThoughts: 'S10-S12'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts).toHaveLength(3);
      expect(data.retrievedThoughts[0].content).toContain('Seq thought 10');
      expect(data.retrievedThoughts[1].content).toContain('Seq thought 11');
      expect(data.retrievedThoughts[2].content).toContain('Seq thought 12');
    });

    it('should retrieve specific thoughts', () => {
      // Create some test thoughts
      for (let i = 1; i <= 20; i++) {
        server.processThought({
          thought: `Test thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 20,
          nextThoughtNeeded: i < 20
        });
      }

      // Start new sequence and retrieve specific
      const result = server.processThought({
        thought: 'Retrieve specific',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        retrieveThoughts: 'A3,A7,A15'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts).toHaveLength(3);
      expect(data.retrievedThoughts[0].absolute).toBe('A3');
      expect(data.retrievedThoughts[1].absolute).toBe('A7');
      expect(data.retrievedThoughts[2].absolute).toBe('A15');
    });

    it('should handle non-existent thoughts gracefully', () => {
      // Create just a few thoughts
      for (let i = 1; i <= 3; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 3,
          nextThoughtNeeded: i < 3
        });
      }

      const result = server.processThought({
        thought: 'Try invalid refs',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        retrieveThoughts: 'A999,A1000'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts).toHaveLength(0);
    });

    it('should validate retrieve patterns', () => {
      const result = server.processThought({
        thought: 'Bad pattern',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        retrieveThoughts: 'invalid-pattern'
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text);
      expect(error.error).toContain('retrieveThoughts must be in format');
    });

    it('should truncate long thoughts in retrieved results', () => {
      const longThought = 'This is a very long thought that exceeds one hundred characters and will need to be truncated when retrieved to keep the response size manageable';
      
      server.processThought({
        thought: longThought,
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      const result = server.processThought({
        thought: 'Retrieve long thought',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        retrieveThoughts: 'A1'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts[0].content).toHaveLength(103);
      expect(data.retrievedThoughts[0].content.endsWith('...')).toBe(true);
    });

    it('should handle mixed case in retrieve patterns', () => {
      // Create some thoughts
      for (let i = 1; i <= 5; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 5,
          nextThoughtNeeded: i < 5
        });
      }

      const result = server.processThought({
        thought: 'Mixed case test',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        retrieveThoughts: 'a1-A3'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.retrievedThoughts).toBeDefined();
      expect(data.retrievedThoughts).toHaveLength(3);
    });
  });
});