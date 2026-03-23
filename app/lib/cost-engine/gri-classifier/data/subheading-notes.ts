/**
 * Subheading Notes — minimal fallback.
 * Most subheading matching uses subheading-descriptions.ts instead.
 * This file is kept for compatibility with step08 note checks.
 */

// No fs dependency — subheading notes are rarely used and mostly empty
// The main subheading data is in subheading-descriptions.ts

export function getSubheadingNote(_code: string): string | null {
  // Subheading notes are very rare in the HS — most chapters don't have them.
  // The actual classification logic uses subheading-descriptions.ts for matching.
  return null;
}
