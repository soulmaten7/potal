/**
 * POTAL Learning System — Phase 1: Observe
 *
 * Exports for search log collection and user signal tracking
 */

export {
  generateSessionId,
  logSearch,
  logSignal,
  flushPendingSignals,
  type SearchLogEntry,
  type SearchSignal,
} from './SearchLogger';
