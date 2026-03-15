/**
 * F013: 10-Digit HS Code Auto-Selector — S+ Grade
 * Weighted scoring: product name (0.4) + price rule (0.3) + keyword (0.2) + frequency (0.1)
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface Hs10Result {
  hs10: string;
  confidence: number;
  selectionMethod: 'exact_match' | 'price_rule' | 'keyword' | 'ai';
  alternatives: Array<{ hs10: string; score: number; reason: string }>;
  explanation: string;
}

export async function selectHs10(params: {
  hs6: string;
  productName: string;
  price?: number;
  country: string;
}): Promise<Hs10Result> {
  const sb = getSupabase();
  const { hs6, productName, price, country } = params;
  const nameLower = productName.toLowerCase();

  // Get all HS10 candidates for this HS6 + country
  const { data: candidates } = await sb
    .from('gov_tariff_schedules')
    .select('hs_code, description, duty_rate')
    .eq('country_code', country.toUpperCase())
    .like('hs_code', `${hs6}%`)
    .limit(20);

  if (!candidates || candidates.length === 0) {
    return {
      hs10: hs6 + '0000',
      confidence: 0.5,
      selectionMethod: 'ai',
      alternatives: [],
      explanation: `No country-specific codes found for ${hs6} in ${country}. Using generic extension.`,
    };
  }

  if (candidates.length === 1) {
    return {
      hs10: candidates[0].hs_code,
      confidence: 0.99,
      selectionMethod: 'exact_match',
      alternatives: [],
      explanation: `Only one HS10 code exists for ${hs6} in ${country}.`,
    };
  }

  // Score each candidate
  const scored = candidates.map(c => {
    let score = 0;
    const desc = (c.description || '').toLowerCase();
    const reasons: string[] = [];

    // Product name match (weight 0.4)
    const nameTokens = nameLower.split(/\s+/);
    const matchedTokens = nameTokens.filter(t => t.length > 2 && desc.includes(t));
    const nameScore = nameTokens.length > 0 ? matchedTokens.length / nameTokens.length : 0;
    score += nameScore * 0.4;
    if (nameScore > 0) reasons.push(`name match: ${matchedTokens.join(', ')}`);

    // Price rule (weight 0.3)
    if (price !== undefined && desc) {
      const overMatch = desc.match(/valued?\s+over\s+\$?([\d,.]+)/i);
      const underMatch = desc.match(/valued?\s+(?:not\s+over|under)\s+\$?([\d,.]+)/i);

      if (overMatch) {
        const threshold = parseFloat(overMatch[1].replace(/,/g, ''));
        if (price > threshold) { score += 0.3; reasons.push(`price $${price} > $${threshold}`); }
      }
      if (underMatch) {
        const threshold = parseFloat(underMatch[1].replace(/,/g, ''));
        if (price <= threshold) { score += 0.3; reasons.push(`price $${price} <= $${threshold}`); }
      }
      if (!overMatch && !underMatch) score += 0.15; // No price condition = neutral
    } else {
      score += 0.15;
    }

    // Keyword match (weight 0.2)
    const keywords = ['cotton', 'synthetic', 'wool', 'silk', 'leather', 'plastic', 'metal', 'wood', 'glass', 'rubber', 'organic', 'man-made', 'natural'];
    const kwMatches = keywords.filter(k => nameLower.includes(k) && desc.includes(k));
    score += (kwMatches.length > 0 ? 0.2 : 0);
    if (kwMatches.length > 0) reasons.push(`keyword: ${kwMatches.join(', ')}`);

    // Frequency/position (weight 0.1) — first candidate gets slight preference
    score += 0.1 * (1 - candidates.indexOf(c) / candidates.length);

    return { hs10: c.hs_code, score, reason: reasons.join('; ') || 'position-based', description: c.description };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    hs10: best.hs10,
    confidence: Math.min(0.99, best.score),
    selectionMethod: best.score > 0.7 ? 'exact_match' : best.score > 0.4 ? 'keyword' : 'ai',
    alternatives: scored.slice(1, 4).map(s => ({ hs10: s.hs10, score: Math.round(s.score * 100) / 100, reason: s.reason })),
    explanation: `Selected ${best.hs10} (score ${best.score.toFixed(2)}): ${best.reason}`,
  };
}
