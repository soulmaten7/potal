/**
 * F017-F020: Trade Remedy Calculator — S+ Grade
 * AD, CVD, Safeguard calculation with sunset tracking.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface RemedyResult {
  adDuties: Array<{ caseId: string; rate: number; amount: number; effectiveDate?: string; sunsetDate?: string; manufacturerSpecific: boolean }>;
  cvdDuties: Array<{ caseId: string; rate: number; amount: number; subsidyProgram?: string }>;
  safeguard: { applicable: boolean; rate?: number; quotaStatus?: string };
  totalAdditionalDuty: number;
  combinedEffectiveRate: number;
  alerts: Array<{ type: 'sunset_review' | 'new_petition' | 'rate_change'; message: string; date?: string }>;
}

export async function calculateRemedyDuty(params: {
  hsCode: string;
  origin: string;
  destination: string;
  value: number;
  manufacturer?: string;
}): Promise<RemedyResult> {
  const sb = getSupabase();
  const { hsCode, origin, destination, value } = params;
  const hs6 = hsCode.replace(/\./g, '').slice(0, 6);

  const result: RemedyResult = {
    adDuties: [], cvdDuties: [],
    safeguard: { applicable: false },
    totalAdditionalDuty: 0, combinedEffectiveRate: 0,
    alerts: [],
  };

  // Query trade_remedy_cases
  const { data: cases } = await sb
    .from('trade_remedy_cases')
    .select('*')
    .eq('imposing_country', destination.toUpperCase())
    .eq('exporting_country', origin.toUpperCase())
    .limit(50);

  if (!cases) return result;

  // Check HS match via trade_remedy_products
  for (const c of cases) {
    const { data: products } = await sb
      .from('trade_remedy_products')
      .select('hs_code')
      .eq('case_id', c.id)
      .like('hs_code', `${hs6}%`)
      .limit(1);

    if (!products || products.length === 0) continue;

    // Get duty rates
    const { data: duties } = await sb
      .from('trade_remedy_duties')
      .select('*')
      .eq('case_id', c.id)
      .limit(10);

    const caseType = (c.measure_type || '').toLowerCase();
    const rate = duties?.[0] ? parseFloat(duties[0].duty_rate || '0') : 0;
    const amount = Math.round(value * rate / 100 * 100) / 100;

    if (caseType.includes('anti-dumping') || caseType.includes('ad')) {
      result.adDuties.push({
        caseId: c.case_number || c.id,
        rate, amount,
        effectiveDate: c.effective_date || undefined,
        sunsetDate: c.sunset_date || undefined,
        manufacturerSpecific: !!params.manufacturer,
      });

      // Sunset alert
      if (c.sunset_date) {
        const sunset = new Date(c.sunset_date);
        const sixMonths = new Date();
        sixMonths.setMonth(sixMonths.getMonth() + 6);
        if (sunset <= sixMonths) {
          result.alerts.push({
            type: 'sunset_review',
            message: `AD case ${c.case_number} sunset review due ${c.sunset_date}`,
            date: c.sunset_date,
          });
        }
      }
    } else if (caseType.includes('countervailing') || caseType.includes('cvd')) {
      result.cvdDuties.push({ caseId: c.case_number || c.id, rate, amount });
    } else if (caseType.includes('safeguard')) {
      result.safeguard = { applicable: true, rate };
    }
  }

  const totalAD = result.adDuties.reduce((s, d) => s + d.amount, 0);
  const totalCVD = result.cvdDuties.reduce((s, d) => s + d.amount, 0);
  const totalSG = result.safeguard.applicable && result.safeguard.rate ? value * result.safeguard.rate / 100 : 0;
  result.totalAdditionalDuty = Math.round((totalAD + totalCVD + totalSG) * 100) / 100;
  result.combinedEffectiveRate = value > 0 ? Math.round(result.totalAdditionalDuty / value * 10000) / 100 : 0;

  return result;
}
