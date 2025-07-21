import chalk from "chalk";
import { ThoughtData } from '../types/thought.js';

export function formatThought(thoughtData: ThoughtData): string {
  const {
    thoughtNumber,
    totalThoughts,
    thought,
    isRevision,
    revisesThought,
    branchFromThought,
    branchId,
  } = thoughtData;

  let prefix = "";
  let plainPrefix = "";
  let context = "";

  if (isRevision) {
    prefix = chalk.yellow("🔄 Revision");
    plainPrefix = "🔄 Revision";
    context = ` (revising thought ${revisesThought})`;
  } else if (branchFromThought) {
    prefix = chalk.green("🌿 Branch");
    plainPrefix = "🌿 Branch";
    context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
  } else {
    prefix = chalk.blue("💭 Thought");
    plainPrefix = "💭 Thought";
    context = "";
  }

  const plainHeader = `${plainPrefix} ${thoughtNumber}/${totalThoughts}${context}`;
  const coloredHeader = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
  const maxContentLength = Math.max(plainHeader.length, thought.length);
  const borderLength = maxContentLength + 4;
  const border = "─".repeat(borderLength);

  // Pad the header and thought to fit within the box
  const headerPadding = " ".repeat(borderLength - plainHeader.length - 2);
  const thoughtPadding = " ".repeat(borderLength - thought.length - 2);

  return `
┌${border}┐
│ ${coloredHeader}${headerPadding} │
├${border}┤
│ ${thought}${thoughtPadding} │
└${border}┘`;
}