/**
 * F059: Post-clearance Duty Collection
 *
 * Track unpaid duties/taxes for DDU shipments.
 * Status: paid → unpaid → overdue → disputed → written_off
 */

export type CollectionStatus = 'pending' | 'paid' | 'unpaid' | 'overdue' | 'disputed' | 'written_off';

export interface CollectionRecord {
  id: string;
  shipmentId: string;
  sellerId: string;
  buyerCountry: string;
  dutyAmount: number;
  taxAmount: number;
  feesAmount: number;
  totalOwed: number;
  currency: string;
  status: CollectionStatus;
  dueDate: string;
  paidDate?: string;
  overdueInterestRate?: number;
  overdueAmount?: number;
  createdAt: string;
}

export interface CollectionSummary {
  totalOutstanding: number;
  totalPaid: number;
  totalOverdue: number;
  totalDisputed: number;
  currency: string;
  byCountry: Record<string, number>;
  recordCount: number;
}

// Country-specific late payment interest rates (annual %)
const LATE_INTEREST_RATES: Record<string, number> = {
  US: 0.06, // 6% per annum (CBP)
  EU: 0.035, // ECB rate + 2%
  GB: 0.055, // HMRC late payment interest
  AU: 0.085, // ATO general interest charge
  CA: 0.06, // CBSA prescribed rate
  JP: 0.073, // Japan Customs
};

/**
 * Create a new collection record for unpaid duties.
 */
export function createCollectionRecord(params: {
  shipmentId: string;
  sellerId: string;
  buyerCountry: string;
  dutyAmount: number;
  taxAmount: number;
  feesAmount?: number;
  currency?: string;
  dueDays?: number;
}): CollectionRecord {
  const { shipmentId, sellerId, buyerCountry, dutyAmount, taxAmount, feesAmount = 0, currency = 'USD', dueDays = 30 } = params;

  if (dutyAmount < 0 || taxAmount < 0) throw new Error('Amounts must be non-negative');

  return {
    id: `COL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    shipmentId,
    sellerId,
    buyerCountry: buyerCountry.toUpperCase(),
    dutyAmount: Math.round(dutyAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    feesAmount: Math.round(feesAmount * 100) / 100,
    totalOwed: Math.round((dutyAmount + taxAmount + feesAmount) * 100) / 100,
    currency,
    status: 'pending',
    dueDate: new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000).toISOString(),
    overdueInterestRate: LATE_INTEREST_RATES[buyerCountry.toUpperCase()] || 0.05,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculate overdue interest on an unpaid collection.
 */
export function calculateOverdueInterest(record: CollectionRecord): number {
  if (record.status === 'paid' || record.status === 'written_off') return 0;

  const dueDate = new Date(record.dueDate);
  const now = new Date();
  if (now <= dueDate) return 0;

  const overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const annualRate = record.overdueInterestRate || 0.05;
  const dailyRate = annualRate / 365;
  return Math.round(record.totalOwed * dailyRate * overdueDays * 100) / 100;
}

/**
 * Aggregate collection records into a summary.
 */
export function summarizeCollections(records: CollectionRecord[]): CollectionSummary {
  const byCountry: Record<string, number> = {};
  let totalOutstanding = 0;
  let totalPaid = 0;
  let totalOverdue = 0;
  let totalDisputed = 0;

  for (const r of records) {
    if (r.status === 'paid') totalPaid += r.totalOwed;
    else if (r.status === 'overdue') { totalOverdue += r.totalOwed; totalOutstanding += r.totalOwed; }
    else if (r.status === 'disputed') { totalDisputed += r.totalOwed; totalOutstanding += r.totalOwed; }
    else if (r.status === 'pending' || r.status === 'unpaid') totalOutstanding += r.totalOwed;

    if (r.status !== 'paid' && r.status !== 'written_off') {
      byCountry[r.buyerCountry] = (byCountry[r.buyerCountry] || 0) + r.totalOwed;
    }
  }

  return {
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    totalDisputed: Math.round(totalDisputed * 100) / 100,
    currency: records[0]?.currency || 'USD',
    byCountry,
    recordCount: records.length,
  };
}
