import { ThoughtData, SequenceMetadata, BranchMetadata, CascadeThinkingResponse, RecentThought } from '../types/thought.js';
import { validateThoughtData } from '../validators/thought-validator.js';
import { formatThought } from '../formatters/thought-formatter.js';

export class CascadeThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private sequences: Record<string, SequenceMetadata> = {};
  private branches: Record<string, BranchMetadata> = {};
  private currentSequenceId: string | null = null;
  private absoluteThoughtCounter = 0;
  private disableThoughtLogging: boolean;
  private sequenceCounter = 0;
  private lastUserThoughtNumber = 0;  // Track last thought number shown to user
  private isolatedStates = new Map<string, CascadeThinkingServer>();
  private sequenceThoughtCounters: Record<string, number> = {};  // Track thought count per sequence

  constructor() {
    this.disableThoughtLogging =
      (process.env.DISABLE_THOUGHT_LOGGING ?? "").toLowerCase() === "true";
  }

  private generateSequenceId(): string {
    this.sequenceCounter++;
    return `seq_${this.sequenceCounter}`;
  }

  private getOrCreateSequence(startNewSequence: boolean, sequenceDescription?: string, branchContext?: RecentThought[], parentBranchId?: string): string {
    if (startNewSequence || !this.currentSequenceId) {
      const newSequenceId = this.generateSequenceId();
      this.sequences[newSequenceId] = {
        id: newSequenceId,
        summary: sequenceDescription ?? `Sequence started at thought ${this.absoluteThoughtCounter + 1}`,
        startedAt: new Date().toISOString(),
        absoluteStartThought: this.absoluteThoughtCounter + 1,
        totalThoughts: 0,
        branches: [],
        branchContext,
        parentBranchId
      };
      this.currentSequenceId = newSequenceId;
      // Initialize thought counter for new sequence
      this.sequenceThoughtCounters[newSequenceId] = 0;
    }
    return this.currentSequenceId;
  }

  private getRecentThoughts(limit = 5): RecentThought[] {
    const start = Math.max(0, this.thoughtHistory.length - limit);
    return this.thoughtHistory.slice(start).map(thought => ({
      absolute: `A${thought.absoluteThoughtNumber}`,
      content: thought.thought.substring(0, 100) + (thought.thought.length > 100 ? '...' : '')
    }));
  }

  private parseReference(ref: string): { type: 'absolute' | 'sequence', value: number } {
    const match = /^([AaSs])(\d+)$/.exec(ref);
    /* c8 ignore start */ // Validator ensures format is correct before this is called
    if (!match) {
      throw new Error(`Invalid reference format: "${ref}". Use A{n} for absolute or S{n} for sequence-relative (e.g., 'A47', 'S3')`);
    }
    /* c8 ignore stop */
    
    return {
      type: match[1].toUpperCase() === 'A' ? 'absolute' : 'sequence',
      value: parseInt(match[2], 10)
    };
  }

  private resolveReference(ref: string): number {
    const { type, value } = this.parseReference(ref);
    
    if (type === 'absolute') {
      const exists = this.thoughtHistory.some(t => t.absoluteThoughtNumber === value);
      if (!exists) {
        throw new Error(`Absolute thought A${value} does not exist. Current range: A1-A${this.absoluteThoughtCounter}`);
      }
      return value;
    } else {
      // Type is 'sequence'
      /* c8 ignore start */ // getOrCreateSequence always creates a sequence before this is called
      if (!this.currentSequenceId) {
        throw new Error(`Cannot use sequence-relative reference S${value} - no active sequence`);
      }
      /* c8 ignore stop */
      
      const thought = this.thoughtHistory.find(
        t => t.sequenceId === this.currentSequenceId && t.thoughtNumber === value
      );
      
      if (!thought) {
        const sequenceThoughts = this.thoughtHistory.filter(t => t.sequenceId === this.currentSequenceId);
        const maxInSequence = Math.max(...sequenceThoughts.map(t => t.thoughtNumber), 0);
        throw new Error(`Sequence thought S${value} does not exist in current sequence. Current range: S1-S${maxInSequence}`);
      }
      
      return thought.absoluteThoughtNumber;
    }
  }

  private getOrCreateIsolatedServer(toolSource: string): CascadeThinkingServer {
    if (!this.isolatedStates.has(toolSource)) {
      this.isolatedStates.set(toolSource, new CascadeThinkingServer());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.isolatedStates.get(toolSource)!;
  }

  private getBranchContext(upToThought: number): RecentThought[] {
    // Get all thoughts up to and including the branch point
    const contextThoughts = this.thoughtHistory
      .filter(t => t.absoluteThoughtNumber <= upToThought)
      .map(t => ({
        absolute: `A${t.absoluteThoughtNumber}`,
        content: t.thought.substring(0, 100) + (t.thought.length > 100 ? '...' : '')
      }));
    
    // Return last 10 thoughts for context (configurable in future)
    return contextThoughts.slice(-10);
  }

  private switchToBranch(branchId: string): void {
    if (branchId === 'main') {
      // Find the first sequence (main sequence)
      const mainSequence = Object.values(this.sequences).find(seq => !seq.parentBranchId);
      if (mainSequence) {
        this.currentSequenceId = mainSequence.id;
      }
      return;
    }
    
    const branch = this.branches[branchId];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!branch) {
      throw new Error(`Branch '${branchId}' does not exist`);
    }
    
    // Switch to the sequence associated with this branch
    this.currentSequenceId = branch.currentSequenceId;
  }

  private getCurrentBranch(): string {
    /* c8 ignore next */ // getOrCreateSequence always sets currentSequenceId before this is called
    if (!this.currentSequenceId) return 'main';
    
    const currentSeq = this.sequences[this.currentSequenceId];
    return currentSeq.parentBranchId ?? 'main';
  }

  private getAvailableBranches(): {branchId: string; description?: string; thoughtCount: number; fromThought: string}[] {
    return Object.values(this.branches).map(branch => ({
      branchId: branch.branchId,
      description: branch.description,
      thoughtCount: branch.thoughtsInBranch,
      fromThought: `A${branch.fromAbsoluteThought}`
    }));
  }

  private generateBranchTree(): string {
    /* c8 ignore start */
    if (Object.keys(this.branches).length === 0) {
      return '';
    }
    /* c8 ignore stop */

    let tree = '\nBranch Tree Structure:\n';
    tree += '━━━━━━━━━━━━━━━━━━━━━\n';
    
    // Find main sequence (first one without parentBranchId)
    const mainSeq = Object.values(this.sequences).find(seq => !seq.parentBranchId);
    if (mainSeq) {
      tree += `📋 Main (${mainSeq.totalThoughts} thoughts)\n`;
      
      // Find all branches and organize by parent
      const branchesByParent: Record<string, BranchMetadata[]> = {};
      Object.values(this.branches).forEach(branch => {
        const parentSeqId = branch.fromSequenceId;
        if (!(parentSeqId in branchesByParent)) {
          branchesByParent[parentSeqId] = [];
        }
        branchesByParent[parentSeqId].push(branch);
      });
      
      // Recursively build tree
      const addBranches = (seqId: string, indent: string) => {
        if (seqId in branchesByParent) {
          const branches = branchesByParent[seqId];
          branches.forEach((branch, index) => {
          const isLast = index === branches.length - 1;
          const connector = isLast ? '└─' : '├─';
          const desc = branch.description ? ` (${branch.description})` : '';
          tree += `${indent}${connector} 🌿 ${branch.branchId}${desc} [${branch.thoughtsInBranch} thoughts]\n`;
          
          // Add sub-branches
          const nextIndent = indent + (isLast ? '   ' : '│  ');
          addBranches(branch.currentSequenceId, nextIndent);
          });
        }
      };
      
      addBranches(mainSeq.id, '');
    }
    
    return tree;
  }

  private generateHint(toolSource?: string, hasGap?: boolean, needsMoreThoughts?: boolean): string {
    // currentSequenceId is always set by getOrCreateSequence before this is called
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const sequenceId = this.currentSequenceId!;
    const currentSequence = this.sequences[sequenceId];
    const currentBranch = this.getCurrentBranch();
    const activeBranchCount = Object.values(this.branches).length;
    
    let hint;
    
    // Add branch info if on a branch
    if (currentBranch !== 'main') {
      const branch = this.branches[currentBranch];
      hint = `On branch '${currentBranch}'`;
      if (branch.description) {
        hint += ` (${branch.description})`;
      }
      hint += ` with ${branch.thoughtsInBranch} thoughts`;
      hint += ` - ${currentSequence.summary}`;
    } else {
      hint = `Continuing ${currentSequence.summary}`;
    }
    
    // Add available branches info with thought counts
    if (activeBranchCount > 0) {
      const branchDetails = Object.values(this.branches)
        .map(b => `${b.branchId}(${b.thoughtsInBranch})`)
        .join(', ');
      hint += ` | Branches: ${branchDetails}`;
    }
    
    // Add tool source info if not from user
    if (toolSource && toolSource !== 'user') {
      hint += ` (created by ${toolSource})`;
    }
    
    // Add gap info if detected
    if (hasGap) {
      hint += ' [Note: Some thoughts created by other tools]';
    }
    
    // Add needsMoreThoughts info
    if (needsMoreThoughts) {
      hint += ' [Total thoughts expanded]';
    }
    
    return hint;
  }

  private generateSequenceSummary(sequenceId: string): string | undefined {
    const sequenceThoughts = this.thoughtHistory.filter(t => t.sequenceId === sequenceId);
    
    // Only summarize sequences with more than 10 thoughts
    if (sequenceThoughts.length <= 10) {
      return undefined;
    }
    
    const summary: string[] = [];
    
    // Find key decisions (revisions)
    const revisions = sequenceThoughts.filter(t => t.isRevision);
    if (revisions.length > 0) {
      summary.push(`Key revisions: ${revisions.length} thoughts revised`);
    }
    
    // Find branches created from this sequence
    const branchesFromSequence = Object.values(this.branches)
      .filter(b => b.fromSequenceId === sequenceId);
    if (branchesFromSequence.length > 0) {
      summary.push(`Branches created: ${branchesFromSequence.map(b => b.branchId).join(', ')}`);
    }
    
    // Find thoughts that expanded the total
    const expansions = sequenceThoughts.filter(t => t.needsMoreThoughts);
    if (expansions.length > 0) {
      summary.push(`Expanded thinking ${expansions.length} time(s)`);
    }
    
    // Add progress indicator
    const lastThought = sequenceThoughts[sequenceThoughts.length - 1];
    const progress = Math.round((lastThought.thoughtNumber / lastThought.totalThoughts) * 100);
    summary.push(`Progress: ${progress}% (${lastThought.thoughtNumber}/${lastThought.totalThoughts})`);
    
    return summary.join(' | ');
  }

  private retrieveSpecificThoughts(pattern: string): RecentThought[] {
    // Handle "last:N" format
    if (pattern.startsWith('last:')) {
      const count = parseInt(pattern.substring(5), 10);
      return this.getRecentThoughts(count);
    }
    
    // Handle range format "A10-A15" or "S3-S7"
    const rangeMatch = /^([AaSs])(\d+)-([AaSs])(\d+)$/.exec(pattern);
    if (rangeMatch) {
      const [, startType, startNum, endType, endNum] = rangeMatch;
      
      // Both must be same type
      /* c8 ignore start */
      if (startType.toUpperCase() !== endType.toUpperCase()) {
        throw new Error('Range must use same reference type (both A or both S)');
      }
      /* c8 ignore stop */
      
      const start = parseInt(startNum, 10);
      const end = parseInt(endNum, 10);
      
      /* c8 ignore start */
      if (start > end) {
        throw new Error('Range start must be less than or equal to end');
      }
      /* c8 ignore stop */
      
      let thoughts: ThoughtData[] = [];
      
      if (startType.toUpperCase() === 'A') {
        // Absolute range
        thoughts = this.thoughtHistory.filter(
          t => t.absoluteThoughtNumber >= start && t.absoluteThoughtNumber <= end
        );
      } else {
        // Sequence range - only from current sequence
        /* c8 ignore start */
        if (!this.currentSequenceId) {
          throw new Error('Cannot use sequence-relative range without active sequence');
        }
        /* c8 ignore stop */
        thoughts = this.thoughtHistory.filter(
          t => t.sequenceId === this.currentSequenceId && 
               t.thoughtNumber >= start && 
               t.thoughtNumber <= end
        );
      }
      
      return thoughts.map(t => ({
        absolute: `A${t.absoluteThoughtNumber}`,
        /* c8 ignore next */
        content: t.thought.substring(0, 100) + (t.thought.length > 100 ? '...' : '')
      }));
    }
    
    // Handle specific thoughts "A23,A45,S2"
    const specific = pattern.split(',').map(ref => ref.trim());
    const retrieved: RecentThought[] = [];
    
    for (const ref of specific) {
      try {
        const absoluteNum = this.resolveReference(ref);
        const thought = this.thoughtHistory.find(t => t.absoluteThoughtNumber === absoluteNum);
        if (thought) {
          retrieved.push({
            absolute: `A${thought.absoluteThoughtNumber}`,
            content: thought.thought.substring(0, 100) + (thought.thought.length > 100 ? '...' : '')
          });
        }
      } catch {
        // Skip invalid references
      }
    }
    
    return retrieved;
  }

  public processThought(input: unknown): {
    content: { type: string; text: string }[];
    isError?: boolean;
  } {
    try {
      const validatedInput = validateThoughtData(input);

      // Handle isolated context if requested
      if (validatedInput.isolatedContext && validatedInput.toolSource) {
        const isolatedServer = this.getOrCreateIsolatedServer(validatedInput.toolSource);
        // Create a new input object with isolatedContext set to false
        const isolatedInput = Object.assign({}, input as Record<string, unknown>, { isolatedContext: false });
        return isolatedServer.processThought(isolatedInput);
      }

      // Handle branch switching if requested
      if (validatedInput.switchToBranch) {
        if (validatedInput.startNewSequence) {
          throw new Error("Cannot combine switchToBranch with startNewSequence. Please use one or the other.");
        }
        this.switchToBranch(validatedInput.switchToBranch);
      }

      // Prepare branch context if creating a branch
      let branchContext: RecentThought[] | undefined;
      let parentBranchId: string | undefined;
      
      if (validatedInput.branchFromThought && validatedInput.branchId) {
        // Resolve the branch point to get context
        const branchPoint = this.resolveReference(validatedInput.branchFromThought as string);
        branchContext = this.getBranchContext(branchPoint);
        parentBranchId = validatedInput.branchId;
      }

      // Handle sequence management - branches automatically create new sequences
      const shouldStartNewSequence = (validatedInput.startNewSequence ?? false) || 
                                     (!!validatedInput.branchFromThought && !!validatedInput.branchId);
      
      const sequenceId = this.getOrCreateSequence(
        shouldStartNewSequence,
        validatedInput.sequenceDescription ?? 
          (validatedInput.branchId ? `Branch: ${validatedInput.branchDescription ?? validatedInput.branchId}` : undefined),
        branchContext,
        parentBranchId
      );

      // Calculate expected thought number without incrementing yet
      const currentSequenceCount = this.sequenceThoughtCounters[sequenceId] || 0;
      const expectedThoughtNumber = currentSequenceCount + 1;
      
      // For tools (non-user), auto-correct the thought number
      if (validatedInput.toolSource && validatedInput.toolSource !== 'user') {
        validatedInput.thoughtNumber = expectedThoughtNumber;
      } else {
        // For direct users, validate the thought number matches expected
        if (validatedInput.thoughtNumber !== expectedThoughtNumber) {
          throw new Error(`Invalid thought number: expected S${expectedThoughtNumber} for current sequence, but got S${validatedInput.thoughtNumber}`);
        }
      }

      // Calculate gap information before incrementing counter
      const isUserThought = !validatedInput.toolSource || validatedInput.toolSource === 'user';
      const hasGap = isUserThought && 
                     this.lastUserThoughtNumber > 0 && 
                     this.absoluteThoughtCounter > this.lastUserThoughtNumber;


      // Adjust totalThoughts if needed
      if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
        validatedInput.totalThoughts = validatedInput.thoughtNumber;
      }
      
      // Handle needsMoreThoughts - increase totalThoughts estimate
      let adjustedTotal: number | undefined;
      if (validatedInput.needsMoreThoughts) {
        // Increase by 50% or at least 3 more thoughts
        const increase = Math.max(3, Math.ceil(validatedInput.totalThoughts * 0.5));
        adjustedTotal = validatedInput.thoughtNumber + increase;
        validatedInput.totalThoughts = adjustedTotal;
      }

      // Resolve thought references using new prefix system
      if (validatedInput.revisesThought) {
        validatedInput.revisesThought = this.resolveReference(validatedInput.revisesThought as string);
      }

      if (validatedInput.branchFromThought) {
        validatedInput.branchFromThought = this.resolveReference(validatedInput.branchFromThought as string);
      }

      // NOW that all validations have passed, update state
      // Increment sequence counter
      this.sequenceThoughtCounters[sequenceId] = currentSequenceCount + 1;
      
      // Increment absolute counter and set sequence info
      this.absoluteThoughtCounter++;
      validatedInput.absoluteThoughtNumber = this.absoluteThoughtCounter;
      validatedInput.sequenceId = sequenceId;

      // Add to history
      this.thoughtHistory.push(validatedInput);

      // Update sequence metadata
      this.sequences[sequenceId].totalThoughts++;

      // Handle branching with enhanced metadata
      if (validatedInput.branchFromThought && validatedInput.branchId) {
        const branchPoint = this.thoughtHistory.find(
          t => t.absoluteThoughtNumber === validatedInput.branchFromThought
        );
        
        if (branchPoint) {
          this.branches[validatedInput.branchId] = {
            branchId: validatedInput.branchId,
            fromSequenceId: branchPoint.sequenceId,
            fromAbsoluteThought: branchPoint.absoluteThoughtNumber,
            fromSequenceThought: branchPoint.thoughtNumber,
            currentSequenceId: sequenceId,
            createdAt: new Date().toISOString(),
            description: validatedInput.branchDescription,
            thoughtsInBranch: 1
          };
          
          this.sequences[sequenceId].branches.push(validatedInput.branchId);
        }
      }

      // Update branch thought count if continuing in a branch (but not when creating it)
      const currentBranch = this.getCurrentBranch();
      const isCreatingBranch = validatedInput.branchFromThought && validatedInput.branchId;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (currentBranch !== 'main' && this.branches[currentBranch] && !isCreatingBranch) {
        this.branches[currentBranch].thoughtsInBranch++;
      }

      // Log formatted thought
      if (!this.disableThoughtLogging) {
        // Pass current branch info for proper formatting
        const thoughtWithBranch = {
          ...validatedInput,
          currentBranch: currentBranch !== 'main' ? currentBranch : undefined
        };
        const formattedThought = formatThought(thoughtWithBranch);
        console.error(formattedThought);
      }

      // Build gap info if detected
      let gapInfo = undefined;
      if (hasGap) {
        // Calculate the gap size: current thought number - last user thought number - 1
        const gapSize = this.absoluteThoughtCounter - this.lastUserThoughtNumber - 1;
        
        // Get thoughts that were created between the last user thought and this one
        const gapThoughts = this.thoughtHistory.filter(t => {
          const afterLastUser = t.absoluteThoughtNumber > this.lastUserThoughtNumber;
          const beforeCurrent = t.absoluteThoughtNumber < this.absoluteThoughtCounter;
          return afterLastUser && beforeCurrent;
        });
        
        // Filter to only tool-created thoughts
        const toolThoughts = gapThoughts.filter(t => t.toolSource && t.toolSource !== 'user');
        const toolSources = [...new Set(toolThoughts.map(t => t.toolSource))].filter(Boolean) as string[];
        
        gapInfo = {
          hasGap: true,
          gapSize,
          explanation: `${gapSize} thoughts were created by other tools between your last thought and this one`,
          createdBy: toolSources
        };
      }

      // Update last user thought number AFTER building gap info
      if (isUserThought) {
        this.lastUserThoughtNumber = this.absoluteThoughtCounter;
      }

      // Build response based on mode
      const currentSequence = this.sequences[sequenceId];
      const responseMode = validatedInput.responseMode ?? 'standard';
      
      // Start with minimal response
      const response: CascadeThinkingResponse = {
        thoughtNumber: `S${validatedInput.thoughtNumber}`,
        absoluteThoughtNumber: `A${validatedInput.absoluteThoughtNumber}`,
        totalThoughts: validatedInput.totalThoughts,
        nextThoughtNeeded: validatedInput.nextThoughtNeeded,
        hint: this.generateHint(validatedInput.toolSource, hasGap, validatedInput.needsMoreThoughts)
      };
      
      // Add standard mode fields
      if (responseMode === 'standard' || responseMode === 'verbose') {
        response.currentSequence = {
          id: sequenceId,
          summary: currentSequence.summary,
          thoughtsInSequence: currentSequence.totalThoughts
        };
        response.recentThoughts = this.getRecentThoughts(validatedInput.recentThoughtsLimit);
        
        // Add sequence summary for long sequences
        const sequenceSummary = this.generateSequenceSummary(sequenceId);
        if (sequenceSummary) {
          response.sequenceSummary = sequenceSummary;
        }
      }
      
      // Add tracking fields for standard and verbose modes
      if (responseMode === 'standard' || responseMode === 'verbose') {
        response.totalSequences = Object.keys(this.sequences).length;
        response.totalThoughtsAllTime = this.absoluteThoughtCounter;
        response.activeBranches = Object.values(this.branches)
          .filter(b => b.currentSequenceId === sequenceId).length;
      }

      // Add gap info if present (standard and verbose modes)
      /* c8 ignore start */
      if (gapInfo && (responseMode === 'standard' || responseMode === 'verbose')) {
        response.gapInfo = gapInfo;
      }
      /* c8 ignore stop */

      // Add tool source if not user (always include for non-user sources)
      if (validatedInput.toolSource && validatedInput.toolSource !== 'user') {
        response.toolSource = validatedInput.toolSource;
      }

      // Add expected next thought number if continuing
      if (validatedInput.nextThoughtNeeded) {
        const nextNumber = this.sequenceThoughtCounters[sequenceId] + 1;
        response.expectedThoughtNumber = `S${nextNumber}`;
      }

      // Add branch information based on mode
      const availableBranches = this.getAvailableBranches();
      
      // Auto-enhance: Always show important context even in minimal mode
      const autoEnhance = responseMode === 'minimal' && (
        currentBranch !== 'main' || 
        (validatedInput.isRevision ?? false) || 
        (validatedInput.branchFromThought !== undefined)
      );
      
      if (autoEnhance) {
        // Add critical context for minimal mode
        response.currentBranch = currentBranch;
        if (validatedInput.isRevision) {
          response.currentSequence = {
            id: sequenceId,
            summary: currentSequence.summary,
            thoughtsInSequence: currentSequence.totalThoughts
          };
        }
      } else if (responseMode === 'standard' || responseMode === 'verbose') {
        response.currentBranch = currentBranch;
        if (availableBranches.length > 0) {
          response.availableBranches = availableBranches;
        }
      }
      
      // Add needsMoreThoughts info if it was used
      if (validatedInput.needsMoreThoughts && adjustedTotal !== undefined) {
        response.needsMoreThoughts = true;
        response.adjustedTotalThoughts = adjustedTotal;
      }
      
      // Add recentThoughtsLimit if different from default
      if (validatedInput.recentThoughtsLimit !== undefined && validatedInput.recentThoughtsLimit !== 5) {
        response.recentThoughtsLimit = validatedInput.recentThoughtsLimit;
      }
      
      // Add retrieved thoughts if requested
      if (validatedInput.retrieveThoughts) {
        try {
          response.retrievedThoughts = this.retrieveSpecificThoughts(validatedInput.retrieveThoughts);
        /* c8 ignore start */
        } catch {
          // Include error in response but don't fail the whole request
          response.retrievedThoughts = [];
        }
        /* c8 ignore stop */
      }

      // Add verbose details if requested
      if (responseMode === 'verbose') {
        response.sequenceHistory = Object.values(this.sequences);
        response.branches = this.branches;
        
        // Add branch tree visualization if there are branches
        if (Object.keys(this.branches).length > 0) {
          response.branchTree = this.generateBranchTree();
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : /* c8 ignore next */ String(error),
                status: "failed",
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  }
}