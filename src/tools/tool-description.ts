export const CASCADE_THINKING_TOOL_DESCRIPTION = `Dynamic problem-solving through structured cascade thinking with revisions and branches.

## Thought Reference Format
All thought numbers use prefix notation:
- S{n} = Sequence-relative position (e.g., "S1", "S2", "S3")
- A{n} = Absolute thought number (e.g., "A1", "A47", "A123")

Examples:
- thoughtNumber: "S1" (first thought in current sequence)
- revisesThought: "A47" (revises absolute thought 47)
- branchFromThought: "S2" (branches from thought 2 in current sequence)

Note: Prefixes are case-insensitive ("S1" = "s1", "A47" = "a47")

## When to Use
- Complex multi-step problems
- Tasks requiring revision or course correction
- Analysis where the full scope emerges gradually
- Planning that needs flexibility to branch or backtrack

## Core Concepts
1. **Sequences**: Groups of related thoughts, each starting at "S1"
2. **Dual Numbering**: 
   - Sequence position: "S1", "S2", "S3"... (resets in each sequence)
   - Absolute position: "A1", "A2", "A3"... (never resets, unique across all thoughts)
3. **Revisions**: Modify previous thoughts using their reference
4. **True Branching**: Creates separate sequences for exploring alternatives, each with its own numbering
5. **Branch Navigation**: Switch between branches to resume different lines of exploration
6. **State Persistence**: Thoughts persist across tool invocations - multiple tools can collaborate on the same thinking process
7. **Tool Transparency**: The tool tracks which tool created each thought and detects gaps when other tools have added thoughts
8. **Multi-Agent Support**: Multiple agents MUST use unique identifiers (e.g., "agent:1", "agent:2") to avoid confusion

## Required Parameters
- thought: Your current thinking step (string)
- thoughtNumber: Your position in current sequence (string: "S1", "S2", "S3"...)
- totalThoughts: Estimated thoughts needed (integer: 5, 10, etc.)
- nextThoughtNeeded: Continue thinking? (boolean: true/false)

## Optional Parameters
- startNewSequence: Begin new sequence (boolean: true/false)
- sequenceDescription: What this sequence explores (string)
- isRevision: Marks this as revising previous thought (boolean: true/false)
- revisesThought: Which thought to revise (string: "A47" or "S3")
- branchFromThought: Which thought to branch from (string: "A23" or "S2")
- branchId: Unique identifier for branch (string: "oauth-alt", "approach-2", etc.)
- branchDescription: What this branch explores (string)
- switchToBranch: Resume work on a specific branch (string: "main" or branch ID)
  * Cannot be combined with startNewSequence - use one or the other
- needsMoreThoughts: Signal when approaching end but need more (boolean: true/false)
  * Automatically expands totalThoughts by 50% or minimum 3 thoughts
  * Use when realizing more analysis is needed than initially estimated
- recentThoughtsLimit: How many recent thoughts to include in response (integer: 0-100, default: 5)
  * Useful for getting more context or reducing response size
  * Set to 0 to exclude recent thoughts entirely
- retrieveThoughts: Retrieve specific thoughts using patterns (string)
  * "last:N" - Get last N thoughts (e.g., "last:10")
  * "A10-A15" - Absolute range
  * "S3-S7" - Sequence range (current sequence only)
  * "A3,A17,S5" - Specific thoughts (comma-separated)
- toolSource: Identifies which tool is using cascade_thinking (string: "user", "agent:1", "task:auth", etc.)
  * MUST be unique for each agent/task instance when running multiple concurrently
  * Format: "type" for single instances, "type:identifier" for multiple instances
- isolatedContext: Use isolated state instead of shared global state (boolean: true/false)
- responseMode: Control response verbosity (string: "minimal", "standard", "verbose", default: "standard")
  * minimal: Just essentials (thoughtNumber, absolute, nextThoughtNeeded, totalThoughts, hint, expectedThoughtNumber)
  * standard: Balanced info (adds currentSequence, recentThoughts, currentBranch, gapInfo)
  * verbose: Full details (adds sequenceHistory, branches, statistics, toolSource info)
  * Auto-enhancement: minimal mode auto-includes critical context when on branches or doing revisions

## Response Fields
- thoughtNumber: Your sequence position (string: "S1", "S2", etc.)
- absoluteThoughtNumber: Unique ID across all thoughts (string: "A1", "A2", etc.)
- currentSequence: Active sequence details
- recentThoughts: Context from recent thinking
- hint: Current position guidance
- currentBranch: Which branch you're currently on (string: "main" or branch ID)
  * Always included in standard/verbose modes
  * In minimal mode: only shown when on non-main branch (auto-enhancement)
- availableBranches: List of all branches with details (when branches exist)
  * Includes: branchId, description, thoughtCount, fromThought
  * Only included when at least one branch exists
- sequenceHistory: All sequences (when verbose=true)
- branches: All branches (when verbose=true)
- gapInfo: Information about thoughts created by other tools (when gaps detected)
- toolSource: Which tool created this thought (when not "user")
- expectedThoughtNumber: Next expected thought number in sequence (string: "S4") when nextThoughtNeeded=true
- needsMoreThoughts: Boolean indicating if totalThoughts was expanded (when needsMoreThoughts=true was used)
- adjustedTotalThoughts: The new total after expansion (when needsMoreThoughts=true was used)
- recentThoughtsLimit: The limit used for recent thoughts (when different from default 5)

## Examples

Start first thought:
{ "thought": "Analyzing the authentication flow", "thoughtNumber": "S1", "totalThoughts": 5, "nextThoughtNeeded": true }

Continue in sequence:
{ "thought": "The token validation happens here", "thoughtNumber": "S2", "totalThoughts": 5, "nextThoughtNeeded": true }

Revise earlier thought in current sequence:
{ "thought": "Actually, validation is more complex", "thoughtNumber": "S3", "revisesThought": "S2", "isRevision": true, "totalThoughts": 5, "nextThoughtNeeded": true }

Branch to explore alternative (creates new sequence, resets to S1):
{ "thought": "What if we used OAuth instead?", "thoughtNumber": "S1", "branchFromThought": "S2", "branchId": "oauth-alternative", "branchDescription": "OAuth exploration", "totalThoughts": 6, "nextThoughtNeeded": true }

Switch to a different branch:
{ "thought": "Resuming API key approach", "thoughtNumber": "S3", "switchToBranch": "api-keys", "totalThoughts": 5, "nextThoughtNeeded": true }

Start new sequence:
{ "thought": "Now examining the database schema", "thoughtNumber": "S1", "startNewSequence": true, "sequenceDescription": "Database analysis", "totalThoughts": 4, "nextThoughtNeeded": true }

Reference absolute thought from any sequence:
{ "thought": "This connects to my earlier auth finding", "thoughtNumber": "S2", "revisesThought": "A7", "isRevision": true, "totalThoughts": 4, "nextThoughtNeeded": true }

Need more thoughts than estimated:
{ "thought": "This is more complex than expected, need to expand", "thoughtNumber": "S3", "totalThoughts": 3, "needsMoreThoughts": true, "nextThoughtNeeded": true }

Get more context with custom recent thoughts limit:
{ "thought": "Analyzing complex interactions", "thoughtNumber": "S10", "totalThoughts": 12, "nextThoughtNeeded": true, "recentThoughtsLimit": 10 }

Use minimal response mode for faster processing:
{ "thought": "Quick check on progress", "thoughtNumber": "S5", "totalThoughts": 8, "nextThoughtNeeded": true, "responseMode": "minimal" }

Get full details with verbose mode:
{ "thought": "Need complete context overview", "thoughtNumber": "S3", "totalThoughts": 5, "nextThoughtNeeded": false, "responseMode": "verbose" }

## Common Patterns

### 1. Revising Earlier Conclusions After New Discovery
You're analyzing a codebase and discover something that changes your earlier understanding:

Step 1: Initial analysis
{ "thought": "The auth system uses JWT tokens stored in localStorage", "thoughtNumber": "S1", "totalThoughts": 5, "nextThoughtNeeded": true }

Step 2-4: Continue exploration...

Step 5: Discovery that changes everything
{ "thought": "Found security audit - localStorage is vulnerable to XSS. Need to revise auth approach", "thoughtNumber": "S5", "totalThoughts": 5, "nextThoughtNeeded": true }

Step 6: Revise the earlier conclusion
{ "thought": "Actually, auth should use httpOnly cookies, not localStorage", "thoughtNumber": "S6", "revisesThought": "S1", "isRevision": true, "totalThoughts": 6, "nextThoughtNeeded": true }

### 2. Branching to Explore Alternatives
You need to compare different approaches without losing your main analysis:

Main analysis:
{ "thought": "Implementing user authentication with sessions", "thoughtNumber": "S3", "totalThoughts": 8, "nextThoughtNeeded": true }

Branch to explore OAuth:
{ "thought": "What if we used OAuth2 instead? Let me explore this approach", "thoughtNumber": "S1", "branchFromThought": "S3", "branchId": "oauth-exploration", "totalThoughts": 5, "nextThoughtNeeded": true }

Continue OAuth exploration:
{ "thought": "OAuth2 would require these providers...", "thoughtNumber": "S2", "totalThoughts": 5, "nextThoughtNeeded": true }

Return to main and apply insights:
{ "thought": "Based on OAuth exploration, sessions are simpler for our use case", "thoughtNumber": "S4", "switchToBranch": "main", "totalThoughts": 8, "nextThoughtNeeded": true }

### 3. Cross-Sequence Connections
Link insights across different investigation threads:

Sequence 1 - API Investigation:
{ "thought": "The API rate limits are 100 requests per minute", "thoughtNumber": "S3", "totalThoughts": 5, "nextThoughtNeeded": false }

Sequence 2 - Performance Analysis:
{ "thought": "Starting performance bottleneck investigation", "thoughtNumber": "S1", "startNewSequence": true, "sequenceDescription": "Performance analysis", "totalThoughts": 4, "nextThoughtNeeded": true }

{ "thought": "The UI makes 150 requests on dashboard load", "thoughtNumber": "S2", "totalThoughts": 4, "nextThoughtNeeded": true }

Connect back to API findings:
{ "thought": "This exceeds the API rate limit discovered earlier (A3: 100 req/min). That's our bottleneck!", "thoughtNumber": "S3", "revisesThought": "A3", "totalThoughts": 4, "nextThoughtNeeded": true }

## Quick Reference

### Most Common Operations
- **Start thinking**: thoughtNumber: "S1", totalThoughts: N, nextThoughtNeeded: true
- **Continue**: thoughtNumber: "S2", totalThoughts: N, nextThoughtNeeded: true
- **Revise**: revisesThought: "S2" or "A7", isRevision: true
- **Branch**: branchFromThought: "S3", branchId: "branch-name"
- **New topic**: startNewSequence: true, sequenceDescription: "New topic"
- **Switch branch**: switchToBranch: "branch-name" or "main"
- **Expand thoughts**: needsMoreThoughts: true (adds ~50% more)
- **More context**: recentThoughtsLimit: 10 (default 5)
- **Less noise**: responseMode: "minimal"
- **Full details**: responseMode: "verbose"

### Reference Format
- **S{n}**: Sequence-relative (S1, S2, S3...) - position in current sequence
- **A{n}**: Absolute (A1, A47, A123...) - unique across all thoughts
- Both are case-insensitive: "s1" = "S1", "a47" = "A47"

## Visual Flow Diagram

\`\`\`
Main Sequence (seq_1)              Branch: oauth-exploration (seq_2)
=====================              ==================================
S1/A1: Initial analysis     
S2/A2: Found auth system    
S3/A3: Session approach ---------> S1/A4: OAuth alternative?
                                   S2/A5: OAuth pros/cons
                                   S3/A6: OAuth complexity ❌
S4/A7: Continuing with sessions <------ (switchToBranch: "main")
S5/A8: Implementation details

New Sequence: Database Review (seq_3)
=====================================
S1/A9: Starting DB analysis  -----> Can reference any previous thought:
S2/A10: Found performance issue     revisesThought: "A3" (sessions)
S3/A11: Links to auth approach     branchFromThought: "A9" (new branch)
\`\`\`

## Anti-Patterns to Avoid

### ❌ Too Many Branches (Cognitive Overload)
**Problem**: Creating a branch for every small exploration
**Impact**: Loses track of which branch has what insights
**Better**: Use branches only for significant alternative approaches

### ❌ Deeply Nested Revisions
**Problem**: Revising a revision of a revision
**Impact**: Creates confusing thought chains
**Better**: Revise the original thought directly, or start fresh

### ❌ Not Using Sequences for Major Topic Shifts  
**Problem**: Continuing same sequence when switching from "auth" to "database" to "UI"
**Impact**: Mixes unrelated thoughts, hard to find insights later
**Better**: startNewSequence: true with clear sequenceDescription

### ❌ Overusing Absolute References
**Problem**: Always using A{n} references instead of S{n}
**Impact**: Harder to follow local context
**Better**: Use S{n} within same sequence, A{n} for cross-sequence

## State Persistence

**Important**: Thoughts persist across tool invocations in the same session. This enables:
- Multiple tools to collaborate on the same thinking process
- You to resume thinking after interruptions
- Other tools (like agents) to contribute thoughts

Use \`isolatedContext: true\` only when you need completely separate thinking state.`;
