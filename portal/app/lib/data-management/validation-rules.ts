/**
 * Validation Rules — auto-verify data integrity after updates.
 */

export interface ValidationRule {
  fileId: string;
  rules: {
    minRows?: number;
    maxRowDelta?: number;
    fieldRanges?: { field: string; min?: number; max?: number }[];
    requiredCountries?: string[];
  };
}

export const VALIDATION_RULES: ValidationRule[] = [
  {
    fileId: 'db:macmap_ntlc_rates',
    rules: {
      minRows: 500000,
      maxRowDelta: 10,
      requiredCountries: ['US', 'EU', 'GB', 'JP', 'KR', 'AU', 'CA'],
    },
  },
  {
    fileId: 'db:vat_gst_rates',
    rules: { minRows: 230 },
  },
  {
    fileId: 'db:de_minimis_thresholds',
    rules: { minRows: 230 },
  },
  {
    fileId: 'db:customs_fees',
    rules: { minRows: 230 },
  },
  {
    fileId: 'db:sanctions_entries',
    rules: { minRows: 18000, maxRowDelta: 5 },
  },
  {
    fileId: 'db:trade_remedy_cases',
    rules: { minRows: 9000, maxRowDelta: 10 },
  },
  {
    fileId: 'db:trade_remedy_products',
    rules: { minRows: 50000 },
  },
  {
    fileId: 'db:trade_remedy_duties',
    rules: { minRows: 30000 },
  },
  {
    fileId: 'db:macmap_trade_agreements',
    rules: { minRows: 1200 },
  },
  {
    fileId: 'db:gov_tariff_schedules',
    rules: { minRows: 85000, requiredCountries: ['US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA'] },
  },
];

/** Validate a DB table against its rules */
export function getValidationRule(fileId: string): ValidationRule | undefined {
  return VALIDATION_RULES.find(r => r.fileId === fileId);
}
