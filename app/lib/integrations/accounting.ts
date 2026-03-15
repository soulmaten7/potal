/**
 * POTAL F084 — Accounting Integration
 * Maps landed cost results to accounting journal entries
 */

export interface AccountingEntry {
  date: string;
  reference: string;
  accounts: { name: string; debit: number; credit: number }[];
  memo: string;
}

export function mapToAccountingEntry(
  landedCostResult: Record<string, unknown>,
  invoiceRef?: string
): AccountingEntry {
  const duty = (landedCostResult.importDuty as number) || 0;
  const vat = (landedCostResult.vat as number) || 0;
  const mpf = (landedCostResult.mpf as number) || 0;
  const brokerage = (landedCostResult.brokerageFee as number) || 0;
  const productCost = (landedCostResult.productPrice as number) || 0;
  const shipping = (landedCostResult.shippingCost as number) || 0;
  const total = (landedCostResult.totalLandedCost as number) || 0;

  const accounts: { name: string; debit: number; credit: number }[] = [];

  if (productCost > 0) accounts.push({ name: 'Inventory / COGS', debit: productCost, credit: 0 });
  if (shipping > 0) accounts.push({ name: 'Freight-In Expense', debit: shipping, credit: 0 });
  if (duty > 0) accounts.push({ name: 'Import Duty Expense', debit: duty, credit: 0 });
  if (vat > 0) accounts.push({ name: 'VAT Receivable / Input Tax', debit: vat, credit: 0 });
  if (mpf > 0) accounts.push({ name: 'Customs Processing Fee', debit: mpf, credit: 0 });
  if (brokerage > 0) accounts.push({ name: 'Brokerage Fee Expense', debit: brokerage, credit: 0 });

  // Credit side: Accounts Payable
  if (total > 0) accounts.push({ name: 'Accounts Payable', debit: 0, credit: total });

  return {
    date: new Date().toISOString().split('T')[0],
    reference: invoiceRef || `POTAL-${Date.now()}`,
    accounts,
    memo: `Landed cost entry — Destination: ${landedCostResult.destinationCountry || 'N/A'}`,
  };
}
