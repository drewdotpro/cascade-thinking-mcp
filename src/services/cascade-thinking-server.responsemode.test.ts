import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse } from '../types/thought.js';

describe('CascadeThinkingServer - Response Mode Control', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  describe('Minimal Mode', () => {
    it('should return only essential fields in minimal mode', () => {
      const result = server.processThought({
        thought: 'Test minimal mode',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        responseMode: 'minimal'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Should have minimal fields
      expect(data.thoughtNumber).toBe('S1');
      expect(data.absoluteThoughtNumber).toBe('A1');
      expect(data.totalThoughts).toBe(3);
      expect(data.nextThoughtNeeded).toBe(true);
      expect(data.hint).toBeDefined();
      expect(data.expectedThoughtNumber).toBe('S2');
      
      // Should NOT have standard/verbose fields
      expect(data.currentSequence).toBeUndefined();
      expect(data.recentThoughts).toBeUndefined();
      expect(data.totalSequences).toBeUndefined();
      expect(data.totalThoughtsAllTime).toBeUndefined();
      expect(data.activeBranches).toBeUndefined();
    });

    it('should auto-enhance minimal mode when on branch', () => {
      // Create main thought
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      // Create branch
      const result = server.processThought({
        thought: 'Branch thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'test-branch',
        responseMode: 'minimal'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Should auto-enhance with branch info
      expect(data.currentBranch).toBe('test-branch');
      
      // But still no other standard fields
      expect(data.recentThoughts).toBeUndefined();
    });

    it('should auto-enhance minimal mode for revisions', () => {
      server.processThought({
        thought: 'Original thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      const result = server.processThought({
        thought: 'Revising thought',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 'S1',
        responseMode: 'minimal'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Should auto-enhance with sequence info for revision context
      expect(data.currentSequence).toBeDefined();
      expect(data.currentSequence?.summary).toBeDefined();
      
      // But still no other fields
      expect(data.recentThoughts).toBeUndefined();
    });
  });

  describe('Standard Mode', () => {
    it('should return standard fields by default', () => {
      // Create some thoughts for context
      for (let i = 1; i <= 3; i++) {
        server.processThought({
          thought: `Thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 5,
          nextThoughtNeeded: true
        });
      }

      const result = server.processThought({
        thought: 'Standard mode test',
        thoughtNumber: 'S4',
        totalThoughts: 5,
        nextThoughtNeeded: true
        // No responseMode specified - should default to standard
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Should have standard fields
      expect(data.currentSequence).toBeDefined();
      expect(data.recentThoughts).toBeDefined();
      expect(data.recentThoughts).toHaveLength(4); // Changed to 5 default, but only 4 thoughts exist
      expect(data.currentBranch).toBe('main');
      
      // Should have standard tracking fields
      expect(data.totalSequences).toBeDefined();
      expect(data.totalThoughtsAllTime).toBeDefined();
      expect(data.activeBranches).toBeDefined();
      
      // Should NOT have verbose-only fields
      expect(data.sequenceHistory).toBeUndefined();
      expect(data.branches).toBeUndefined();
    });

    it('should include gap info in standard mode', () => {
      // User thought
      server.processThought({
        thought: 'User thought 1',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Agent thoughts (creating gap)
      for (let i = 2; i <= 4; i++) {
        server.processThought({
          thought: `Agent thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 10,
          nextThoughtNeeded: true,
          toolSource: 'agent'
        });
      }

      // User thought after gap
      const result = server.processThought({
        thought: 'User thought 2',
        thoughtNumber: 'S5',
        totalThoughts: 10,
        nextThoughtNeeded: false,
        responseMode: 'standard'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Should include gap info in standard mode
      expect(data.gapInfo).toBeDefined();
      expect(data.gapInfo?.gapSize).toBe(3);
      expect(data.gapInfo?.createdBy).toContain('agent');
    });
  });

  describe('Verbose Mode', () => {
    it('should return all fields in verbose mode', () => {
      // Create multiple sequences and branches
      server.processThought({
        thought: 'Seq 1 thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'branch-1'
      });

      server.processThought({
        thought: 'New sequence',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true
      });

      const result = server.processThought({
        thought: 'Verbose test',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        startNewSequence: true,
        responseMode: 'verbose',
        toolSource: 'test-tool'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // Should have all fields
      expect(data.thoughtNumber).toBeDefined();
      expect(data.absoluteThoughtNumber).toBeDefined();
      expect(data.currentSequence).toBeDefined();
      expect(data.recentThoughts).toBeDefined();
      expect(data.totalSequences).toBe(4); // Initial + branch + 2 new sequences
      expect(data.totalThoughtsAllTime).toBe(4);
      expect(data.activeBranches).toBeDefined();
      expect(data.currentBranch).toBeDefined();
      expect(data.availableBranches).toBeDefined();
      expect(data.sequenceHistory).toBeDefined();
      expect(data.branches).toBeDefined();
      expect(data.toolSource).toBe('test-tool');
    });

  });

  describe('Response Mode Validation', () => {
    it('should reject invalid response mode', () => {
      const result = server.processThought({
        thought: 'Test',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        responseMode: 'invalid' as any
      });

      expect(result.isError).toBe(true);
      const error = JSON.parse(result.content[0].text) as { error: string; status: string };
      expect(error.error).toBe('responseMode must be one of: minimal, standard, verbose');
    });

    it('should accept valid response modes', () => {
      const modes: Array<'minimal' | 'standard' | 'verbose'> = ['minimal', 'standard', 'verbose'];
      
      modes.forEach((mode, index) => {
        const isNewSequence = index > 0;
        const thoughtNum = isNewSequence ? 1 : index + 1;
        
        const result = server.processThought({
          thought: `Test ${mode}`,
          thoughtNumber: `S${thoughtNum}`,
          totalThoughts: 3,
          nextThoughtNeeded: index < 2,
          startNewSequence: isNewSequence,
          responseMode: mode
        });

        expect(result.isError).toBeUndefined();
        const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
        expect(data.thoughtNumber).toBe(`S${thoughtNum}`);
      });
    });
  });

  describe('Progressive Disclosure', () => {
    it('should include helpful hints about using verbose mode', () => {
      // Create a simple scenario on a branch
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      // Create and continue on branch
      server.processThought({
        thought: 'Branch thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'analysis-branch',
        branchDescription: 'Analyzing alternative'
      });
      
      // Continue on the branch (which is now the current context)
      const result = server.processThought({
        thought: 'Where am I?',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: false,
        responseMode: 'minimal'
      });

      expect(result.isError).toBeUndefined();
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      
      // In minimal mode, hint should still be included
      expect(data.hint).toBeDefined();
      expect(data.hint).toContain('branch');
      expect(data.hint).toContain('analysis-branch');
      
      // Auto-enhancement should add branch info
      expect(data.currentBranch).toBe('analysis-branch');
    });
  });
});