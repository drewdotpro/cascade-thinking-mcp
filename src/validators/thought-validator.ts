import { ThoughtData } from '../types/thought.js';

export function validateThoughtData(input: unknown): ThoughtData {
  if (!input || typeof input !== 'object') {
    throw new Error("Invalid thought: must be a string");
  }
  
  const data = input as Record<string, unknown>;

  if (!data.thought || typeof data.thought !== "string") {
    throw new Error("Invalid thought: must be a string");
  }
  if (!data.thoughtNumber || typeof data.thoughtNumber !== "string") {
    throw new Error("Invalid thoughtNumber: must be a string with S prefix (e.g., 'S1', 'S2')");
  }
  if (!/^[Ss]\d+$/.test(data.thoughtNumber)) {
    throw new Error("Invalid thoughtNumber: must match pattern S{n} or s{n} (e.g., 'S1', 's2', 'S3')");
  }
  if (data.totalThoughts === null || data.totalThoughts === undefined || typeof data.totalThoughts !== "number") {
    throw new Error("Invalid totalThoughts: must be a number");
  }
  if (data.totalThoughts < 1) {
    throw new Error("Invalid totalThoughts: must be at least 1");
  }
  if (typeof data.nextThoughtNeeded !== "boolean") {
    throw new Error("Invalid nextThoughtNeeded: must be a boolean");
  }

  // Validate optional reference fields (now strings with pattern)
  if (data.revisesThought !== undefined) {
    if (typeof data.revisesThought !== "string") {
      throw new Error("Invalid revisesThought: must be a string");
    }
    if (!/^[AaSs]\d+$/.test(data.revisesThought)) {
      throw new Error("Invalid revisesThought: must match pattern A{n} or S{n} (e.g., 'A47', 'S3')");
    }
  }
  if (data.branchFromThought !== undefined) {
    if (typeof data.branchFromThought !== "string") {
      throw new Error("Invalid branchFromThought: must be a string");
    }
    if (!/^[AaSs]\d+$/.test(data.branchFromThought)) {
      throw new Error("Invalid branchFromThought: must match pattern A{n} or S{n} (e.g., 'A23', 'S5')");
    }
  }

  // Validate optional string fields
  if (data.branchId !== undefined && typeof data.branchId !== "string") {
    throw new Error("Invalid branchId: must be a string");
  }
  if (data.branchDescription !== undefined && typeof data.branchDescription !== "string") {
    throw new Error("Invalid branchDescription: must be a string");
  }
  if (data.sequenceDescription !== undefined && typeof data.sequenceDescription !== "string") {
    throw new Error("Invalid sequenceDescription: must be a string");
  }
  if (data.toolSource !== undefined && typeof data.toolSource !== "string") {
    throw new Error("Invalid toolSource: must be a string");
  }
  if (data.switchToBranch !== undefined && typeof data.switchToBranch !== "string") {
    throw new Error("Invalid switchToBranch: must be a string");
  }

  // Validate optional boolean fields
  if (data.isRevision !== undefined && typeof data.isRevision !== "boolean") {
    throw new Error("Invalid isRevision: must be a boolean");
  }
  if (data.needsMoreThoughts !== undefined && typeof data.needsMoreThoughts !== "boolean") {
    throw new Error("Invalid needsMoreThoughts: must be a boolean");
  }
  if (data.startNewSequence !== undefined && typeof data.startNewSequence !== "boolean") {
    throw new Error("Invalid startNewSequence: must be a boolean");
  }
  if (data.isolatedContext !== undefined && typeof data.isolatedContext !== "boolean") {
    throw new Error("Invalid isolatedContext: must be a boolean");
  }
  
  // Validate recentThoughtsLimit
  if (data.recentThoughtsLimit !== undefined) {
    if (typeof data.recentThoughtsLimit !== 'number' || !Number.isInteger(data.recentThoughtsLimit)) {
      throw new Error('recentThoughtsLimit must be an integer');
    }
    if (data.recentThoughtsLimit < 0) {
      throw new Error('recentThoughtsLimit must be non-negative');
    }
    if (data.recentThoughtsLimit > 100) {
      throw new Error('recentThoughtsLimit must not exceed 100');
    }
  }
  
  // Validate responseMode
  if (data.responseMode !== undefined) {
    if (typeof data.responseMode !== 'string') {
      throw new Error('responseMode must be a string');
    }
    if (!['minimal', 'standard', 'verbose'].includes(data.responseMode)) {
      throw new Error('responseMode must be one of: minimal, standard, verbose');
    }
  }
  
  // Validate retrieveThoughts
  if (data.retrieveThoughts !== undefined) {
    /* c8 ignore start */
    if (typeof data.retrieveThoughts !== 'string') {
      throw new Error('retrieveThoughts must be a string');
    }
    /* c8 ignore stop */
    // Basic format validation
    const validFormats = [
      /^[AaSs]\d+-[AaSs]\d+$/,  // Range: A10-A15, S3-S7
      /^last:\d+$/,              // Last N: last:10
      /^[AaSs]\d+(,[AaSs]\d+)*$/ // Specific: A23,A45,S2
    ];
    const isValid = validFormats.some(format => format.test(data.retrieveThoughts as string));
    if (!isValid) {
      throw new Error('retrieveThoughts must be in format: "A10-A15", "S3-S7", "last:10", or "A23,A45,S2"');
    }
  }

  return {
    thought: data.thought,
    thoughtNumber: parseInt(data.thoughtNumber.substring(1), 10), // Extract number from S/s prefix
    totalThoughts: data.totalThoughts,
    nextThoughtNeeded: data.nextThoughtNeeded,
    isRevision: data.isRevision,
    revisesThought: data.revisesThought,
    branchFromThought: data.branchFromThought,
    branchId: data.branchId,
    branchDescription: data.branchDescription,
    needsMoreThoughts: data.needsMoreThoughts,
    startNewSequence: data.startNewSequence,
    sequenceDescription: data.sequenceDescription,
    toolSource: data.toolSource,
    isolatedContext: data.isolatedContext,
    switchToBranch: data.switchToBranch,
    recentThoughtsLimit: data.recentThoughtsLimit,
    retrieveThoughts: data.retrieveThoughts,
    responseMode: data.responseMode as 'minimal' | 'standard' | 'verbose' | undefined,
    // These will be set by the server
    absoluteThoughtNumber: 0, // Will be overwritten
    sequenceId: '' // Will be overwritten
  };
}