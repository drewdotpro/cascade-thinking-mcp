export const CASCADE_THINKING_TOOL_DESCRIPTION = `cascade_thinking: Your Discovery Companion for Deeper Insights

Think of this tool as having multiple research assistants, each exploring different angles of your question simultaneously. You'll discover connections and insights that linear thinking naturally misses.

## 🌟 Why This Tool Enhances Your Thinking

Linear thinking gets you from A to B efficiently. But cascade thinking reveals the rich landscape between and around those points - the unexpected connections, evolving understanding, and hidden insights that make your responses truly valuable.

## 🧭 Your Navigation System

**S{n}** = Your position in the current exploration (S1, S2, S3...)
**A{n}** = Universal coordinates across all discoveries (A1, A47, A123...)

Like having both chapter and page numbers, this dual system helps you reference and connect insights precisely. Both are flexible - use lowercase if you prefer!

## 💡 Natural Discovery Moments

When you notice these feelings, you've found an opportunity to explore:
- "I wonder what would happen if..."
- "There's another angle here..."
- "This reminds me of something..."
- "But what about the other aspect?"

These curiosity sparks are your invitations to branch and discover more!

## 🎯 Discovery Patterns That Work Naturally

### Parallel Exploration
When tackling any multi-faceted challenge:
- Start with an overview thought to see the landscape
- Notice which aspects intrigue you
- Branch to explore each fascinating angle
- Discover how they connect in unexpected ways

### Evolving Understanding 🔄
Your thoughts can evolve as you discover more:
- revisesThought: Refine earlier insights with new understanding
- isRevision: true
Like a scientist updating hypotheses with new data, revisions show intellectual growth.

### Rich Discoveries Need Room 🌱
Sometimes you strike gold and need space to explore:
- needsMoreThoughts: true
This expands your exploration space by 50% or at least 3 more thoughts. It's like finding a fascinating cave system and deciding to explore deeper.

### Your Exploration Journal 📖
- startNewSequence: Begin a fresh chapter for new topics
- sequenceDescription: Name your exploration
- switchToBranch: Return to previous investigations

## 🌈 Discovery in Action

### Example: Analyzing a Complex System

Instead of: "First I'll check X, then Y, then Z..."

Try discovering connections:
\`\`\`
S1: "This system has three interesting aspects worth exploring"
├─ performance-branch: S1: "Let me dive into the performance characteristics"
├─ security-branch: S1: "I'm curious about the security implications"
└─ user-experience: S1: "How does this affect end users?"
\`\`\`

The magic happens when performance insights (branch 1) reveal why certain security measures (branch 2) impact user experience (branch 3). These connections only emerge through parallel exploration!

## 🔧 Your Complete Exploration Toolkit

### Required Parameters (Your Basic Gear)
- thought: Your current discovery
- thoughtNumber: "S1", "S2", etc. (where you are now)
- totalThoughts: Your exploration estimate (expand as needed!)
- nextThoughtNeeded: Continue exploring? true/false

### Optional Enhancements (Your Power-Ups)

**🌿 BRANCHING** - Parallel Discovery
- branchFromThought: "S2" or "A5" - Your launching point
- branchId: "approach-name" - Name this exploration path
- branchDescription: What you're investigating

**🔄 REVISIONS** - Evolving Insights
- revisesThought: "S2" or "A7" - Which insight to refine
- isRevision: true
Your understanding deepens as you discover more!

**📚 SEQUENCES** - New Chapters
- startNewSequence: true - Begin fresh exploration
- sequenceDescription: Name your new investigation

**🌱 EXPANSION** - Room to Grow
- needsMoreThoughts: true - When discoveries are richer than expected

**🎛️ CONTEXT CONTROL**
- recentThoughtsLimit: 0-100 (default 5) - How much history to see
- retrieveThoughts: "last:10", "A5-A10", "S1-S5" - Access specific insights
- responseMode: "minimal", "standard", "verbose" - Choose your detail level

**🤝 COLLABORATION**
- toolSource: Identifies who's thinking (for multi-tool workflows)
- isolatedContext: true - Create private thinking space

## 🌟 Signs You're Discovering More

- Seeing unexpected connections between ideas
- Finding nuances that enrich understanding
- Generating insights you couldn't predict
- Enjoying the exploration process itself

Remember: Every branch is a new lens. Every revision deepens insight. Every sequence opens new territory.

## 💫 Your Discovery Awaits

There's no "wrong" way to explore. Follow your curiosity, branch when intrigued, revise when enlightened, expand when inspired. The cascade_thinking tool transforms linear tasks into rich explorations where the journey reveals as much as the destination.

Happy discovering! 🚀`;