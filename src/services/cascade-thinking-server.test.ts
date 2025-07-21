import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';

interface ThoughtResponse {
  thoughtNumber?: number;
  totalThoughts?: number;
  nextThoughtNeeded?: boolean;
  branches?: string[];
  thoughtHistoryLength?: number;
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
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true
      };

      const result = server.processThought(input);

      expect(result.isError).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Test thought'));
      
      const data = JSON.parse(result.content[0].text) as { 
        thoughtNumber: number; 
        totalThoughts: number; 
        nextThoughtNeeded: boolean; 
        branches: string[]; 
        thoughtHistoryLength: number 
      };
      expect(data).toEqual({
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branches: [],
        thoughtHistoryLength: 1
      });
    });

    it('should not log when DISABLE_THOUGHT_LOGGING is true', () => {
      process.env.DISABLE_THOUGHT_LOGGING = 'true';
      server = new CascadeThinkingServer();
      
      const input = {
        thought: 'Test thought',
        thoughtNumber: 1,
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
          thoughtNumber: 1,
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
      const input = {
        thought: 'Extended thought',
        thoughtNumber: 10,
        totalThoughts: 5,
        nextThoughtNeeded: true
      };

      const result = server.processThought(input);
      const data = JSON.parse(result.content[0].text) as ThoughtResponse;
      
      expect(data.totalThoughts).toBe(10);
    });

    it('should track thought history', () => {
      const thoughts = [
        { thought: 'First', thoughtNumber: 1, totalThoughts: 3, nextThoughtNeeded: true },
        { thought: 'Second', thoughtNumber: 2, totalThoughts: 3, nextThoughtNeeded: true },
        { thought: 'Third', thoughtNumber: 3, totalThoughts: 3, nextThoughtNeeded: false }
      ];

      thoughts.forEach((thought, index) => {
        const result = server.processThought(thought);
        const data = JSON.parse(result.content[0].text) as ThoughtResponse;
        expect(data.thoughtHistoryLength).toBe(index + 1);
      });
    });

    it('should track branches', () => {
      // First thought
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Branch 1
      const branch1Result = server.processThought({
        thought: 'Branch 1',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 1,
        branchId: 'branch-1'
      });

      let data = JSON.parse(branch1Result.content[0].text) as ThoughtResponse;
      expect(data.branches).toEqual(['branch-1']);

      // Branch 2
      const branch2Result = server.processThought({
        thought: 'Branch 2',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: false,
        branchFromThought: 1,
        branchId: 'branch-2'
      });

      data = JSON.parse(branch2Result.content[0].text) as ThoughtResponse;
      expect(data.branches).toContain('branch-1');
      expect(data.branches).toContain('branch-2');
      expect(data.branches).toHaveLength(2);
    });

    it('should handle validation errors', () => {
      const invalidInputs = [
        { input: {}, error: 'Invalid thought: must be a string' },
        { input: { thought: 123 }, error: 'Invalid thought: must be a string' },
        { input: { thought: 'test' }, error: 'Invalid thoughtNumber: must be a number' },
        { input: { thought: 'test', thoughtNumber: 1 }, error: 'Invalid totalThoughts: must be a number' },
        { input: { thought: 'test', thoughtNumber: 1, totalThoughts: 1 }, error: 'Invalid nextThoughtNeeded: must be a boolean' }
      ];

      invalidInputs.forEach(({ input, error }) => {
        const result = server.processThought(input);
        
        expect(result.isError).toBe(true);
        const data = JSON.parse(result.content[0].text) as ThoughtResponse;
        expect(data.error).toBe(error);
        expect(data.status).toBe('failed');
      });
    });


    it('should not create branch without branchId', () => {
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      const result = server.processThought({
        thought: 'No branch',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        branchFromThought: 1
        // Missing branchId
      });

      const data = JSON.parse(result.content[0].text) as ThoughtResponse;
      expect(data.branches).toEqual([]);
    });

    it('should not create branch without branchFromThought', () => {
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      const result = server.processThought({
        thought: 'No branch',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        branchId: 'branch-1'
        // Missing branchFromThought
      });

      const data = JSON.parse(result.content[0].text) as ThoughtResponse;
      expect(data.branches).toEqual([]);
    });
  });
});