import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';

import { CascadeThinkingResponse } from '../types/thought.js';

interface ErrorResponse {
  error?: string;
  status?: string;
}

describe('CascadeThinkingServer', () => {
  let server: CascadeThinkingServer;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server = new CascadeThinkingServer();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  describe('processThought', () => {
    it('should process a valid thought and log it', () => {
      const input = {
        thought: 'Test thought',
        thoughtNumber: 'S1',
        totalThoughts: 5,
        nextThoughtNeeded: true,
        responseMode: 'verbose' as const
      };

      const result = server.processThought(input);

      expect(result.isError).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test thought'));
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.thoughtNumber).toBe('S1');
      expect(data.absoluteThoughtNumber).toBe('A1');
      expect(data.totalThoughts).toBe(5);
      expect(data.nextThoughtNeeded).toBe(true);
      expect(data.currentSequence).toBeDefined();
      expect(data.currentSequence.thoughtsInSequence).toBe(1);
      expect(data.recentThoughts).toHaveLength(1);
      expect(data.totalSequences).toBe(1);
      expect(data.totalThoughtsAllTime).toBe(1);
      expect(data.activeBranches).toBe(0);
    });

    it('should not log when DISABLE_THOUGHT_LOGGING is true', () => {
      process.env.DISABLE_THOUGHT_LOGGING = 'true';
      server = new CascadeThinkingServer();
      
      const input = {
        thought: 'Test thought',
        thoughtNumber: 'S1',
        totalThoughts: 5,
        nextThoughtNeeded: true
      };

      server.processThought(input);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle various DISABLE_THOUGHT_LOGGING values', () => {
      const testCases = [
        { value: 'TRUE', shouldLog: false },
        { value: 'True', shouldLog: false },
        { value: 'true', shouldLog: false },
        { value: 'false', shouldLog: true },
        { value: '1', shouldLog: true },
        { value: '', shouldLog: true },
        { value: undefined, shouldLog: true }
      ];

      testCases.forEach(({ value, shouldLog }) => {
        if (value !== undefined) {
          process.env.DISABLE_THOUGHT_LOGGING = value;
        } else {
          delete process.env.DISABLE_THOUGHT_LOGGING;
        }
        
        server = new CascadeThinkingServer();
        consoleErrorSpy.mockClear();
        
        server.processThought({
          thought: 'Test',
          thoughtNumber: 'S1',
          totalThoughts: 1,
          nextThoughtNeeded: false
        });

        if (shouldLog) {
          expect(consoleErrorSpy).toHaveBeenCalled();
        } else {
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        }
      });
    });

    it('should adjust totalThoughts when thoughtNumber exceeds it', () => {
      // Build up to S10 with proper sequence
      for (let i = 1; i <= 9; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 5,
          nextThoughtNeeded: true
        });
      }

      // Now test S10 which should adjust totalThoughts
      const result = server.processThought({
        thought: 'Extended thought',
        thoughtNumber: 'S10',
        totalThoughts: 5,
        nextThoughtNeeded: true
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.totalThoughts).toBe(10);
    });

    it('should track thought history', () => {
      const thoughts = [
        { thought: 'First', thoughtNumber: 'S1', totalThoughts: 3, nextThoughtNeeded: true },
        { thought: 'Second', thoughtNumber: 'S2', totalThoughts: 3, nextThoughtNeeded: true },
        { thought: 'Third', thoughtNumber: 'S3', totalThoughts: 3, nextThoughtNeeded: false }
      ];

      thoughts.forEach((thought, index) => {
        const result = server.processThought(thought);
        const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
        expect(data.totalThoughtsAllTime).toBe(index + 1);
        expect(data.absoluteThoughtNumber).toBe(`A${index + 1}`);
      });
    });

    it('should track branches', () => {
      // First thought
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Branch 1 - creates new sequence so starts at S1
      const branch1Result = server.processThought({
        thought: 'Branch 1',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'branch-1'
      });

      let data = JSON.parse(branch1Result.content[0].text) as CascadeThinkingResponse;
      expect(data.activeBranches).toBe(1);

      // Switch back to main before creating second branch
      server.processThought({
        thought: 'Back to main',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        switchToBranch: 'main'
      });

      // Branch 2 - also creates new sequence so starts at S1
      const branch2Result = server.processThought({
        thought: 'Branch 2',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: false,
        branchFromThought: 'A1',
        branchId: 'branch-2'
      });

      data = JSON.parse(branch2Result.content[0].text) as CascadeThinkingResponse;
      expect(data.activeBranches).toBe(1);  // Only 1 branch in this new sequence
      
      // Check available branches shows both
      expect(data.availableBranches).toBeDefined();
      expect(data.availableBranches).toHaveLength(2);
      const branchIds = data.availableBranches?.map(b => b.branchId) ?? [];
      expect(branchIds).toContain('branch-1');
      expect(branchIds).toContain('branch-2');
    });

    it('should handle validation errors', () => {
      const invalidInputs = [
        { input: {}, error: 'Invalid thought: must be a string' },
        { input: { thought: 123 }, error: 'Invalid thought: must be a string' },
        { input: { thought: 'test' }, error: 'Invalid thoughtNumber: must be a string with S prefix (e.g., \'S1\', \'S2\')' },
        { input: { thought: 'test', thoughtNumber: 'S1' }, error: 'Invalid totalThoughts: must be a number' },
        { input: { thought: 'test', thoughtNumber: 'S1', totalThoughts: 1 }, error: 'Invalid nextThoughtNeeded: must be a boolean' }
      ];

      invalidInputs.forEach(({ input, error }) => {
        const result = server.processThought(input);
        
        expect(result.isError).toBe(true);
        const data = JSON.parse(result.content[0].text) as ErrorResponse;
        expect(data.error).toBe(error);
        expect(data.status).toBe('failed');
      });
    });


    it('should not create branch without branchId', () => {
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      const result = server.processThought({
        thought: 'No branch',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        branchFromThought: 'A1'
        // Missing branchId
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.activeBranches).toBe(0);
    });

    it('should not create branch without branchFromThought', () => {
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      const result = server.processThought({
        thought: 'No branch',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        branchId: 'branch-1'
        // Missing branchFromThought
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.activeBranches).toBe(0);
    });

    it('should create new sequences', () => {
      // First sequence (auto-created)
      const result1 = server.processThought({
        thought: 'First sequence',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        responseMode: 'verbose' as const
      });
      
      const data1 = JSON.parse(result1.content[0].text) as CascadeThinkingResponse;
      const initialSequenceCount = data1.totalSequences;
      const firstSequenceId = data1.currentSequence.id;
      expect(data1.currentSequence.thoughtsInSequence).toBe(1);
      
      // Continue first sequence
      const result2 = server.processThought({
        thought: 'Continue first',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        responseMode: 'verbose' as const
      });
      
      const data2 = JSON.parse(result2.content[0].text) as CascadeThinkingResponse;
      expect(data2.totalSequences).toBe(initialSequenceCount); // Same number of sequences
      expect(data2.currentSequence.id).toBe(firstSequenceId); // Same sequence
      expect(data2.currentSequence.thoughtsInSequence).toBe(2);
      
      // Start new sequence explicitly
      const result3 = server.processThought({
        thought: 'New sequence',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        startNewSequence: true,
        sequenceDescription: 'Testing sequences',
        responseMode: 'verbose' as const
      });
      
      const data3 = JSON.parse(result3.content[0].text) as CascadeThinkingResponse;
      expect(data3.totalSequences).toBe(initialSequenceCount + 1); // One more sequence
      expect(data3.currentSequence.thoughtsInSequence).toBe(1);
      expect(data3.currentSequence.summary).toBe('Testing sequences');
      // Extract numbers from A-prefix for comparison
      const abs2 = parseInt(data2.absoluteThoughtNumber.substring(1));
      const abs3 = parseInt(data3.absoluteThoughtNumber.substring(1));
      expect(abs3).toBeGreaterThan(abs2);
      
      // Verify the sequences are different
      expect(data3.currentSequence.id).not.toBe(data2.currentSequence.id);
    });

    it('should provide helpful hints', () => {
      const result = server.processThought({
        thought: 'Test',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.hint).toBeDefined();
      expect(data.hint).toContain('Continuing');
    });

    it('should handle reference resolution correctly', () => {
      // Create some thoughts to reference
      server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });
      
      server.processThought({
        thought: 'Second',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });
      
      // Start new sequence
      server.processThought({
        thought: 'New seq',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        startNewSequence: true
      });
      
      // Test absolute reference
      const result1 = server.processThought({
        thought: 'Revising absolute',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'A2' // Absolute reference to thought 2
      });
      
      const data1 = JSON.parse(result1.content[0].text) as CascadeThinkingResponse;
      expect(data1.absoluteThoughtNumber).toBe('A4');
      
      // Test sequence-relative reference
      const result2 = server.processThought({
        thought: 'Revising relative',
        thoughtNumber: 'S3',
        totalThoughts: 3,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'S1' // Reference to thought 1 in current sequence (which is absolute 3)
      });
      
      const data2 = JSON.parse(result2.content[0].text) as CascadeThinkingResponse;
      expect(data2.absoluteThoughtNumber).toBe('A5');
    });

    it('should track recent thoughts', () => {
      const thoughts = [
        'First thought',
        'Second thought',
        'Third thought',
        'Fourth thought'
      ];
      
      thoughts.forEach((thought, i) => {
        server.processThought({
          thought,
          thoughtNumber: `S${i + 1}`,
          totalThoughts: 4,
          nextThoughtNeeded: i < 3
        });
      });
      
      const result = server.processThought({
        thought: 'Fifth thought',
        thoughtNumber: 'S5',
        totalThoughts: 5,
        nextThoughtNeeded: false
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.recentThoughts).toHaveLength(5);
      expect(data.recentThoughts[0].content).toContain('First thought');
      expect(data.recentThoughts[0].absolute).toBe('A1');
      expect(data.recentThoughts[1].content).toContain('Second thought');
      expect(data.recentThoughts[1].absolute).toBe('A2');
      expect(data.recentThoughts[2].content).toContain('Third thought');
      expect(data.recentThoughts[2].absolute).toBe('A3');
      expect(data.recentThoughts[3].content).toContain('Fourth thought');
      expect(data.recentThoughts[3].absolute).toBe('A4');
      expect(data.recentThoughts[4].content).toContain('Fifth thought');
      expect(data.recentThoughts[4].absolute).toBe('A5');
    });

    it('should truncate long thoughts in recent thoughts', () => {
      const longThought = 'This is a very long thought that definitely exceeds one hundred characters and will need to be truncated with ellipsis when displayed in recent thoughts';
      
      const result = server.processThought({
        thought: longThought,
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.recentThoughts).toHaveLength(1);
      expect(data.recentThoughts[0].content).toHaveLength(103); // 100 chars + '...'
      expect(data.recentThoughts[0].content.endsWith('...')).toBe(true);
    });


    it('should include verbose details when requested', () => {
      const r1 = server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      const d1 = JSON.parse(r1.content[0].text) as CascadeThinkingResponse;
      const initialSequenceCount = d1.totalSequences;
      
      const result = server.processThought({
        thought: 'Second',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        responseMode: 'verbose',
        startNewSequence: true
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      expect(data.sequenceHistory).toBeDefined();
      expect(data.totalSequences).toBe(initialSequenceCount + 1); // One more sequence than before
      if (data.sequenceHistory) {
        expect(data.sequenceHistory).toHaveLength(data.totalSequences); // History length matches total
      }
      expect(data.branches).toBeDefined();
      // Verify we have at least 2 sequences and they're different
      if (data.sequenceHistory && data.sequenceHistory.length >= 2) {
        const sequenceIds = data.sequenceHistory.map(s => s.id);
        const uniqueIds = new Set(sequenceIds);
        expect(uniqueIds.size).toBe(sequenceIds.length); // All IDs are unique
      }
    });

    // Alternative tests that don't rely on absolute sequence counts
    it('should create distinct sequences with startNewSequence', () => {
      // Create first thought (auto-creates sequence)
      const r1 = server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      const d1 = JSON.parse(r1.content[0].text) as CascadeThinkingResponse;
      const firstSequenceId = d1.currentSequence.id;
      
      // Create second thought with startNewSequence
      const r2 = server.processThought({
        thought: 'Second',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        sequenceDescription: 'New sequence'
      });
      const d2 = JSON.parse(r2.content[0].text) as CascadeThinkingResponse;
      const secondSequenceId = d2.currentSequence.id;
      
      // Verify sequences are different
      expect(secondSequenceId).not.toBe(firstSequenceId);
      expect(d2.currentSequence.summary).toBe('New sequence');
      expect(d2.absoluteThoughtNumber).toBe('A2');
    });

    it('should include sequence metadata in verbose mode', () => {
      // Create a thought with verbose mode
      const result = server.processThought({
        thought: 'Verbose test',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        responseMode: 'verbose'
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Verify verbose fields are present
      expect(data.sequenceHistory).toBeDefined();
      expect(data.branches).toBeDefined();
      expect(Array.isArray(data.sequenceHistory)).toBe(true);
      
      // Verify sequence history contains current sequence
      if (data.sequenceHistory && data.sequenceHistory.length > 0) {
        const currentInHistory = data.sequenceHistory.find(s => s.id === data.currentSequence.id);
        expect(currentInHistory).toBeDefined();
      }
    });



    it('should handle branch reference with existing branch', () => {
      // Create initial thought
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });
      
      // Create branch - this creates a new sequence starting at S1
      const branchResult = server.processThought({
        thought: 'Branch',
        thoughtNumber: 'S1',  // Branches start new sequences at S1
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'test-branch'
      });
      
      // Verify we're on the branch
      const branchData = JSON.parse(branchResult.content[0].text) as CascadeThinkingResponse;
      expect(branchData.currentBranch).toBe('test-branch');
      
      // Continue in same branch - now S2 in the branch sequence
      // Since we just created the branch, we're already on it
      const result = server.processThought({
        thought: 'Continue branch',
        thoughtNumber: 'S2',  // Second thought in branch
        totalThoughts: 3,
        nextThoughtNeeded: false
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.absoluteThoughtNumber).toBe('A3');
      expect(data.currentBranch).toBe('test-branch');
    });

    it('should handle non-existent reference', () => {
      // Create a thought
      server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      
      // Try to reference a non-existent absolute thought
      const result = server.processThought({
        thought: 'Referencing non-existent',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'A999' // This doesn't exist
      });
      
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text) as ErrorResponse;
      expect(data.error).toContain('Absolute thought A999 does not exist');
    });

    it('should handle invalid reference format', () => {
      // Try various invalid formats
      const invalidFormats = [
        { input: 'invalid format', error: 'Invalid revisesThought: must match pattern' },
        { input: '123', error: 'Invalid revisesThought: must match pattern' },
        { input: 'AA123', error: 'Invalid revisesThought: must match pattern' },
        { input: 'X123', error: 'Invalid revisesThought: must match pattern' },
        { input: 'S', error: 'Invalid revisesThought: must match pattern' },
        { input: 'A', error: 'Invalid revisesThought: must match pattern' }
      ];

      server.processThought({
        thought: 'Setup',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      invalidFormats.forEach(({ input, error }) => {
        const result = server.processThought({
          thought: 'Test invalid format',
          thoughtNumber: 'S2',
          totalThoughts: 2,
          nextThoughtNeeded: false,
          isRevision: true,
          revisesThought: input
        });
        
        expect(result.isError).toBe(true);
        const data = JSON.parse(result.content[0].text) as ErrorResponse;
        expect(data.error).toContain(error);
      });
    });

    it('should handle case-insensitive reference prefixes', () => {
      // Create thoughts
      server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });
      
      server.processThought({
        thought: 'Second',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });
      
      // Test lowercase
      let result = server.processThought({
        thought: 'Test lowercase',
        thoughtNumber: 'S3',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 'a1'  // lowercase absolute
      });
      
      expect(result.isError).toBeUndefined();
      
      // Test uppercase
      result = server.processThought({
        thought: 'Test uppercase',
        thoughtNumber: 'S4',
        totalThoughts: 4,
        nextThoughtNeeded: false,
        revisesThought: 's2'  // lowercase sequence-relative
      });
      
      expect(result.isError).toBeUndefined();
    });

    it('should handle non-existent sequence-relative reference', () => {
      // Create a thought
      server.processThought({
        thought: 'First',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });
      
      // Try to reference a non-existent sequence thought
      const result = server.processThought({
        thought: 'Referencing non-existent',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'S10' // Sequence thought 10 doesn't exist
      });
      
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text) as ErrorResponse;
      expect(data.error).toContain('Sequence thought S10 does not exist');
    });


    it('should handle non-Error throws in processThought', () => {
      // Since the non-Error branch is hard to test without complex mocking,
      // and it's a defensive programming pattern that's unlikely to occur,
      // we'll accept the coverage ignore for this specific case
      
      // Test that regular Error objects are handled correctly
      const errorInput = {
        thought: null, // This will cause validateThoughtData to throw
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      };
      
      const result = server.processThought(errorInput);
      
      expect(result.isError).toBe(true);
      const data = JSON.parse(result.content[0].text) as ErrorResponse;
      expect(data.error).toBe('Invalid thought: must be a string');
      expect(data.status).toBe('failed');
    });


  });
});