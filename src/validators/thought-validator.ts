import { ThoughtData } from '../types/thought.js';

export function validateThoughtData(input: unknown): ThoughtData {
  if (!input || typeof input !== 'object') {
    throw new Error("Invalid thought: must be a string");
  }
  
  const data = input as Record<string, unknown>;

  if (!data.thought || typeof data.thought !== "string") {
    throw new Error("Invalid thought: must be a string");
  }
  if (!data.thoughtNumber || typeof data.thoughtNumber !== "number") {
    throw new Error("Invalid thoughtNumber: must be a number");
  }
  if (!data.totalThoughts || typeof data.totalThoughts !== "number") {
    throw new Error("Invalid totalThoughts: must be a number");
  }
  if (typeof data.nextThoughtNeeded !== "boolean") {
    throw new Error("Invalid nextThoughtNeeded: must be a boolean");
  }

  return {
    thought: data.thought,
    thoughtNumber: data.thoughtNumber,
    totalThoughts: data.totalThoughts,
    nextThoughtNeeded: data.nextThoughtNeeded,
    isRevision: data.isRevision as boolean | undefined,
    revisesThought: data.revisesThought as number | undefined,
    branchFromThought: data.branchFromThought as number | undefined,
    branchId: data.branchId as string | undefined,
    needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
  };
}