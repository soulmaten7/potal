/**
 * POTAL US Sales Tax Nexus Check — core logic
 *
 * Given a list of per-state sales amounts/transactions, determine which states
 * have triggered economic nexus, which are within the warning zone, and which
 * are safe. Based on post-Wayfair (2018) thresholds for all 50 states + DC.
 *
 * Data source: data/us-nexus-thresholds.json (Sales Tax Institute + state DORs)
 */

import thresholdsData from '@/data/us-nexus-thresholds.json';

export type ThresholdType = 'sales_only' | 'sales_or_transactions' | 'sales_and_transactions' | 'no_state_tax';

export interface NexusThreshold {
  state: string;
  stateName: string;
  salesThreshold: number | null;
  transactionThreshold: number | null;
  thresholdType: ThresholdType;
  effectiveDate: string | null;
  measurementPeriod: string | null;
  marketplaceFacilitator: boolean;
  source: string;
  sourceUrl: string;
  lastVerified: string;
  notes: string | null;
}

export interface StateSale {
  state: string;
  amount: number;
  transactions?: number;
}

export interface TriggeredEntry {
  state: string;
  stateName: string;
  reason: 'sales_threshold_exceeded' | 'transaction_threshold_exceeded' | 'both_thresholds_exceeded';
  amount: number;
  transactions: number | null;
  salesThreshold: number | null;
  transactionThreshold: number | null;
  exceededBy: number;
  thresholdType: ThresholdType;
  effectiveDate: string | null;
  marketplaceFacilitator: boolean;
  sourceUrl: string;
}

export interface SafeEntry {
  state: string;
  stateName: string;
  amount: number;
  transactions: number | null;
  salesThreshold: number | null;
  transactionThreshold: number | null;
  percentToThreshold: number;
  thresholdType: ThresholdType;
  sourceUrl: string;
}

export interface WarningEntry {
  state: string;
  stateName: string;
  message: string;
  percentToThreshold: number;
}

export interface UnknownEntry {
  state: string;
  message: string;
}

export interface NexusCheckResult {
  triggered: TriggeredEntry[];
  safe: SafeEntry[];
  warnings: WarningEntry[];
  unknown: UnknownEntry[];
  summary: {
    totalStates: number;
    triggered: number;
    warning: number;
    safe: number;
    unknown: number;
  };
  disclaimer: string;
  dataVersion: string;
  dataLastUpdated: string;
}

const thresholds = (thresholdsData.states as NexusThreshold[]);
const thresholdsMap = new Map<string, NexusThreshold>(
  thresholds.map((t) => [t.state.toUpperCase(), t])
);

const WARNING_THRESHOLD_PERCENT = 80; // within 80% of threshold → warning

const DISCLAIMER =
  'This is an informational tool. Nexus determinations depend on your specific business activities and should be confirmed with a licensed tax professional. Data reflects publicly available thresholds as of the lastVerified date and may change.';

/**
 * Evaluate a single state's sales against its threshold.
 */
function evaluateState(
  sale: StateSale,
  threshold: NexusThreshold
): { triggered: TriggeredEntry | null; safe: SafeEntry | null; warning: WarningEntry | null } {
  const amount = Number(sale.amount) || 0;
  const transactions = typeof sale.transactions === 'number' ? sale.transactions : null;

  // No state tax → always safe
  if (threshold.thresholdType === 'no_state_tax') {
    return {
      triggered: null,
      safe: {
        state: threshold.state,
        stateName: threshold.stateName,
        amount,
        transactions,
        salesThreshold: null,
        transactionThreshold: null,
        percentToThreshold: 0,
        thresholdType: threshold.thresholdType,
        sourceUrl: threshold.sourceUrl,
      },
      warning: null,
    };
  }

  const salesLimit = threshold.salesThreshold;
  const txnLimit = threshold.transactionThreshold;

  const salesExceeded = salesLimit !== null && amount >= salesLimit;
  const txnExceeded = txnLimit !== null && transactions !== null && transactions >= txnLimit;

  let triggered = false;
  let reason: TriggeredEntry['reason'] = 'sales_threshold_exceeded';

  if (threshold.thresholdType === 'sales_only') {
    triggered = salesExceeded;
    reason = 'sales_threshold_exceeded';
  } else if (threshold.thresholdType === 'sales_or_transactions') {
    triggered = salesExceeded || txnExceeded;
    reason = salesExceeded && txnExceeded
      ? 'both_thresholds_exceeded'
      : salesExceeded
        ? 'sales_threshold_exceeded'
        : 'transaction_threshold_exceeded';
  } else if (threshold.thresholdType === 'sales_and_transactions') {
    // Both must be true to trigger
    triggered = salesExceeded && txnExceeded;
    reason = 'both_thresholds_exceeded';
  }

  // Percent toward the sales threshold (primary metric for UI)
  const percentToThreshold =
    salesLimit && salesLimit > 0
      ? Math.min(999, Math.round((amount / salesLimit) * 100))
      : 0;

  if (triggered) {
    const exceededBy = salesLimit !== null && amount > salesLimit ? amount - salesLimit : 0;
    return {
      triggered: {
        state: threshold.state,
        stateName: threshold.stateName,
        reason,
        amount,
        transactions,
        salesThreshold: salesLimit,
        transactionThreshold: txnLimit,
        exceededBy,
        thresholdType: threshold.thresholdType,
        effectiveDate: threshold.effectiveDate,
        marketplaceFacilitator: threshold.marketplaceFacilitator,
        sourceUrl: threshold.sourceUrl,
      },
      safe: null,
      warning: null,
    };
  }

  const safeEntry: SafeEntry = {
    state: threshold.state,
    stateName: threshold.stateName,
    amount,
    transactions,
    salesThreshold: salesLimit,
    transactionThreshold: txnLimit,
    percentToThreshold,
    thresholdType: threshold.thresholdType,
    sourceUrl: threshold.sourceUrl,
  };

  let warningEntry: WarningEntry | null = null;
  if (percentToThreshold >= WARNING_THRESHOLD_PERCENT) {
    const gap = (salesLimit || 0) - amount;
    warningEntry = {
      state: threshold.state,
      stateName: threshold.stateName,
      message: `Within ${100 - percentToThreshold}% of threshold — $${gap.toLocaleString()} remaining. Monitor closely.`,
      percentToThreshold,
    };
  }

  return { triggered: null, safe: safeEntry, warning: warningEntry };
}

/**
 * Check nexus exposure for a list of per-state sales.
 */
export function checkNexus(sales: StateSale[]): NexusCheckResult {
  const triggered: TriggeredEntry[] = [];
  const safe: SafeEntry[] = [];
  const warnings: WarningEntry[] = [];
  const unknown: UnknownEntry[] = [];

  for (const sale of sales) {
    if (!sale.state || typeof sale.state !== 'string') {
      continue;
    }
    const threshold = thresholdsMap.get(sale.state.toUpperCase());
    if (!threshold) {
      unknown.push({
        state: sale.state,
        message: `Unknown state code "${sale.state}". Use 2-letter US state abbreviation.`,
      });
      continue;
    }
    const result = evaluateState(sale, threshold);
    if (result.triggered) triggered.push(result.triggered);
    if (result.safe) safe.push(result.safe);
    if (result.warning) warnings.push(result.warning);
  }

  return {
    triggered,
    safe,
    warnings,
    unknown,
    summary: {
      totalStates: sales.length,
      triggered: triggered.length,
      warning: warnings.length,
      safe: safe.length - warnings.length,
      unknown: unknown.length,
    },
    disclaimer: DISCLAIMER,
    dataVersion: thresholdsData.meta.version,
    dataLastUpdated: thresholdsData.meta.lastUpdated,
  };
}

/**
 * Get the full threshold record for a given state (for dropdown/lookup).
 */
export function getStateThreshold(stateCode: string): NexusThreshold | null {
  return thresholdsMap.get(stateCode.toUpperCase()) || null;
}

/**
 * List all supported states.
 */
export function listAllStates(): Array<{ state: string; stateName: string; thresholdType: ThresholdType }> {
  return thresholds.map((t) => ({
    state: t.state,
    stateName: t.stateName,
    thresholdType: t.thresholdType,
  }));
}
