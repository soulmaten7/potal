/**
 * Cost Tracker — tracks data update costs (API calls, LLM tokens, bandwidth).
 */

export interface UpdateCost {
  fileId: string;
  timestamp: string;
  apiCalls: number;
  apiCost: number;
  llmTokens: number;
  llmCost: number;
  bandwidthMB: number;
  computeSeconds: number;
  totalCost: number;
}

/** Monthly cost baseline (fixed infrastructure) */
export const MONTHLY_FIXED_COSTS = {
  supabase: 25,
  vercel: 20,
  total: 45,
};

/** Per-update cost estimates by data type */
export const UPDATE_COST_ESTIMATES: Record<string, { perUpdate: number; frequency: string }> = {
  'external:ecb_daily_xml': { perUpdate: 0, frequency: 'daily' },
  'db:sanctions_entries': { perUpdate: 0, frequency: 'daily' },
  'db:macmap_ntlc_rates': { perUpdate: 0, frequency: 'annual' },
  'db:trade_remedy_cases': { perUpdate: 0, frequency: 'weekly' },
  'db:vat_gst_rates': { perUpdate: 0, frequency: 'quarterly' },
  'hs_classification_llm': { perUpdate: 0.001, frequency: 'per_call' },
};

/** Calculate estimated monthly data management cost */
export function getEstimatedMonthlyCost(): { fixed: number; variable: number; total: number } {
  const variable = 0; // Most data sources are free government/international org data
  return {
    fixed: MONTHLY_FIXED_COSTS.total,
    variable,
    total: MONTHLY_FIXED_COSTS.total + variable,
  };
}
