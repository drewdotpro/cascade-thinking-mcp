import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse } from '../types/thought.js';

describe('CascadeThinkingServer - Branch State Clarity', () => {
  let server: CascadeThinkingServer;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    server = new CascadeThinkingServer();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Branch Information in Responses', () => {
    it('should show currentBranch as "main" when not on a branch', () => {
      const result = server.processThought({
        thought: 'Main sequence thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('main');
    });

    it('should show currentBranch with branch ID when on a branch', () => {
      // Create main thought
      server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true
      });

      // Create branch
      server.processThought({
        thought: 'Branch start',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'feature-branch',
        branchDescription: 'Testing feature'
      });

      // Continue on branch
      const result = server.processThought({
        thought: 'Continue on branch',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('feature-branch');
    });

    it('should include availableBranches with thought counts', () => {
      // Create main thoughts
      server.processThought({
        thought: 'Main 1',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });

      // Create first branch
      server.processThought({
        thought: 'Branch 1 start',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'branch-1',
        branchDescription: 'First branch'
      });

      // Add more thoughts to branch
      server.processThought({
        thought: 'Branch 1 continue',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      // Switch back to main
      server.processThought({
        thought: 'Back to main',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        switchToBranch: 'main'
      });

      // Create second branch
      server.processThought({
        thought: 'Branch 2 start',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        branchFromThought: 'A1',
        branchId: 'branch-2'
      });

      // Get final state
      const result = server.processThought({
        thought: 'Check branches',
        thoughtNumber: 'S2',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.availableBranches).toBeDefined();
      expect(data.availableBranches).toHaveLength(2);
      
      const branch1 = data.availableBranches?.find(b => b.branchId === 'branch-1');
      expect(branch1).toBeDefined();
      expect(branch1?.thoughtCount).toBe(2);
      expect(branch1?.description).toBe('First branch');
      
      const branch2 = data.availableBranches?.find(b => b.branchId === 'branch-2');
      expect(branch2).toBeDefined();
      expect(branch2?.thoughtCount).toBe(2); // 1 for creating branch + 1 for the thought
    });
  });

  describe('Branch Symbols in Formatted Output', () => {
    it('should show branch symbol when creating a branch', () => {
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Creating branch',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        branchFromThought: 'A1',
        branchId: 'test-branch'
      });

      const output = consoleErrorSpy.mock.calls[1][0];
      expect(output).toContain('🌿 Branch');
      expect(output).toContain('from absolute thought 1');
      expect(output).toContain('test-branch');
    });

    it('should show branch symbol for all thoughts on a branch', () => {
      // Create main thought
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });

      // Create branch
      server.processThought({
        thought: 'Branch start',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'feature-x'
      });

      // Continue on branch
      server.processThought({
        thought: 'Continuing on branch',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      const lastOutput = consoleErrorSpy.mock.calls[2][0];
      expect(lastOutput).toContain('🌿 Thought');
      expect(lastOutput).toContain('on branch feature-x');
    });

    it('should show regular thought symbol on main branch', () => {
      server.processThought({
        thought: 'Main branch thought',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false
      });

      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain('💭 Thought');
      expect(output).not.toContain('🌿');
    });
  });

  describe('Branch-Aware Hints', () => {
    it('should show branch info in hints when on a branch', () => {
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'auth-flow',
        branchDescription: 'Authentication exploration'
      });

      const result = server.processThought({
        thought: 'On branch',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: false
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.hint).toContain("On branch 'auth-flow'");
      expect(data.hint).toContain('Authentication exploration');
      expect(data.hint).toContain('with 2 thoughts');
    });

    it('should list all branches with thought counts in hints', () => {
      // Create multiple branches
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch 1',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'payment'
      });

      server.processThought({
        thought: 'More on branch 1',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false
      });

      server.processThought({
        thought: 'Back to main',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        switchToBranch: 'main'
      });

      server.processThought({
        thought: 'Branch 2',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        branchFromThought: 'A1',
        branchId: 'error-handling'
      });

      const result = server.processThought({
        thought: 'Main check',
        thoughtNumber: 'S3',
        totalThoughts: 3,
        nextThoughtNeeded: false,
        switchToBranch: 'main'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.hint).toContain('Branches: payment(2), error-handling(1)');
    });
  });

  describe('Response Mode Behavior', () => {
    it('should only show branch info in minimal mode when on non-main branch', () => {
      // On main branch - minimal mode
      const mainResult = server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        responseMode: 'minimal'
      });

      const mainData = JSON.parse(mainResult.content[0].text) as CascadeThinkingResponse;
      expect(mainData.currentBranch).toBeUndefined();
      expect(mainData.availableBranches).toBeUndefined();

      // Create branch
      server.processThought({
        thought: 'Branch',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'feature'
      });

      // On branch - minimal mode
      const branchResult = server.processThought({
        thought: 'On branch',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        responseMode: 'minimal'
      });

      const branchData = JSON.parse(branchResult.content[0].text) as CascadeThinkingResponse;
      expect(branchData.currentBranch).toBe('feature'); // Auto-enhanced
      expect(branchData.availableBranches).toBeUndefined(); // Still minimal
    });

    it('should always show branch info in standard mode', () => {
      const result = server.processThought({
        thought: 'Standard mode',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        responseMode: 'standard'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('main');
      // availableBranches is only included when there are branches
      expect(data.availableBranches).toBeUndefined();
    });

    it('should show full branch info in verbose mode', () => {
      // Create some branches
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        branchFromThought: 'A1',
        branchId: 'test'
      });

      const result = server.processThought({
        thought: 'Verbose check',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        responseMode: 'verbose',
        switchToBranch: 'main'
      });

      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('main');
      expect(data.availableBranches).toBeDefined();
      expect(data.availableBranches).toHaveLength(1);
      expect(data.branches).toBeDefined(); // Full branch metadata in verbose
      expect(data.branches?.test).toBeDefined();
    });
  });

  describe('Branch Navigation State', () => {
    it('should track current branch correctly when switching', () => {
      // Create main and branches
      server.processThought({
        thought: 'Main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true
      });

      server.processThought({
        thought: 'Branch A',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'branch-a'
      });

      server.processThought({
        thought: 'Branch B from main',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: true,
        branchFromThought: 'A1',
        branchId: 'branch-b',
        switchToBranch: 'main'
      });

      // Check branch A
      let result = server.processThought({
        thought: 'Check A',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        switchToBranch: 'branch-a'
      });

      let data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('branch-a');
      expect(data.hint).toContain("On branch 'branch-a'");

      // Check branch B
      result = server.processThought({
        thought: 'Check B',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        switchToBranch: 'branch-b'
      });

      data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('branch-b');
      expect(data.hint).toContain("On branch 'branch-b'");

      // Check main
      result = server.processThought({
        thought: 'Check main',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        switchToBranch: 'main'
      });

      data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.currentBranch).toBe('main');
      expect(data.hint).not.toContain("On branch");
    });
  });
});