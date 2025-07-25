import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CASCADE_THINKING_TOOL_DESCRIPTION } from './tool-description.js';

export const CASCADE_THINKING_TOOL: Tool = {
  name: "cascade_thinking",
  description: CASCADE_THINKING_TOOL_DESCRIPTION,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step",
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed",
      },
      thoughtNumber: {
        type: "string",
        description: "Current thought number with S prefix (e.g., 'S1', 'S2', 'S3'). Optional when switchToBranch is provided - will be auto-calculated.",
        pattern: "^S\\d+$",
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed",
        minimum: 1,
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking",
      },
      revisesThought: {
        type: "string",
        description: "Reference to revise: A{n} for absolute, S{n} for sequence-relative (e.g., 'A47', 'S3')",
        pattern: "^[AaSs]\\d+$",
      },
      branchFromThought: {
        type: "string",
        description: "Reference to branch from: A{n} for absolute, S{n} for sequence-relative (e.g., 'A23', 'S5')",
        pattern: "^[AaSs]\\d+$",
      },
      branchId: {
        type: "string",
        description: "Branch identifier",
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed",
      },
      startNewSequence: {
        type: "boolean",
        description: "Explicitly start a new thinking sequence",
      },
      sequenceDescription: {
        type: "string",
        description: "Description of what this sequence will explore",
      },
      branchDescription: {
        type: "string",
        description: "Description of this branch's purpose",
      },
      toolSource: {
        type: "string",
        description: "Identifies which tool is using cascade_thinking (e.g., 'user', 'agent', 'task')",
      },
      isolatedContext: {
        type: "boolean",
        description: "Use isolated state for this tool instead of shared global state",
      },
      switchToBranch: {
        type: "string",
        description: "Resume work on a specific branch by its ID",
      },
      recentThoughtsLimit: {
        type: "integer",
        description: "How many recent thoughts to include in response (default: 5, max: 100)",
        minimum: 0,
        maximum: 100,
      },
      retrieveThoughts: {
        type: "string",
        description: "Retrieve specific thoughts: 'A10-A15' (absolute range), 'S3-S7' (sequence range), 'last:10' (last N), 'A23,A45,S2' (specific thoughts)",
        pattern: "^([AaSs]\\d+-[AaSs]\\d+|last:\\d+|[AaSs]\\d+(,[AaSs]\\d+)*)$",
      },
      responseMode: {
        type: "string",
        description: "Control response verbosity: minimal (essentials only), standard (default, balanced), verbose (full details)",
        enum: ["minimal", "standard", "verbose"],
      },
    },
    required: ["thought", "nextThoughtNeeded", "totalThoughts"],
  },
};