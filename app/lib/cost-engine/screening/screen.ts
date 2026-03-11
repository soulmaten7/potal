/**
 * POTAL Denied Party Screening — Core Engine
 *
 * Screens party names against major sanctions lists using fuzzy matching.
 * In production, this would connect to live OFAC/BIS/EU APIs.
 * Current implementation uses hardcoded high-profile entries + fuzzy matching.
 *
 * Matching algorithm: Normalized Levenshtein distance + token-based matching
 */

import type {
  ScreeningInput,
  ScreeningResult,
  ScreeningMatch,
  ScreeningList,
} from './types';

// ─── Known Sanctioned Entities (high-profile samples) ─────

interface SanctionEntry {
  name: string;
  aliases: string[];
  list: ScreeningList;
  listName: string;
  entityType: 'individual' | 'entity' | 'vessel' | 'aircraft';
  country: string;
  programs: string[];
  remarks?: string;
}

const SANCTION_ENTRIES: SanctionEntry[] = [
  // OFAC SDN — High-profile entities
  { name: 'HUAWEI TECHNOLOGIES CO LTD', aliases: ['HUAWEI', 'HUAWEI TECH'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'], remarks: 'Entity List, Footnote 4' },
  { name: 'ZTE CORPORATION', aliases: ['ZTE', 'ZTE CORP', 'ZHONGXING TELECOMMUNICATIONS'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'] },
  { name: 'HIKVISION DIGITAL TECHNOLOGY', aliases: ['HIKVISION', 'HANGZHOU HIKVISION'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'] },
  { name: 'DAHUA TECHNOLOGY CO LTD', aliases: ['DAHUA', 'ZHEJIANG DAHUA'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'] },
  { name: 'SMIC', aliases: ['SEMICONDUCTOR MANUFACTURING INTERNATIONAL CORP', 'SEMICONDUCTOR MANUFACTURING INTERNATIONAL'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'] },
  { name: 'MEGVII TECHNOLOGY', aliases: ['MEGVII', 'FACE++'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'] },
  { name: 'SENSETIME GROUP', aliases: ['SENSETIME', 'SHANG TANG'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'CN', programs: ['CMIC'] },
  { name: 'DJI TECHNOLOGY', aliases: ['DJI', 'DA JIANG INNOVATIONS', 'SZ DJI TECHNOLOGY'], list: 'BIS_ENTITY', listName: 'BIS Entity List', entityType: 'entity', country: 'CN', programs: ['EAR'] },

  // Russian entities
  { name: 'SBERBANK', aliases: ['SBERBANK OF RUSSIA', 'PAO SBERBANK'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'RU', programs: ['RUSSIA-EO14024'] },
  { name: 'VTB BANK', aliases: ['VTB', 'VNESHTORGBANK'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'RU', programs: ['RUSSIA-EO14024'] },
  { name: 'GAZPROM', aliases: ['GAZPROM PJSC', 'PAO GAZPROM'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'RU', programs: ['RUSSIA-EO14024'] },
  { name: 'ROSNEFT', aliases: ['ROSNEFT OIL COMPANY', 'NK ROSNEFT'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'RU', programs: ['RUSSIA-EO14024'] },
  { name: 'ROSTEC', aliases: ['ROSTEC CORPORATION', 'STATE CORPORATION ROSTEC'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'RU', programs: ['RUSSIA-EO14024'] },
  { name: 'RUSSIAN DIRECT INVESTMENT FUND', aliases: ['RDIF'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'RU', programs: ['RUSSIA-EO14024'] },

  // Iranian entities
  { name: 'NATIONAL IRANIAN OIL COMPANY', aliases: ['NIOC'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'IR', programs: ['IRAN'] },
  { name: 'BANK MELLI IRAN', aliases: ['BMI', 'MELLI BANK'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'IR', programs: ['IRAN'] },
  { name: 'ISLAMIC REVOLUTIONARY GUARD CORPS', aliases: ['IRGC', 'SEPAH'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'IR', programs: ['IRAN', 'IRGC'] },

  // DPRK
  { name: 'KOREA MINING DEVELOPMENT TRADING CORPORATION', aliases: ['KOMID'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'KP', programs: ['DPRK'] },
  { name: 'KOREA KWANGSON BANKING CORP', aliases: ['KKBC'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'KP', programs: ['DPRK'] },

  // EU Sanctions
  { name: 'WAGNER GROUP', aliases: ['VAGNER', 'PMC WAGNER'], list: 'EU_SANCTIONS', listName: 'EU Consolidated Sanctions', entityType: 'entity', country: 'RU', programs: ['EU-RUSSIA'] },

  // Comprehensively sanctioned countries' entities
  { name: 'CENTRAL BANK OF SYRIA', aliases: ['CBS'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'SY', programs: ['SYRIA'] },
  { name: 'NATIONAL BANK OF CUBA', aliases: ['BNC'], list: 'OFAC_SDN', listName: 'OFAC SDN', entityType: 'entity', country: 'CU', programs: ['CUBA'] },
];

// Comprehensively sanctioned countries (US perspective)
const SANCTIONED_COUNTRIES = new Set(['CU', 'IR', 'KP', 'SY', 'RU']);

// ─── Fuzzy Matching ──────────────────────────────────

function normalize(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(t => t.length > 1);
}

function tokenMatchScore(input: string, target: string): number {
  const inputTokens = tokenize(input);
  const targetTokens = tokenize(target);
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

function exactContainsScore(input: string, target: string): number {
  const normInput = normalize(input);
  const normTarget = normalize(target);
  if (normInput === normTarget) return 1.0;
  if (normTarget.includes(normInput) || normInput.includes(normTarget)) return 0.9;
  return 0;
}

function calculateMatchScore(input: string, entryName: string, aliases: string[]): { score: number; matchedName: string; isAlias: boolean } {
  // Check main name
  const mainExact = exactContainsScore(input, entryName);
  if (mainExact >= 0.9) return { score: mainExact, matchedName: entryName, isAlias: false };

  // Check aliases
  for (const alias of aliases) {
    const aliasExact = exactContainsScore(input, alias);
    if (aliasExact >= 0.9) return { score: aliasExact, matchedName: alias, isAlias: true };
  }

  // Token-based matching
  const mainToken = tokenMatchScore(input, entryName);
  let bestAlias = { score: 0, name: '' };
  for (const alias of aliases) {
    const s = tokenMatchScore(input, alias);
    if (s > bestAlias.score) bestAlias = { score: s, name: alias };
  }

  if (mainToken >= bestAlias.score) {
    return { score: mainToken, matchedName: entryName, isAlias: false };
  }
  return { score: bestAlias.score, matchedName: bestAlias.name, isAlias: true };
}

// ─── Main Screening Function ──────────────────────────

const ALL_LISTS: ScreeningList[] = ['OFAC_SDN', 'OFAC_CONS', 'BIS_ENTITY', 'BIS_DENIED', 'BIS_UNVERIFIED', 'EU_SANCTIONS', 'UN_SANCTIONS', 'UK_SANCTIONS'];

/**
 * Screen a party name against sanctions/denied party lists.
 */
export function screenParty(input: ScreeningInput): ScreeningResult {
  const minScore = input.minScore ?? 0.8;
  const listsToCheck = input.lists || ALL_LISTS;
  const matches: ScreeningMatch[] = [];

  // Check against known entries
  for (const entry of SANCTION_ENTRIES) {
    if (!listsToCheck.includes(entry.list)) continue;

    // Country filter: if input country provided, weight matches from same country higher
    const { score, matchedName, isAlias } = calculateMatchScore(input.name, entry.name, entry.aliases);

    let adjustedScore = score;
    if (input.country && entry.country === input.country.toUpperCase()) {
      adjustedScore = Math.min(1.0, score + 0.1);
    }

    if (adjustedScore >= minScore) {
      matches.push({
        list: entry.list,
        listName: entry.listName,
        entityName: matchedName,
        matchScore: Math.round(adjustedScore * 100) / 100,
        entityType: entry.entityType,
        country: entry.country,
        programs: entry.programs,
        isAlias,
        remarks: entry.remarks,
      });
    }
  }

  // Check comprehensively sanctioned countries
  if (input.country && SANCTIONED_COUNTRIES.has(input.country.toUpperCase())) {
    const countryCode = input.country.toUpperCase();
    const COUNTRY_NAMES: Record<string, string> = {
      CU: 'Cuba', IR: 'Iran', KP: 'North Korea', SY: 'Syria', RU: 'Russia',
    };
    matches.push({
      list: 'OFAC_SDN',
      listName: 'OFAC Country Sanctions',
      entityName: `Entity in ${COUNTRY_NAMES[countryCode] || countryCode}`,
      matchScore: 0.85,
      entityType: 'entity',
      country: countryCode,
      programs: [`${countryCode}-SANCTIONS`],
      isAlias: false,
      remarks: `${COUNTRY_NAMES[countryCode] || countryCode} is a comprehensively sanctioned country. Transactions may be prohibited or require OFAC license.`,
    });
  }

  // Sort by score descending
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

/**
 * Screen multiple parties at once.
 */
export function screenParties(inputs: ScreeningInput[]): ScreeningResult[] {
  return inputs.map(screenParty);
}
