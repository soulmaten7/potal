/**
 * POTAL Denied Party Screening — DB-backed Engine
 *
 * Replaces hardcoded 65 entries with live DB queries against sanctions_entries.
 * Uses pg_trgm similarity for fuzzy matching (much faster than Levenshtein on large datasets).
 *
 * Falls back to in-memory screening (screen.ts) if DB is unavailable.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ScreeningInput,
  ScreeningResult,
  ScreeningMatch,
  ScreeningList,
} from './types';
import { screenParty as screenPartyInMemory } from './screen';

// ─── Supabase Client ──────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Source mapping ───────────────────────────────

const LIST_TO_SOURCE: Record<ScreeningList, string> = {
  OFAC_SDN: 'OFAC_SDN',
  OFAC_CONS: 'OFAC_CONS',
  OFAC_SSI: 'OFAC_SSI',
  OFAC_FSE: 'OFAC_FSE',
  OFAC_PLC: 'OFAC_PLC',
  OFAC_CAPTA: 'OFAC_CAPTA',
  OFAC_NS_MBS: 'OFAC_NS_MBS',
  OFAC_NS_CMIC: 'OFAC_NS_CMIC',
  BIS_ENTITY: 'BIS_ENTITY',
  BIS_DPL: 'BIS_DPL',
  BIS_UVL: 'BIS_UVL',
  BIS_MEU: 'BIS_MEU',
  BIS_DENIED: 'BIS_DPL',
  BIS_UNVERIFIED: 'BIS_UVL',
  STATE_DTC: 'STATE_DTC',
  STATE_ISN: 'STATE_ISN',
  EU_SANCTIONS: 'EU_SANCTIONS',
  UN_SANCTIONS: 'UN_SANCTIONS',
  UK_SANCTIONS: 'UK_SANCTIONS',
};

const ALL_LISTS: ScreeningList[] = [
  'OFAC_SDN', 'OFAC_SSI', 'OFAC_FSE', 'OFAC_PLC', 'OFAC_CAPTA',
  'OFAC_NS_MBS', 'OFAC_NS_CMIC',
  'BIS_ENTITY', 'BIS_DPL', 'BIS_UVL', 'BIS_MEU',
  'STATE_DTC', 'STATE_ISN',
  'EU_SANCTIONS', 'UN_SANCTIONS', 'UK_SANCTIONS',
];

// Comprehensively sanctioned countries (US perspective)
const SANCTIONED_COUNTRIES = new Set(['CU', 'IR', 'KP', 'SY', 'RU']);
const COUNTRY_NAMES: Record<string, string> = {
  CU: 'Cuba', IR: 'Iran', KP: 'North Korea', SY: 'Syria', RU: 'Russia',
};

// ─── DB Screening ─────────────────────────────────

/**
 * Screen a party against DB-stored sanctions lists using pg_trgm similarity.
 * Returns matches sorted by score descending.
 */
export async function screenPartyDb(input: ScreeningInput): Promise<ScreeningResult> {
  const supabase = getSupabase();

  // Fallback to in-memory if DB unavailable
  if (!supabase) {
    return screenPartyInMemory(input);
  }

  const minScore = input.minScore ?? 0.8;
  const listsToCheck = input.lists || ALL_LISTS;
  const sources = listsToCheck.map(l => LIST_TO_SOURCE[l]).filter(Boolean);
  const normalizedName = input.name.trim().toUpperCase();
  const matches: ScreeningMatch[] = [];

  try {
    // Check DB has data (cache this check for 5 min in production)
    const countResult: any = await supabase
      .from('sanctions_entries' as any)
      .select('id', { count: 'exact', head: true });

    if (countResult.error || !countResult.count || countResult.count === 0) {
      // DB empty — fallback to in-memory
      return screenPartyInMemory(input);
    }

    // Query 1: Exact/partial name match in entries
    const entryResult: any = await supabase
      .from('sanctions_entries' as any)
      .select('id, source, source_id, entity_type, name, country, programs, remarks')
      .in('source', sources)
      .eq('is_active', true)
      .ilike('name', `%${normalizedName.replace(/%/g, '\\%')}%`)
      .limit(20);

    if (entryResult.data) {
      for (const row of entryResult.data as any[]) {
        const score = calculateSimpleScore(normalizedName, row.name);
        if (score >= minScore) {
          let adjustedScore = score;
          if (input.country && row.country === input.country.toUpperCase()) {
            adjustedScore = Math.min(1.0, score + 0.1);
          }
          matches.push({
            list: row.source as ScreeningList,
            listName: getListDisplayName(row.source),
            entityName: row.name,
            matchScore: Math.round(adjustedScore * 100) / 100,
            entityType: row.entity_type || 'entity',
            country: row.country,
            programs: row.programs || [],
            isAlias: false,
            remarks: row.remarks,
          });
        }
      }
    }

    // Query 2: Alias match
    const aliasResult: any = await supabase
      .from('sanctions_aliases' as any)
      .select(`
        alias_name,
        alias_type,
        entry_id,
        sanctions_entries!inner (
          id, source, source_id, entity_type, name, country, programs, remarks
        )
      `)
      .ilike('alias_name', `%${normalizedName.replace(/%/g, '\\%')}%`)
      .limit(20);

    if (aliasResult.data) {
      for (const row of aliasResult.data as any[]) {
        const entry = row.sanctions_entries as any;
        if (!sources.includes(entry.source) || !entry) continue;

        const score = calculateSimpleScore(normalizedName, row.alias_name);
        if (score >= minScore) {
          // Don't add duplicates
          const alreadyMatched = matches.some(m =>
            m.entityName === entry.name && m.list === entry.source
          );
          if (!alreadyMatched) {
            let adjustedScore = score;
            if (input.country && entry.country === input.country.toUpperCase()) {
              adjustedScore = Math.min(1.0, score + 0.1);
            }
            matches.push({
              list: entry.source as ScreeningList,
              listName: getListDisplayName(entry.source),
              entityName: row.alias_name,
              matchScore: Math.round(adjustedScore * 100) / 100,
              entityType: entry.entity_type || 'entity',
              country: entry.country,
              programs: entry.programs || [],
              isAlias: true,
              remarks: entry.remarks,
            });
          }
        }
      }
    }

    // Query 3: Fuzzy match using pg_trgm (catches typos/variations)
    // Only if no exact matches found — avoids redundant queries
    if (matches.length === 0 && normalizedName.length >= 3) {
      const fuzzyResult: any = await supabase.rpc('search_sanctions_fuzzy', {
        search_name: normalizedName,
        min_similarity: minScore * 0.8, // Lower threshold, we'll filter after
        source_filter: sources,
        max_results: 10,
      });

      if (fuzzyResult.data) {
        for (const row of fuzzyResult.data as any[]) {
          const similarity = parseFloat(row.similarity) || 0;
          if (similarity >= minScore) {
            let adjustedScore = similarity;
            if (input.country && row.country === input.country.toUpperCase()) {
              adjustedScore = Math.min(1.0, similarity + 0.1);
            }
            matches.push({
              list: row.source as ScreeningList,
              listName: getListDisplayName(row.source),
              entityName: row.matched_name,
              matchScore: Math.round(adjustedScore * 100) / 100,
              entityType: row.entity_type || 'entity',
              country: row.country,
              programs: row.programs || [],
              isAlias: row.is_alias || false,
              remarks: row.remarks,
            });
          }
        }
      }
    }
  } catch {
    // DB error — fallback to in-memory
    return screenPartyInMemory(input);
  }

  // Add comprehensively sanctioned country warning
  if (input.country && SANCTIONED_COUNTRIES.has(input.country.toUpperCase())) {
    const cc = input.country.toUpperCase();
    matches.push({
      list: 'OFAC_SDN',
      listName: 'OFAC Country Sanctions',
      entityName: `Entity in ${COUNTRY_NAMES[cc] || cc}`,
      matchScore: 0.85,
      entityType: 'entity',
      country: cc,
      programs: [`${cc}-SANCTIONS`],
      isAlias: false,
      remarks: `${COUNTRY_NAMES[cc] || cc} is a comprehensively sanctioned country. Transactions may be prohibited or require OFAC license.`,
    });
  }

  // Sort by score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  const hasMatches = matches.length > 0;
  const status = hasMatches
    ? matches.some(m => m.matchScore >= 0.95) ? 'match' : 'potential_match'
    : 'clear';

  return {
    hasMatches,
    status,
    totalMatches: matches.length,
    matches,
    screenedInput: {
      name: input.name,
      country: input.country,
      address: input.address,
    },
    screenedAt: new Date().toISOString(),
    listsChecked: listsToCheck,
  };
}

// ─── Helpers ──────────────────────────────────────

function calculateSimpleScore(input: string, target: string): number {
  const normInput = input.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
  const normTarget = target.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();

  if (normInput === normTarget) return 1.0;
  if (normTarget.includes(normInput) || normInput.includes(normTarget)) return 0.9;

  // Token overlap
  const inputTokens = normInput.split(/\s+/).filter(t => t.length > 1);
  const targetTokens = normTarget.split(/\s+/).filter(t => t.length > 1);
  if (inputTokens.length === 0 || targetTokens.length === 0) return 0;

  let matched = 0;
  for (const it of inputTokens) {
    for (const tt of targetTokens) {
      if (it === tt) { matched++; break; }
      if (it.length >= 3 && tt.includes(it)) { matched += 0.8; break; }
      if (tt.length >= 3 && it.includes(tt)) { matched += 0.8; break; }
    }
  }
  return matched / Math.max(inputTokens.length, targetTokens.length);
}

function getListDisplayName(source: string): string {
  const names: Record<string, string> = {
    OFAC_SDN: 'OFAC SDN',
    OFAC_CONS: 'OFAC Consolidated Non-SDN',
    OFAC_SSI: 'OFAC Sectoral Sanctions',
    OFAC_FSE: 'OFAC Foreign Sanctions Evaders',
    OFAC_PLC: 'OFAC Palestinian Legislative Council',
    OFAC_CAPTA: 'OFAC CAPTA',
    OFAC_NS_MBS: 'OFAC Non-SDN Menu-Based Sanctions',
    OFAC_NS_CMIC: 'OFAC Non-SDN Chinese Military-Industrial Complex',
    BIS_ENTITY: 'BIS Entity List',
    BIS_DPL: 'BIS Denied Persons List',
    BIS_UVL: 'BIS Unverified List',
    BIS_MEU: 'BIS Military End User List',
    BIS_DENIED: 'BIS Denied Persons',
    BIS_UNVERIFIED: 'BIS Unverified List',
    STATE_DTC: 'State Dept ITAR Debarred',
    STATE_ISN: 'State Dept Nonproliferation Sanctions',
    EU_SANCTIONS: 'EU Consolidated Sanctions',
    UN_SANCTIONS: 'UN Security Council Sanctions',
    UK_SANCTIONS: 'UK HMT Financial Sanctions',
  };
  return names[source] || source;
}

/**
 * Batch screen multiple parties.
 */
export async function screenPartiesDb(inputs: ScreeningInput[]): Promise<ScreeningResult[]> {
  return Promise.all(inputs.map(screenPartyDb));
}
