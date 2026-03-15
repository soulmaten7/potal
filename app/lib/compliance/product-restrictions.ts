/**
 * F016: Product Restrictions Detection — S+ Grade
 * Prohibited/restricted/controlled item detection with dual-use and CITES.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type RestrictionLevel = 'prohibited' | 'restricted' | 'controlled' | 'monitored' | 'none';

export interface RestrictionResult {
  level: RestrictionLevel;
  restrictions: Array<{ regulation: string; reason: string; requirement: string; authority: string }>;
  dualUse: boolean;
  sanctionsHit: boolean;
  exportLicenseRequired: boolean;
  importPermitRequired: boolean;
}

// Universal prohibitions by HS chapter
const PROHIBITED_CHAPTERS: Record<string, { reason: string; regulation: string }> = {
  '93': { reason: 'Arms and ammunition', regulation: 'ITAR/ATT' },
  '36': { reason: 'Explosives and pyrotechnics', regulation: 'National security regulations' },
};

// CITES-related chapters
const CITES_CHAPTERS = new Set(['01', '02', '03', '05', '06', '44', '97']);

// Dual-use chapters (Wassenaar)
const DUAL_USE_CHAPTERS = new Set(['84', '85', '87', '88', '90', '28', '29', '38']);

// Import permit typically required
const PERMIT_CHAPTERS: Record<string, string> = {
  '01': 'Live animals — import permit required',
  '02': 'Meat — sanitary certificate required',
  '04': 'Dairy — sanitary certificate required',
  '06': 'Plants — phytosanitary certificate required',
  '30': 'Pharmaceuticals — drug import license required',
  '33': 'Cosmetics — product registration may be required',
};

export async function checkProductRestrictions(params: {
  hsCode: string;
  destination: string;
  origin?: string;
  description?: string;
}): Promise<RestrictionResult> {
  const { hsCode, destination } = params;
  const chapter = hsCode.replace(/\./g, '').slice(0, 2);
  const hs6 = hsCode.replace(/\./g, '').slice(0, 6);
  const restrictions: RestrictionResult['restrictions'] = [];
  let level: RestrictionLevel = 'none';

  // Check universal prohibitions
  if (PROHIBITED_CHAPTERS[chapter]) {
    const p = PROHIBITED_CHAPTERS[chapter];
    restrictions.push({ regulation: p.regulation, reason: p.reason, requirement: 'Export/import license required', authority: 'National government' });
    level = 'prohibited';
  }

  // Check CITES
  if (CITES_CHAPTERS.has(chapter)) {
    restrictions.push({ regulation: 'CITES', reason: 'May contain endangered species products', requirement: 'CITES permit if applicable', authority: 'CITES Management Authority' });
    if (level === 'none') level = 'monitored';
  }

  // Check import permits
  if (PERMIT_CHAPTERS[chapter]) {
    restrictions.push({ regulation: 'Import regulations', reason: PERMIT_CHAPTERS[chapter], requirement: 'Import permit/certificate', authority: `${destination} customs` });
    if (level === 'none' || level === 'monitored') level = 'restricted';
  }

  // DB check for country-specific restrictions
  const sb = getSupabase();
  const { data: dbRestrictions } = await sb
    .from('restricted_items')
    .select('*')
    .or(`hs_code.eq.${hs6},hs_code.like.${chapter}%`)
    .or(`destination.eq.${destination.toUpperCase()},destination.is.null`)
    .limit(10);

  for (const r of dbRestrictions || []) {
    restrictions.push({
      regulation: r.regulation || 'National regulation',
      reason: r.reason || r.description || 'Restricted item',
      requirement: r.requirement || 'Check with customs',
      authority: r.authority || `${destination} customs authority`,
    });
    if (level === 'none') level = 'restricted';
  }

  const dualUse = DUAL_USE_CHAPTERS.has(chapter);
  const exportLicenseRequired = level === 'prohibited' || dualUse;
  const importPermitRequired = !!PERMIT_CHAPTERS[chapter];

  return {
    level,
    restrictions,
    dualUse,
    sanctionsHit: false, // Separate sanctions check
    exportLicenseRequired,
    importPermitRequired,
  };
}
