import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse, SequenceMetadata } from '../types/thought.js';

describe('CascadeThinkingServer - True Branching', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  it('should automatically create new sequence when branching', () => {
    // Create initial thought
    const result1 = server.processThought({
      thought: 'Main analysis',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      responseMode: 'verbose'
    });
    
    const data1 = JSON.parse(result1.content[0].text);
    expect(data1.totalSequences).toBe(1);
    expect(data1.currentBranch).toBe('main');

    // Create a branch - should auto-create new sequence
    const result2 = server.processThought({
      thought: 'Exploring alternative approach',
      thoughtNumber: 'S1',  // Should reset to S1 in new sequence
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'alt-approach',
      branchDescription: 'OAuth instead of API keys',
      responseMode: 'verbose'
    });
    
    const data2 = JSON.parse(result2.content[0].text);
    expect(data2.thoughtNumber).toBe('S1');  // Reset in new sequence
    expect(data2.totalSequences).toBe(2);  // New sequence created
    expect(data2.currentBranch).toBe('alt-approach');
    expect(data2.currentSequence.summary).toContain('Branch: OAuth instead of API keys');
    expect(data2.availableBranches).toBeDefined();
    expect(data2.availableBranches).toHaveLength(2); // main + alt-approach
    const altBranch = data2.availableBranches.find(b => b.branchId === 'alt-approach');
    expect(altBranch).toBeDefined();
    expect(altBranch.branchId).toBe('alt-approach');
  });

  it('should copy context when creating a branch', () => {
    // Create some initial thoughts
    server.processThought({
      thought: 'First thought with important context',
      thoughtNumber: 'S1',
      totalThoughts: 5,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Second thought building on first',
      thoughtNumber: 'S2',
      totalThoughts: 5,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Third thought with key insight',
      thoughtNumber: 'S3',
      totalThoughts: 5,
      nextThoughtNeeded: true
    });

    // Create branch - should include context
    const result = server.processThought({
      thought: 'Branch exploring alternative',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      branchFromThought: 'A2',
      branchId: 'alternative',
      responseMode: 'verbose'  // Get verbose output to check context
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Find the branch sequence
    const branchSequence = data.sequenceHistory?.find(
      seq => seq.parentBranchId === 'alternative'
    );
    
    expect(branchSequence).toBeDefined();
    expect(branchSequence.branchContext).toBeDefined();
    expect(branchSequence.branchContext).toHaveLength(2);  // Up to A2
    expect(branchSequence.branchContext[0].content).toContain('First thought');
    expect(branchSequence.branchContext[1].content).toContain('Second thought');
  });

  it('should support switching between branches', () => {
    // Create main sequence
    server.processThought({
      thought: 'Main thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Create first branch
    server.processThought({
      thought: 'Branch 1 thought',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'branch-1'
    });

    // Switch back to main first
    server.processThought({
      thought: 'Main thought 2',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      switchToBranch: 'main'
    });

    // Create second branch from main
    server.processThought({
      thought: 'Branch 2 thought',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'branch-2'
    });

    // Switch to branch-1
    const result = server.processThought({
      thought: 'Continuing on branch 1',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false,
      switchToBranch: 'branch-1'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.currentBranch).toBe('branch-1');
    expect(data.thoughtNumber).toBe('S2');
    expect(data.availableBranches).toHaveLength(3); // main + branch-1 + branch-2
  });

  it('should show branch info in hints', () => {
    // Create main thought
    server.processThought({
      thought: 'Main analysis',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Create branch
    const result = server.processThought({
      thought: 'OAuth branch',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'oauth-branch',
      branchDescription: 'Exploring OAuth approach'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.hint).toContain("On branch 'oauth-branch'");
    expect(data.hint).toContain('Exploring OAuth approach');
    expect(data.hint).toContain('Branches: oauth-branch');
  });

  it('should handle invalid branch switching', () => {
    const result = server.processThought({
      thought: 'Try to switch to non-existent branch',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      switchToBranch: 'non-existent'
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text) as { error: string; status: string };
    expect(error.error).toContain("Branch 'non-existent' does not exist");
  });

  it('should maintain separate thought counters per branch sequence', () => {
    // Main sequence
    server.processThought({
      thought: 'Main 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Main 2',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Branch 1 - should reset to S1
    const branch1Result = server.processThought({
      thought: 'Branch 1 start',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A2',
      branchId: 'branch-1'
    });

    expect(JSON.parse(branch1Result.content[0].text).thoughtNumber).toBe('S1');

    // Continue on branch 1
    const branch1Continue = server.processThought({
      thought: 'Branch 1 continue',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false
    });

    expect(JSON.parse(branch1Continue.content[0].text).thoughtNumber).toBe('S2');

    // Switch to main and continue (main already has S1 and S2)
    const mainContinue = server.processThought({
      thought: 'Main 3',
      thoughtNumber: 'S3',
      totalThoughts: 3,
      nextThoughtNeeded: false,
      switchToBranch: 'main'
    });

    const mainData = JSON.parse(mainContinue.content[0].text);
    expect(mainData.thoughtNumber).toBe('S3');
    expect(mainData.currentBranch).toBe('main');
  });

  it('should include branch metadata in verbose output', () => {
    // Create structure
    server.processThought({
      thought: 'Main',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: true
    });

    // Create branch with one thought
    server.processThought({
      thought: 'Branch thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      branchFromThought: 'A1',
      branchId: 'test-branch',
      branchDescription: 'Testing branching'
    });

    // Switch to main and get verbose output (main already has S1)
    const result = server.processThought({
      thought: 'Check verbose',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false,
      responseMode: 'verbose',
      switchToBranch: 'main'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.branches).toBeDefined();
    expect(data.branches['test-branch']).toBeDefined();
    expect(data.branches['test-branch'].description).toBe('Testing branching');
    expect(data.branches['test-branch'].fromAbsoluteThought).toBe(1);
    expect(data.branches['test-branch'].thoughtsInBranch).toBe(1);  // Only one thought in the branch itself
  });

  it('should truncate long thoughts in branch context', () => {
    // Create a very long thought
    const longThought = 'This is a very long thought that definitely exceeds one hundred characters and will need to be truncated with ellipsis when displayed in branch context';
    
    server.processThought({
      thought: longThought,
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Create a branch from the long thought
    const result = server.processThought({
      thought: 'Branch from long thought',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      branchFromThought: 'A1',
      branchId: 'test-branch',
      responseMode: 'verbose'
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    // Check sequence history for branch context
    expect(data.sequenceHistory).toBeDefined();
    const branchSequence = data.sequenceHistory?.find(seq => seq.parentBranchId === 'test-branch');
    expect(branchSequence).toBeDefined();
    expect(branchSequence.branchContext).toBeDefined();
    expect(branchSequence.branchContext[0]).toBeDefined();
    
    // Verify the thought was truncated
    const contextThought = branchSequence.branchContext[0];
    expect(contextThought.content).toHaveLength(103); // 100 chars + '...'
    expect(contextThought.content.endsWith('...')).toBe(true);
    expect(contextThought.content.startsWith('This is a very long thought')).toBe(true);
  });

  it('should work with isolated contexts', () => {
    // Create isolated context for agent
    const result1 = server.processThought({
      thought: 'Agent isolated thought',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      toolSource: 'agent:1',
      isolatedContext: true
    });

    expect(result1.isError).toBeUndefined();

    // Create branch in isolated context
    const result2 = server.processThought({
      thought: 'Agent branch',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      toolSource: 'agent:1',
      isolatedContext: true,
      branchFromThought: 'A1',
      branchId: 'agent-branch',
      responseMode: 'verbose'
    });

    const data = JSON.parse(result2.content[0].text);
    expect(data.currentBranch).toBe('agent-branch');
    expect(data.totalSequences).toBe(2);  // Two sequences in isolated context
  });

  it('should include expectedThoughtNumber in availableBranches', () => {
    // Create main sequence with two thoughts
    server.processThought({
      thought: 'Main 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Main 2',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Create a branch with one thought
    server.processThought({
      thought: 'Branch 1 thought 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'branch-1'
    });

    // Continue on branch to add another thought
    server.processThought({
      thought: 'Branch 1 thought 2',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false
    });

    // Switch to main and check availableBranches
    const result = server.processThought({
      thought: 'Check available branches',
      thoughtNumber: 'S3',
      totalThoughts: 3,
      nextThoughtNeeded: false,
      switchToBranch: 'main'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.availableBranches).toBeDefined();
    expect(data.availableBranches).toHaveLength(2); // main + branch-1
    
    // Find main branch info
    const mainBranch = data.availableBranches?.find(b => b.branchId === 'main');
    expect(mainBranch).toBeDefined();
    expect(mainBranch.expectedThoughtNumber).toBe('S4'); // Main has S1, S2, S3, so next is S4
    
    // Find branch-1 info
    const branch1 = data.availableBranches?.find(b => b.branchId === 'branch-1');
    expect(branch1).toBeDefined();
    expect(branch1.expectedThoughtNumber).toBe('S3'); // Branch-1 has S1, S2, so next is S3
  });

  it('should accept thoughts without thoughtNumber when switching branches', () => {
    // Create main thought
    server.processThought({
      thought: 'Main 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Create a branch
    server.processThought({
      thought: 'Branch 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'branch-1'
    });

    // Switch back to main WITHOUT providing thoughtNumber
    const result = server.processThought({
      thought: 'Back to main without thoughtNumber',
      totalThoughts: 2,
      nextThoughtNeeded: false,
      switchToBranch: 'main'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(result.isError).toBeUndefined();
    expect(data.thoughtNumber).toBe('S2'); // Should auto-calculate as S2
    expect(data.currentBranch).toBe('main');
  });

  it('should auto-calculate correct thoughtNumber when switching between branches', () => {
    // Create main sequence with thoughts
    server.processThought({
      thought: 'Main 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Main 2',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Create branch-1 with different progress
    server.processThought({
      thought: 'Branch 1 start',
      thoughtNumber: 'S1',
      totalThoughts: 4,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'branch-1'
    });

    server.processThought({
      thought: 'Branch 1 continue',
      thoughtNumber: 'S2',
      totalThoughts: 4,
      nextThoughtNeeded: true
    });

    server.processThought({
      thought: 'Branch 1 more',
      thoughtNumber: 'S3',
      totalThoughts: 4,
      nextThoughtNeeded: true
    });

    // Create branch-2 with just one thought
    server.processThought({
      thought: 'Branch 2 start',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A2',
      branchId: 'branch-2',
      switchToBranch: 'main' // First switch to main
    });

    // Now switch between branches without thoughtNumber
    // Switch to branch-1 (has S1, S2, S3, so next is S4)
    const result1 = server.processThought({
      thought: 'Continue branch 1 without number',
      totalThoughts: 4,
      nextThoughtNeeded: false,
      switchToBranch: 'branch-1'
    });

    expect(result1.isError).toBeUndefined();
    const data1 = JSON.parse(result1.content[0].text);
    expect(data1.thoughtNumber).toBe('S4');
    expect(data1.currentBranch).toBe('branch-1');

    // Switch to branch-2 (has S1, so next is S2)
    const result2 = server.processThought({
      thought: 'Continue branch 2 without number',
      totalThoughts: 2,
      nextThoughtNeeded: false,
      switchToBranch: 'branch-2'
    });

    expect(result2.isError).toBeUndefined();
    const data2 = JSON.parse(result2.content[0].text);
    expect(data2.thoughtNumber).toBe('S2');
    expect(data2.currentBranch).toBe('branch-2');

    // Switch to main (has S1, S2, so next is S3)
    const result3 = server.processThought({
      thought: 'Back to main without number',
      totalThoughts: 3,
      nextThoughtNeeded: false,
      switchToBranch: 'main'
    });

    expect(result3.isError).toBeUndefined();
    const data3 = JSON.parse(result3.content[0].text);
    expect(data3.thoughtNumber).toBe('S3');
    expect(data3.currentBranch).toBe('main');
  });

  it('should still validate thoughtNumber if provided with switchToBranch', () => {
    // Create main thought
    server.processThought({
      thought: 'Main 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true
    });

    // Create branch
    server.processThought({
      thought: 'Branch 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'branch-1'
    });

    // Try to switch to main with wrong thoughtNumber
    const result = server.processThought({
      thought: 'Wrong number',
      thoughtNumber: 'S5', // Main only has S1, so S2 is expected
      totalThoughts: 2,
      nextThoughtNeeded: false,
      switchToBranch: 'main'
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text) as { error: string; status: string };
    expect(error.error).toContain('Invalid thought number: expected S2');
  });

  it('should provide helpful error message when using wrong thought number for branch creation', () => {
    // Create initial thought
    server.processThought({
      thought: 'Main thought',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Try to create branch with wrong thought number
    const result = server.processThought({
      thought: 'Branch with wrong number',
      thoughtNumber: 'S2', // Should be S1 for new branch
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'test-branch'
    });

    expect(result.isError).toBe(true);
    const error = JSON.parse(result.content[0].text) as { error: string; status: string };
    expect(error.error).toContain('when creating a branch, use S1');
    expect(error.error).toContain('not S2');
    expect(error.error).toContain('Branches automatically start a new sequence');
  });

  it('should handle missing sequence counters gracefully', () => {
    // This test covers the edge case where sequenceThoughtCounters might not have an entry
    const server = new CascadeThinkingServer();
    
    // Create initial thought
    server.processThought({
      thought: 'Main',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: true
    });

    // Create a branch
    server.processThought({
      thought: 'Branch',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      branchFromThought: 'A1',
      branchId: 'test-branch'
    });

    // Get availableBranches - this should handle missing counters gracefully
    const result = server.processThought({
      thought: 'Check branches',
      thoughtNumber: 'S2',
      totalThoughts: 2,
      nextThoughtNeeded: false,
      switchToBranch: 'main',
      responseMode: 'standard'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    expect(data.availableBranches).toBeDefined();
    
    // All branches should have valid expectedThoughtNumber even if counter was missing
    data.availableBranches?.forEach(branch => {
      expect(branch.expectedThoughtNumber).toMatch(/^S\d+$/);
    });
  });

  it('should include branch tree visualization in verbose mode', () => {
    // Create main sequence with multiple thoughts
    server.processThought({
      thought: 'Main 1',
      thoughtNumber: 'S1',
      totalThoughts: 3,
      nextThoughtNeeded: true
    });

    // Create first branch
    server.processThought({
      thought: 'Branch 1',
      thoughtNumber: 'S1',
      totalThoughts: 2,
      nextThoughtNeeded: true,
      branchFromThought: 'A1',
      branchId: 'feature-auth',
      branchDescription: 'Authentication exploration'
    });

    // Create sub-branch
    server.processThought({
      thought: 'Sub-branch',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      branchFromThought: 'A2',
      branchId: 'oauth-specific',
      branchDescription: 'OAuth2 implementation'
    });

    // Switch back to main and create another branch
    server.processThought({
      thought: 'Main 2',
      thoughtNumber: 'S2',
      totalThoughts: 3,
      nextThoughtNeeded: true,
      switchToBranch: 'main'
    });

    server.processThought({
      thought: 'Branch 2',
      thoughtNumber: 'S1',
      totalThoughts: 1,
      nextThoughtNeeded: false,
      branchFromThought: 'A4',
      branchId: 'feature-db',
      branchDescription: 'Database optimization'
    });

    // Switch back to main and continue
    const result = server.processThought({
      thought: 'Final check',
      thoughtNumber: 'S3',
      totalThoughts: 3,
      nextThoughtNeeded: false,
      switchToBranch: 'main',
      responseMode: 'verbose'
    });

    const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
    
    
    // Should have branch data in verbose mode
    expect(data.branches).toBeDefined();
    expect(Object.keys(data.branches).length).toBe(3); // 3 branches created
    
    expect(data.branchTree).toBeDefined();
    expect(data.branchTree).toContain('Branch Tree Structure');
    expect(data.branchTree).toContain('📋 Main');
    expect(data.branchTree).toContain('├─ 🌿 feature-auth (Authentication exploration)');
    expect(data.branchTree).toContain('│  └─ 🌿 oauth-specific (OAuth2 implementation)');
    expect(data.branchTree).toContain('└─ 🌿 feature-db (Database optimization)');
  });
});