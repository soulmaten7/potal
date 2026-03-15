/**
 * F028: Duty Drawback Calculator
 */

export type DrawbackType = 'manufacturing' | 'substitution' | 'rejected_merchandise';

export interface DrawbackResult {
  eligible: boolean;
  refundAmount: number;
  refundRate: 99 | 100;
  timeLimitRemainingDays: number;
  requiredDocuments: string[];
  filingDeadline: string;
  drawbackType: DrawbackType;
  notes: string;
}

export function calculateDrawback(params: {
  originalImport: { hsCode: string; value: number; dutyPaid: number; date: string };
  exportItem: { value: number; date: string };
  drawbackType: DrawbackType;
}): DrawbackResult {
  const { originalImport, exportItem, drawbackType } = params;
  const importDate = new Date(originalImport.date);
  const exportDate = new Date(exportItem.date);
  const now = new Date();

  // US: 5-year limit from import date; 3-year filing window after export
  const fiveYears = new Date(importDate);
  fiveYears.setFullYear(fiveYears.getFullYear() + 5);
  const threeYearsAfterExport = new Date(exportDate);
  threeYearsAfterExport.setFullYear(threeYearsAfterExport.getFullYear() + 3);

  const deadline = fiveYears < threeYearsAfterExport ? fiveYears : threeYearsAfterExport;
  const timeLimitRemainingDays = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const eligible = timeLimitRemainingDays > 0 && exportDate > importDate;
  const refundRate: 99 | 100 = drawbackType === 'rejected_merchandise' ? 100 : 99;
  const refundAmount = eligible ? Math.round(originalImport.dutyPaid * refundRate / 100 * 100) / 100 : 0;

  const requiredDocuments: string[] = [
    'CBP Form 7551 (Drawback Entry)',
    'Import entry documentation',
    'Export documentation (proof of exportation)',
    'Manufacturing records (if applicable)',
  ];

  if (drawbackType === 'substitution') {
    requiredDocuments.push('Substitution certificate — proof of commercially interchangeable goods');
  }
  if (drawbackType === 'rejected_merchandise') {
    requiredDocuments.push('Evidence of rejection or defective condition');
  }

  return {
    eligible,
    refundAmount,
    refundRate,
    timeLimitRemainingDays,
    requiredDocuments,
    filingDeadline: deadline.toISOString().split('T')[0],
    drawbackType,
    notes: eligible
      ? `Eligible for ${refundRate}% duty drawback on $${originalImport.dutyPaid.toFixed(2)} duties paid.`
      : 'Not eligible. Check time limits and export documentation.',
  };
}
