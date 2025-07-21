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
        type: "integer",
        description: "Current thought number",
        minimum: 1,
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
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1,
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1,
      },
      branchId: {
        type: "string",
        description: "Branch identifier",
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed",
      },
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"],
  },
};