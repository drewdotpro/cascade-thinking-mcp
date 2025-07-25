export interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  absoluteThoughtNumber: number;
  sequenceId: string;
  totalThoughts: number;
  isRevision?: boolean;
  revisesThought?: number | string;  // String in input, number after resolution
  branchFromThought?: number | string;  // String in input, number after resolution
  branchId?: string;
  branchDescription?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
  startNewSequence?: boolean;
  sequenceDescription?: string;
  toolSource?: string;  // Which tool created this thought (e.g., "user", "agent", "task")
  isolatedContext?: boolean;  // Whether to use isolated state for this tool
  switchToBranch?: string;  // Resume work on a specific branch
  recentThoughtsLimit?: number;  // How many recent thoughts to include in response (default: 5)
  retrieveThoughts?: string;  // Retrieve specific thoughts (e.g., "A10-A15", "S3-S7", "last:10", "A23,A45,S2")
  responseMode?: 'minimal' | 'standard' | 'verbose';  // Control response verbosity (default: 'standard')
  currentBranch?: string;  // Current branch ID (for formatting)
}

export interface SequenceMetadata {
  id: string;
  summary: string;
  startedAt: string;
  absoluteStartThought: number;
  totalThoughts: number;
  branches: string[];
  branchContext?: RecentThought[];  // Context copied from parent sequence
  parentBranchId?: string;  // The branch this sequence belongs to
}

export interface RecentThought {
  absolute: string;  // A-prefixed (e.g., "A47")
  content: string;
}

export interface GapInfo {
  hasGap: boolean;
  gapSize: number;
  explanation?: string;
  createdBy?: string[];  // Which tools created the gap
}

export interface CascadeThinkingResponse {
  thoughtNumber: string;  // S-prefixed (e.g., "S3")
  absoluteThoughtNumber: string;  // A-prefixed (e.g., "A47")
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  hint?: string;
  currentSequence?: {
    id: string;
    summary: string;
    thoughtsInSequence: number;
  };
  recentThoughts?: RecentThought[];
  totalSequences?: number;
  totalThoughtsAllTime?: number;
  activeBranches?: number;
  sequenceHistory?: SequenceMetadata[];
  branches?: Record<string, BranchMetadata>;
  gapInfo?: GapInfo;  // Information about gaps in thought numbering
  toolSource?: string;  // Which tool created this thought
  expectedThoughtNumber?: string;  // The next expected thought number in sequence (e.g., "S4")
  currentBranch?: string;  // Current branch ID or "main" if not on a branch
  availableBranches?: {  // List of branches with summary info
    branchId: string;
    description?: string;
    thoughtCount: number;
    fromThought: string;  // A-prefixed reference
  }[];
  needsMoreThoughts?: boolean;  // Indicates if totalThoughts was increased due to needsMoreThoughts
  adjustedTotalThoughts?: number;  // The new total after adjustment (if needsMoreThoughts was true)
  recentThoughtsLimit?: number;  // The limit used for recent thoughts (if different from default 5)
  sequenceSummary?: string;  // Automatic summary for sequences > 10 thoughts (standard/verbose modes)
  retrievedThoughts?: RecentThought[];  // Thoughts retrieved via retrieveThoughts parameter
  branchTree?: string;  // Visual tree structure of branches (verbose mode only)
}

export interface BranchMetadata {
  branchId: string;
  fromSequenceId: string;
  fromAbsoluteThought: number;
  fromSequenceThought: number;
  currentSequenceId: string;
  createdAt: string;
  description?: string;
  thoughtsInBranch: number;
}