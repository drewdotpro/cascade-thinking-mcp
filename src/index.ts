#!/usr/bin/env node

import { runServer } from './server/setup.js';

// Only run server if this is the main module
/* c8 ignore start */
if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch((error: unknown) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
  });
}
/* c8 ignore stop */

// Export for testing
export { createServer, runServer } from './server/setup.js';
export { CascadeThinkingServer } from './services/cascade-thinking-server.js';
export { CASCADE_THINKING_TOOL } from './tools/cascade-thinking-tool.js';
export { validateThoughtData } from './validators/thought-validator.js';
export { formatThought } from './formatters/thought-formatter.js';
export type { ThoughtData } from './types/thought.js';