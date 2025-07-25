import { describe, it, expect, beforeEach } from 'vitest';
import { CascadeThinkingServer } from './cascade-thinking-server.js';
import { CascadeThinkingResponse } from '../types/thought.js';

describe('CascadeThinkingServer - Tool Interoperability', () => {
  let server: CascadeThinkingServer;

  beforeEach(() => {
    server = new CascadeThinkingServer();
  });

  describe('Gap Detection', () => {
    it('should detect gaps when tools create intermediate thoughts', () => {
      // User creates first thought
      const result1 = server.processThought({
        thought: 'Starting analysis',
        thoughtNumber: 'S1',
        totalThoughts: 5,
        nextThoughtNeeded: true
      });
      
      const data1 = JSON.parse(result1.content[0].text) as CascadeThinkingResponse;
      expect(data1.absoluteThoughtNumber).toBe('A1');
      expect(data1.gapInfo).toBeUndefined();
      
      // Agent creates some thoughts
      for (let i = 2; i <= 6; i++) {
        server.processThought({
          thought: `Agent thought ${i}`,
          thoughtNumber: `S${i}`,
          totalThoughts: 10,
          nextThoughtNeeded: true,
          toolSource: 'agent'
        });
      }
      
      // User creates next thought - should see gap
      const result2 = server.processThought({
        thought: 'Continuing analysis',
        thoughtNumber: 'S7',
        totalThoughts: 10,
        nextThoughtNeeded: false
      });
      
      const data2 = JSON.parse(result2.content[0].text) as CascadeThinkingResponse;
      expect(data2.absoluteThoughtNumber).toBe('A7');
      expect(data2.gapInfo).toBeDefined();
      expect(data2.gapInfo?.hasGap).toBe(true);
      expect(data2.gapInfo?.gapSize).toBe(5);
      expect(data2.gapInfo?.explanation).toContain('5 thoughts were created by other tools');
      expect(data2.gapInfo?.createdBy).toContain('agent');
    });

    it('should not show gap for consecutive user thoughts', () => {
      server.processThought({
        thought: 'First thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      const result2 = server.processThought({
        thought: 'Second thought',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      const data2 = JSON.parse(result2.content[0].text) as CascadeThinkingResponse;
      expect(data2.gapInfo).toBeUndefined();
    });

    it('should track multiple tool sources in gap', () => {
      // User thought
      server.processThought({
        thought: 'User thought',
        thoughtNumber: 'S1',
        totalThoughts: 5,
        nextThoughtNeeded: true
      });
      
      // Different tools create thoughts
      server.processThought({
        thought: 'Agent thought',
        thoughtNumber: 'S2',
        totalThoughts: 5,
        nextThoughtNeeded: true,
        toolSource: 'agent'
      });
      
      server.processThought({
        thought: 'Task thought',
        thoughtNumber: 'S3',
        totalThoughts: 5,
        nextThoughtNeeded: true,
        toolSource: 'task'
      });
      
      // User thought - should see both tools
      const result = server.processThought({
        thought: 'Next user thought',
        thoughtNumber: 'S4',
        totalThoughts: 5,
        nextThoughtNeeded: false
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.gapInfo?.createdBy).toContain('agent');
      expect(data.gapInfo?.createdBy).toContain('task');
      expect(data.gapInfo?.createdBy).toHaveLength(2);
    });
  });

  describe('Tool Source Attribution', () => {
    it('should include toolSource in response when not user', () => {
      const result = server.processThought({
        thought: 'Agent thinking',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        toolSource: 'agent',
        responseMode: 'verbose'
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.toolSource).toBe('agent');
    });

    it('should not include toolSource for user thoughts', () => {
      const result = server.processThought({
        thought: 'User thinking',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        toolSource: 'user'
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.toolSource).toBeUndefined();
    });

    it('should include tool source in hint', () => {
      const result = server.processThought({
        thought: 'Task thinking',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        toolSource: 'task'
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.hint).toContain('(created by task)');
    });
  });

  describe('Isolated Context', () => {
    it('should use isolated state when requested', () => {
      // Main context
      const result1 = server.processThought({
        thought: 'Main thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      const data1 = JSON.parse(result1.content[0].text) as CascadeThinkingResponse;
      expect(data1.absoluteThoughtNumber).toBe('A1');
      
      // Isolated agent context
      const result2 = server.processThought({
        thought: 'Agent isolated thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        toolSource: 'agent',
        isolatedContext: true
      });
      
      const data2 = JSON.parse(result2.content[0].text) as CascadeThinkingResponse;
      expect(data2.absoluteThoughtNumber).toBe('A1'); // Should be A1 in isolated context
      
      // Back to main context
      const result3 = server.processThought({
        thought: 'Main thought 2',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: false
      });
      
      const data3 = JSON.parse(result3.content[0].text) as CascadeThinkingResponse;
      expect(data3.absoluteThoughtNumber).toBe('A2'); // Should continue from A1
    });

    it('should maintain separate sequences in isolated contexts', () => {
      // Create thought in isolated context
      server.processThought({
        thought: 'Isolated thought 1',
        thoughtNumber: 'S1',
        totalThoughts: 2,
        nextThoughtNeeded: true,
        toolSource: 'agent',
        isolatedContext: true
      });
      
      server.processThought({
        thought: 'Isolated thought 2',
        thoughtNumber: 'S2',
        totalThoughts: 2,
        nextThoughtNeeded: false,
        toolSource: 'agent',
        isolatedContext: true
      });
      
      // Check main context is unaffected
      const result = server.processThought({
        thought: 'Main context thought',
        thoughtNumber: 'S1',
        totalThoughts: 1,
        nextThoughtNeeded: false,
        responseMode: 'verbose'
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.totalThoughtsAllTime).toBe(1); // Only 1 thought in main context
      expect(data.totalSequences).toBe(1);
    });
  });

  describe('Hint Enhancement', () => {
    it('should show gap notification in hint', () => {
      // Create gap
      server.processThought({
        thought: 'User thought',
        thoughtNumber: 'S1',
        totalThoughts: 3,
        nextThoughtNeeded: true
      });
      
      server.processThought({
        thought: 'Agent thought',
        thoughtNumber: 'S2',
        totalThoughts: 3,
        nextThoughtNeeded: true,
        toolSource: 'agent'
      });
      
      const result = server.processThought({
        thought: 'Next user thought',
        thoughtNumber: 'S3',
        totalThoughts: 3,
        nextThoughtNeeded: false
      });
      
      const data = JSON.parse(result.content[0].text) as CascadeThinkingResponse;
      expect(data.hint).toContain('[Note: Some thoughts created by other tools]');
    });
  });
});