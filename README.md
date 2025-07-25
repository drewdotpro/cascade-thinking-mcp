![Cascade Thinking MCP Server banner](https://raw.githubusercontent.com/drewdotpro/cascade-thinking-mcp/main/assets/banner.jpg)

# Cascade Thinking MCP Server

**Transform linear problem-solving into rich, multi-dimensional exploration with true branching and intelligent thought management.**

[![npm version](https://img.shields.io/npm/v/cascade-thinking-mcp?style=flat-square)](https://www.npmjs.com/package/cascade-thinking-mcp)
[![license](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](LICENSE)
![status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![type](https://img.shields.io/badge/type-MCP_Server-blue?style=flat-square)

## ⚡ Why Cascade Thinking?

Traditional problem-solving tools break under ambiguity.  
**Cascade Thinking MCP** lets you _branch_, _revise_, and _expand_ your reasoning process without losing structure.

✅ **Explore alternatives** with true branching that creates separate sequences  
✅ **Revise previous thoughts** with full traceability via dual numbering  
✅ **Maintain context** across agents and tools with persistent state  
✅ **Expand dynamically** when you discover complexity mid-exploration  

## 🚀 Quick Start

### Install in 10 seconds

**VS Code**:
For quick installation, click one of the installation buttons below...

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=cascade-thinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22cascade-thinking-mcp%22%5D%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=cascade-thinking&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22cascade-thinking-mcp%22%5D%7D&quality=insiders)

[![Install with Docker in VS Code](https://img.shields.io/badge/VS_Code-Docker-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=cascade-thinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fcascade-thinking%22%5D%7D) [![Install with Docker in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Docker-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=cascade-thinking&config=%7B%22command%22%3A%22docker%22%2C%22args%22%3A%5B%22run%22%2C%22--rm%22%2C%22-i%22%2C%22mcp%2Fcascade-thinking%22%5D%7D&quality=insiders)

**Claude Desktop / Claude Code**: See [Configuration](#configuration) for setup instructions.

## 💬 Using the MCP Server

Once installed, prompt Claude to use the cascade thinking tool for complex tasks:

> "You have access to the cascade thinking MCP for complex tasks like this. Use its full features including branching, revision, and dynamic expansion to explore this problem thoroughly."

The tool works best when you:
- 🎯 **Be explicit** - Ask Claude to use cascade thinking for multi-step analysis
- 🌿 **Encourage branching** - Suggest exploring alternatives in parallel
- 🔄 **Allow revisions** - Let Claude update thoughts as understanding evolves
- 📈 **Enable expansion** - Claude can use `needsMoreThoughts` when discovering complexity

**Example prompts:**
- "Use cascade thinking to analyze these authentication options, branching to explore each approach"
- "Think through this step-by-step with cascade thinking, revising your understanding as you go"
- "Explore this problem with cascade thinking, creating branches for different solutions"

## 🧠 How It Works

> **Transform linear thinking into multi-dimensional exploration**

```
Main Path:    S1/A1 ─→ S2/A2 ─→ S3/A3 ─→ S4/A7
                         │         │
                         ↓         ↓
Branch 1:          S1/A4 ─→ S2/A5  │
                              │    │
                              ↓    │
Sub-branch:              S1/A6     │
                                   │
Branch 2:                     S1/A8 ─→ S2/A9
```

**The magic:** Each thought has dual coordinates
- `S{n}` = Position in current sequence (resets per branch)
- `A{n}` = Absolute position across all thoughts (never resets)

This enables:
- ✨ **Precise references**: `revisesThought: "A23"`
- 🌿 **Context-aware branching**: `branchFromThought: "S2"`
- 🚀 **Instant navigation**: `switchToBranch: "oauth-exploration"`

## 🧩 Key Features

### 🌿 True Branching
Create separate exploration paths that automatically start new sequences. Each branch maintains its own context while preserving connections to the parent.

### 🔄 Thought Revision
Update earlier insights as understanding evolves. Full revision history with both S{n} and A{n} references.

### 💡 Dynamic Expansion
Realize mid-exploration that you need more depth? Use `needsMoreThoughts` to expand your thinking space by 50% or at least 3 more thoughts.

### 🔗 Multi-Tool Integration
Persistent state across tools with `toolSource` tracking. Share context between agents or isolate with `isolatedContext`.

### 📊 Flexible Output
Control verbosity with `responseMode`: minimal for speed, standard for balance, verbose for debugging.

## 💫 See It In Action

Start exploring:
```json
{
  "thought": "Analyzing authentication options for our API",
  "thoughtNumber": "S1",
  "totalThoughts": 3,
  "nextThoughtNeeded": true
}
```

Branch to explore OAuth:
```json
{
  "thought": "Let me explore OAuth2 implementation",
  "thoughtNumber": "S1",
  "branchFromThought": "A1",
  "branchId": "oauth-exploration",
  "totalThoughts": 4,
  "nextThoughtNeeded": true
}
```

Later, switch back and try another approach:
```json
{
  "thought": "Now exploring JWT tokens",
  "switchToBranch": "main",
  "thoughtNumber": "S2",
  "totalThoughts": 3,
  "nextThoughtNeeded": true
}
```

---

## 📖 Complete Documentation

### Tool Reference: cascade_thinking

Facilitates a detailed, step-by-step thinking process for problem-solving and analysis with a unique dual numbering system.

**Inputs:**
- `thought` (string): The current thinking step
- `nextThoughtNeeded` (boolean): Whether another thought step is needed
- `thoughtNumber` (string): Current position in sequence (e.g., "S1", "S2", "S3")
- `totalThoughts` (integer): Estimated total thoughts needed
- `isRevision` (boolean, optional): Whether this revises previous thinking
- `revisesThought` (string, optional): Which thought to revise (e.g., "A47" or "S3")
- `branchFromThought` (string, optional): Which thought to branch from (e.g., "A23" or "S2")
- `branchId` (string, optional): Branch identifier
- `branchDescription` (string, optional): What this branch explores
- `needsMoreThoughts` (boolean, optional): Dynamically expand totalThoughts when realizing more analysis is needed
- `startNewSequence` (boolean, optional): Begin a new sequence
- `sequenceDescription` (string, optional): What this sequence explores
- `toolSource` (string, optional): Identifies which tool is using cascade_thinking (e.g., 'user', 'agent', 'task')
- `isolatedContext` (boolean, optional): Use isolated state for this tool instead of shared global state
- `switchToBranch` (string, optional): Resume work on a specific branch by its ID (or "main" for the main sequence)
- `recentThoughtsLimit` (integer, optional): How many recent thoughts to include in response (default: 5, max: 100)
- `responseMode` (string, optional): Control response verbosity: 'minimal', 'standard' (default), or 'verbose'

## Dual Numbering System

The cascade thinking tool uses a unique dual numbering system with explicit prefixes:

- **S{n}** = Sequence-relative position (e.g., "S1", "S2", "S3")
  - Resets to "S1" at the start of each new sequence
  - Represents your position within the current sequence of thoughts
  
- **A{n}** = Absolute thought number (e.g., "A1", "A47", "A123")
  - Never resets, continuously increments
  - Unique identifier across all thoughts in all sequences

This system eliminates ambiguity when referencing thoughts. For example:
- `revisesThought: "A47"` - Revises the 47th thought overall
- `revisesThought: "S2"` - Revises the 2nd thought in the current sequence
- `branchFromThought: "A23"` - Branches from the 23rd thought overall
- `branchFromThought: "S1"` - Branches from the 1st thought in the current sequence

Note: Prefixes are case-insensitive ("S1" = "s1", "A47" = "a47")

## Dynamic Thought Expansion

The `needsMoreThoughts` feature allows you to dynamically expand your estimated totalThoughts when you realize more analysis is needed than initially planned.

### How It Works

When you set `needsMoreThoughts: true`, the tool:
1. **Increases totalThoughts** by 50% or a minimum of 3 thoughts (whichever is larger)
2. **Shows visual indicators** including a ⚡ emoji and "[Expanding thoughts...]" text
3. **Updates the response** with `needsMoreThoughts: true` and `adjustedTotalThoughts` showing the new total
4. **Adds hint text** "[Total thoughts expanded]" to indicate the expansion

### Example Usage

Initial estimate was 3 thoughts:
```json
{ "thought": "Starting analysis", "thoughtNumber": "S1", "totalThoughts": 3, "nextThoughtNeeded": true }
```

Continuing:
```json
{ "thought": "This is getting complex", "thoughtNumber": "S2", "totalThoughts": 3, "nextThoughtNeeded": true }
```

Realize you need more thoughts (expands to S3 + 3 = 6 total):
```json
{
  "thought": "I need to explore this deeper than expected",
  "thoughtNumber": "S3",
  "totalThoughts": 3,
  "needsMoreThoughts": true,
  "nextThoughtNeeded": true
}
```

Continue with expanded total:
```json
{ "thought": "Now I can continue deeper analysis", "thoughtNumber": "S4", "totalThoughts": 6, "nextThoughtNeeded": true }
```

### Benefits

- **Flexible Planning**: Don't worry about getting the initial estimate perfect
- **Natural Flow**: Expand when you naturally realize more analysis is needed
- **Clear Feedback**: Visual and response indicators show when expansion occurred
- **Smart Calculation**: Automatically calculates appropriate expansion based on current progress

## Enhanced Recent Thoughts Context

The tool provides multiple ways to access and review previous thoughts, helping you maintain context and navigate your reasoning history effectively.

### Configurable Recent Thoughts

The `recentThoughtsLimit` parameter allows you to control how many recent thoughts are included in each response.

**Default Behavior**: By default, the tool includes the 5 most recent thoughts in every response.

Get more context (show last 10 thoughts):
```json
{
  "thought": "Need to see more history",
  "thoughtNumber": "S10",
  "totalThoughts": 15,
  "nextThoughtNeeded": true,
  "recentThoughtsLimit": 10
}
```

Reduce response size (show only the most recent thought):
```json
{
  "thought": "Working with limited bandwidth",
  "thoughtNumber": "S5",
  "totalThoughts": 5,
  "nextThoughtNeeded": false,
  "recentThoughtsLimit": 1
}
```

Exclude recent thoughts entirely:
```json
{
  "thought": "Don't need context",
  "thoughtNumber": "S3",
  "totalThoughts": 3,
  "nextThoughtNeeded": false,
  "recentThoughtsLimit": 0
}
```

**Limits**: 0 to 100 thoughts (must be an integer)

### Retrieve Specific Thoughts

The `retrieveThoughts` parameter allows you to fetch specific thoughts using various patterns:

Retrieve last N thoughts:
```json
{
  "thought": "Review recent conclusions",
  "thoughtNumber": "S15",
  "totalThoughts": 20,
  "nextThoughtNeeded": true,
  "retrieveThoughts": "last:8"
}
```

Retrieve absolute range (A5 through A10):
```json
{
  "thought": "Check early analysis",
  "thoughtNumber": "S20",
  "totalThoughts": 25,
  "nextThoughtNeeded": true,
  "retrieveThoughts": "A5-A10"
}
```

Retrieve sequence range from current sequence (S10 through S15):
```json
{
  "thought": "Review middle section",
  "thoughtNumber": "S30",
  "totalThoughts": 35,
  "nextThoughtNeeded": true,
  "retrieveThoughts": "S10-S15"
}
```

Retrieve specific thoughts:
```json
{
  "thought": "Check key decisions",
  "thoughtNumber": "S40",
  "totalThoughts": 45,
  "nextThoughtNeeded": false,
  "retrieveThoughts": "A3,A17,A29"
}
```

**Supported Formats**:
- `last:N` - Get the last N thoughts
- `A10-A15` - Absolute range
- `S3-S7` - Sequence range (current sequence only)
- `A3,A17,S5` - Specific thoughts (comma-separated)

### Automatic Sequence Summaries

For long sequences (more than 10 thoughts), the tool automatically generates summaries in standard and verbose response modes:

```json
// Response includes sequence summary
{
  "thoughtNumber": "S15",
  "absoluteThoughtNumber": "A47",
  "totalThoughts": 20,
  "nextThoughtNeeded": true,
  "currentSequence": {
    "id": "seq_1",
    "summary": "Analyzing authentication flow",
    "thoughtsInSequence": 15
  },
  "sequenceSummary": "Key revisions: 2 thoughts revised | Branches created: oauth-flow, jwt-impl | Expanded thinking 1 time(s) | Progress: 75% (15/20)",
  "recentThoughts": [/* ... */]
}
```

**Summary includes**:
- Number of revisions made
- Branches created from this sequence
- Times thinking was expanded
- Current progress percentage

### Use Cases

- **Deep Analysis**: Increase recent thoughts limit or retrieve specific ranges when you need more context
- **Performance**: Reduce limits when working with bandwidth constraints
- **Focused Review**: Retrieve specific thoughts for targeted analysis
- **Progress Tracking**: Use sequence summaries to understand overall progress
- **Debugging**: Set high limits or retrieve full ranges to see complete thinking trails

## Response Verbosity Control

The `responseMode` parameter allows you to control how much information is included in responses, helping manage cognitive load and optimize for different use cases.

### Response Modes

1. **minimal** - Just the essentials
   - Core fields: thoughtNumber, absoluteThoughtNumber, nextThoughtNeeded, totalThoughts, hint, expectedThoughtNumber
   - Auto-enhancement: Automatically includes critical context when on branches or doing revisions
   - Use case: Fast processing, reduced cognitive load, API constraints

2. **standard** (default) - Balanced information
   - Includes: All minimal fields + currentSequence, recentThoughts, currentBranch, gapInfo
   - Use case: Normal reasoning tasks with good context/performance balance

3. **verbose** - Complete details  
   - Includes: All standard fields + sequenceHistory, branches, statistics, toolSource info
   - Use case: Debugging, complex navigation, full context overview

### Examples

Minimal mode for quick checks:
```json
{
  "thought": "Quick status check",
  "thoughtNumber": "S5",
  "totalThoughts": 8,
  "nextThoughtNeeded": true,
  "responseMode": "minimal"
}
```

Standard mode (default - no need to specify):
```json
{
  "thought": "Continuing analysis",
  "thoughtNumber": "S6",
  "totalThoughts": 8,
  "nextThoughtNeeded": true
}
```

Verbose mode for full context:
```json
{
  "thought": "Need complete overview",
  "thoughtNumber": "S7",
  "totalThoughts": 8,
  "nextThoughtNeeded": false,
  "responseMode": "verbose"
}
```

### Auto-Enhancement Feature

When using minimal mode, the tool automatically includes critical context in these situations:
- When you're on a branch (not main)
- When performing revisions
- When creating branches

This ensures you never lose important navigational context even in minimal mode.

## True Branching

The cascade thinking tool implements **true branching** where each branch creates a separate exploration path with its own sequence:

### How Branching Works

When you use `branchFromThought` with a `branchId`, the tool:
1. **Creates a new sequence** automatically - no need for `startNewSequence`
2. **Resets numbering to S1** in the new branch sequence
3. **Copies relevant context** from the parent sequence (up to 10 thoughts leading to the branch point)
4. **Tracks the branch relationship** for navigation and visualization

### Branch Navigation

Use the `switchToBranch` parameter to navigate between branches:
- `switchToBranch: "main"` - Return to the main (original) sequence
- `switchToBranch: "feature-x"` - Switch to a specific branch by its ID

**New Feature**: When using `switchToBranch`, the `thoughtNumber` parameter is now optional. The tool will automatically calculate the correct next thought number for the target branch.

The response includes:
- `currentBranch` - Shows which branch you're currently on
- `availableBranches` - Lists all branches with their descriptions, thought counts, and expected next thought number

### Example Branching Workflow

```json
// Main exploration
{ "thought": "Analyzing authentication options", "thoughtNumber": "S1", ... }

// Branch to explore OAuth
{ 
  "thought": "Let me explore OAuth specifically",
  "thoughtNumber": "S1",  // Resets to S1 in new sequence
  "branchFromThought": "A1",
  "branchId": "oauth-exploration",
  "branchDescription": "Deep dive into OAuth implementation"
}

// Continue in OAuth branch
{ "thought": "OAuth would require...", "thoughtNumber": "S2", ... }

// Switch back to main without specifying thoughtNumber
{ 
  "thought": "Now let me consider API keys",
  "totalThoughts": 3,
  "nextThoughtNeeded": true,
  "switchToBranch": "main"
  // thoughtNumber is automatically calculated as S2
}

// Create another branch
{
  "thought": "Exploring API key approach",
  "thoughtNumber": "S1",  // New sequence again
  "branchFromThought": "A1",
  "branchId": "api-keys"
}
```

### Benefits of True Branching

- **Clean separation** - Each branch is its own sequence with independent numbering
- **Context preservation** - Branch context includes relevant history from parent
- **Easy navigation** - Switch between branches without losing your place
- **Clear visualization** - Branch information shown in responses and hints
- **Parallel exploration** - Explore multiple approaches without interference

## Branch State Clarity

The tool provides clear visibility into your current branch state and available branches at all times:

### Visual Branch Indicators

- **🌿 Branch Symbol**: Appears in formatted output for all thoughts on a branch
- **💭 Thought Symbol**: Regular thoughts on the main branch
- **Branch Context**: Shows "(on branch branch-name)" for branch thoughts

### Branch Information in Responses

#### currentBranch Field
- Always shows which branch you're on: "main" or the branch ID
- In standard/verbose modes: Always included
- In minimal mode: Only shown when on non-main branch (auto-enhancement)

#### availableBranches Field
- Lists all branches (including main) with:
  - `branchId`: The branch identifier (or "main" for the main sequence)
  - `description`: Optional branch description
  - `thoughtCount`: Number of thoughts on that branch
  - `fromThought`: Where the branch originated (e.g., "A23")
  - `expectedThoughtNumber`: The next thought number if you switch to this branch (e.g., "S3")
- Always included in standard/verbose modes when branches exist

### Branch-Aware Hints

Hints dynamically show branch context:
- When on main: `"Continuing [sequence summary]"`
- When on branch: `"On branch 'branch-id' (description) with N thoughts - [sequence summary]"`
- Branch list: `"Branches: auth-flow(3), error-handling(2)"`

### Example Branch State Response

```json
{
  "thoughtNumber": "S3",
  "currentBranch": "auth-exploration",
  "availableBranches": [
    {
      "branchId": "main",
      "description": "Main sequence",
      "thoughtCount": 5,
      "fromThought": "A1",
      "expectedThoughtNumber": "S6"
    },
    {
      "branchId": "auth-exploration",
      "description": "OAuth2 implementation",
      "thoughtCount": 3,
      "fromThought": "A5",
      "expectedThoughtNumber": "S4"
    },
    {
      "branchId": "api-keys",
      "description": "Simple API key auth",
      "thoughtCount": 2,
      "fromThought": "A5",
      "expectedThoughtNumber": "S3"
    }
  ],
  "hint": "On branch 'auth-exploration' (OAuth2 implementation) with 3 thoughts - Authentication analysis | Branches: auth-exploration(3), api-keys(2)"
}
```

## State Persistence and Tool Interoperability

The cascade_thinking tool maintains persistent state across invocations, enabling multiple tools to collaborate on the same thinking process. This creates a **shared thinking context** by default.

### How State Persistence Works

- **Shared Global State**: All calls to cascade_thinking share the same thought history and sequences by default
- **Continuous Numbering**: Absolute thought numbers (A{n}) increment continuously across all invocations
- **Tool Transparency**: The tool tracks which tool created each thought via the `toolSource` parameter
- **Gap Detection**: When you return to cascade_thinking after other tools have used it, you'll see information about any intermediate thoughts created

### Example Workflow

1. **User** creates thought A1: "Let me analyze this problem"
2. **Agent tool** (internally) creates thoughts A2-A5 while researching
3. **User** creates thought A6: "Based on the analysis..."
   - Response includes: `gapInfo` showing 4 thoughts were created by 'agent'
   - Hint includes: "[Note: Some thoughts created by other tools]"

### Using Isolated Context

If you need separate state for a specific tool, use `isolatedContext: true`:

```json
{
  "thought": "Private analysis for this tool only",
  "toolSource": "specialized_agent",
  "isolatedContext": true,
  ...
}
```

This creates a completely separate thinking context that won't interfere with the shared global state.

### Multi-Agent Usage

When spawning multiple agents or tasks, **you MUST provide unique identifiers** to distinguish between different instances. Without unique identification, thoughts from different agents will be interleaved in confusing ways.

**Correct usage:**
```json
// Each agent MUST have a unique identifier
{ "toolSource": "agent:auth-researcher", ... }
{ "toolSource": "agent:db-analyzer", ... }
{ "toolSource": "task:validator-1", ... }
{ "toolSource": "task:validator-2", ... }
```

**Incorrect usage:**
```json
// DON'T DO THIS - multiple agents with same identifier
{ "toolSource": "agent", ... }  // Agent A
{ "toolSource": "agent", ... }  // Agent B - will be confused with Agent A!
```

### Benefits of Shared Context

- **Collaborative Problem Solving**: Multiple tools can contribute to the same analysis
- **Context Preservation**: No loss of context when switching between tools
- **Transparent History**: You can see the complete thinking process, including which tool contributed what
- **Flexible Architecture**: Tools can choose between shared or isolated contexts based on their needs

## Cross-Sequence Reference Guide

The cascade thinking tool's dual numbering system enables powerful cross-sequence operations. Understanding how to leverage these references is key to effective use.

### Reference Types

- **S{n}** - Sequence-relative position (S1, S2, S3...)
  - Best for: References within the same sequence
  - Resets with each new sequence
  - More intuitive for local context

- **A{n}** - Absolute thought number (A1, A47, A123...)
  - Best for: Cross-sequence references
  - Never resets, globally unique
  - Essential for connecting insights across sequences

### Common Cross-Sequence Patterns

#### 1. Connecting Discoveries Across Investigations

When you discover something in one investigation that relates to another:

```json
// Sequence 1: Security Analysis
{ "thought": "Found XSS vulnerability in user input handling", "thoughtNumber": "S4", "totalThoughts": 6, "nextThoughtNeeded": false }

// Sequence 2: Code Review (started later)
{ "thought": "Reviewing input validation functions", "thoughtNumber": "S1", "startNewSequence": true, "sequenceDescription": "Code review", "totalThoughts": 5, "nextThoughtNeeded": true }

// Connect back to security finding
{ "thought": "This validation gap directly relates to the XSS vulnerability (A4)", "thoughtNumber": "S2", "revisesThought": "A4", "isRevision": true, "totalThoughts": 5, "nextThoughtNeeded": true }
```

#### 2. Building on Previous Conclusions

Reference and extend earlier work without losing context:

```json
// Earlier conclusion (A15)
{ "thought": "Database queries are the performance bottleneck", "thoughtNumber": "S5", "totalThoughts": 5, "nextThoughtNeeded": false }

// New sequence building on this
{ "thought": "Starting optimization based on bottleneck analysis (A15)", "thoughtNumber": "S1", "startNewSequence": true, "sequenceDescription": "Performance optimization", "totalThoughts": 8, "nextThoughtNeeded": true }
```

#### 3. Comparing Branch Outcomes

After exploring alternatives, reference insights from different branches:

```json
// After exploring multiple authentication approaches
{ "thought": "Comparing the three approaches: Sessions (A3-A8), OAuth (A9-A14), and JWT (A15-A19), sessions offer the best balance", "thoughtNumber": "S1", "startNewSequence": true, "sequenceDescription": "Final recommendation", "totalThoughts": 3, "nextThoughtNeeded": true }
```

### Best Practices

1. **Use S{n} for local references** - When referring to thoughts in the same sequence
2. **Use A{n} for cross-sequence** - When connecting insights across different investigations
3. **Document connections explicitly** - Mention the referenced thought's context in your new thought
4. **Leverage revision for updates** - Use `revisesThought` to formally update earlier conclusions
5. **Branch for alternatives** - Don't revise when exploring; branch instead

### Anti-Patterns to Avoid

- **❌ Long revision chains** - Revising revisions creates confusing dependency chains
- **❌ Overusing absolute refs** - Makes local context harder to follow
- **❌ Implicit connections** - Always explicitly state what you're referencing and why
- **❌ Mixed contexts in one sequence** - Use new sequences for new topics

## Usage

The Cascade Thinking tool is designed for:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

## Configuration

### Usage with Claude Desktop / Claude Code

Add this to your `claude_desktop_config.json` (for Claude desktop) or `.mcp.json` in your project folder (for Claude Code):

#### npx

```json
{
  "mcpServers": {
    "cascade-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "cascade-thinking-mcp"
      ]
    }
  }
}
```

#### docker

```json
{
  "mcpServers": {
    "cascade-thinking": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp/cascade-thinking"
      ]
    }
  }
}
```

To disable logging of thought information set env var: `DISABLE_THOUGHT_LOGGING` to `true`.

### Usage with VS Code

For manual installation, add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open Settings (JSON)`.

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.

For NPX installation:

```json
{
  "mcp": {
    "servers": {
      "cascade-thinking": {
        "command": "npx",
        "args": [
          "-y",
          "cascade-thinking-mcp"
        ]
      }
    }
  }
}
```

For Docker installation:

```json
{
  "mcp": {
    "servers": {
      "cascade-thinking": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "mcp/cascade-thinking"
        ]
      }
    }
  }
}
```

## Building

Docker:

```bash
docker build -t mcp/cascade-thinking -f Dockerfile .
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

## Acknowledgments

This project is based on the Sequential Thinking MCP Server by Anthropic, PBC, available at [@modelcontextprotocol/server-sequential-thinking](https://github.com/modelcontextprotocol/servers).