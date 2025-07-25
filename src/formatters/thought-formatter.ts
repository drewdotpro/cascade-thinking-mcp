import chalk from "chalk";
const { blue, yellow, green, gray, magenta } = chalk;
import { ThoughtData } from '../types/thought.js';

export function formatThought(thoughtData: ThoughtData): string {
  const {
    thoughtNumber,
    absoluteThoughtNumber,
    sequenceId,
    totalThoughts,
    thought,
    isRevision,
    revisesThought,
    branchFromThought,
    branchId,
    startNewSequence,
    sequenceDescription,
    needsMoreThoughts,
    currentBranch,
  } = thoughtData;

  let prefix;
  let plainPrefix;
  let context;

  if (startNewSequence) {
    prefix = magenta("🆕 Thought");
    plainPrefix = "🆕 Thought";
    context = "";
  } else if (isRevision) {
    prefix = yellow("🔄 Revision");
    plainPrefix = "🔄 Revision";
    context = ` (revising absolute thought ${revisesThought})`;
  } else if (branchFromThought) {
    prefix = green("🌿 Branch");
    plainPrefix = "🌿 Branch";
    context = ` (from absolute thought ${branchFromThought}, ID: ${branchId})`;
  } else if (currentBranch) {
    // Show branch symbol for all thoughts on a branch
    prefix = green("🌿 Thought");
    plainPrefix = "🌿 Thought";
    context = ` (on branch ${currentBranch})`;
  } else {
    prefix = blue("💭 Thought");
    plainPrefix = "💭 Thought";
    context = "";
  }

  // Build header with absolute number
  const needsMoreIndicator = needsMoreThoughts ? " ⚡" : "";
  const plainHeader = `${plainPrefix} S${thoughtNumber}/${totalThoughts}${needsMoreIndicator} [Absolute: A${absoluteThoughtNumber}]${context}`;
  const coloredHeader = `${prefix} S${thoughtNumber}/${totalThoughts}${needsMoreThoughts ? yellow(" ⚡") : ""} ${gray(`[Absolute: A${absoluteThoughtNumber}]`)}${context}`;
  
  // Add sequence info
  let sequenceInfo = startNewSequence 
    ? magenta(`New Sequence: ${sequenceDescription ?? sequenceId}`)
    : gray(`Sequence: ${sequenceId}`);
  let plainSequenceInfo = startNewSequence 
    ? `New Sequence: ${sequenceDescription ?? sequenceId}`
    : `Sequence: ${sequenceId}`;
    
  // Add needsMoreThoughts info
  if (needsMoreThoughts) {
    const moreThoughtsInfo = yellow(" [Expanding thoughts...]");
    sequenceInfo += moreThoughtsInfo;
    plainSequenceInfo += " [Expanding thoughts...]";
  }

  // Calculate box dimensions
  const lines = [plainHeader, plainSequenceInfo, thought];
  const maxContentLength = Math.max(...lines.map(line => line.length));
  const borderLength = maxContentLength + 4;
  const border = "─".repeat(borderLength);
  const doubleBorder = "═".repeat(borderLength);

  // Pad each line
  const headerPadding = " ".repeat(borderLength - plainHeader.length - 2);
  const sequencePadding = " ".repeat(borderLength - plainSequenceInfo.length - 2);
  const thoughtPadding = " ".repeat(borderLength - thought.length - 2);

  // Use double border for new sequences
  const topBorder = startNewSequence ? doubleBorder : border;
  const bottomBorder = startNewSequence ? doubleBorder : border;
  const topCorners = startNewSequence ? ["╔", "╗"] : ["┌", "┐"];
  const bottomCorners = startNewSequence ? ["╚", "╝"] : ["└", "┘"];
  const verticalBorder = startNewSequence ? "║" : "│";

  // Build the output with proper alignment
  // We need to ensure padding is calculated correctly for colored text
  const formatLine = (content: string, plainContent: string, padding: string) => `${verticalBorder} ${content}${padding} ${verticalBorder}`;

  return `
${topCorners[0]}${topBorder}${topCorners[1]}
${formatLine(coloredHeader, plainHeader, headerPadding)}
${formatLine(sequenceInfo, plainSequenceInfo, sequencePadding)}
├${border}┤
${formatLine(thought, thought, thoughtPadding)}
${bottomCorners[0]}${bottomBorder}${bottomCorners[1]}`;
}