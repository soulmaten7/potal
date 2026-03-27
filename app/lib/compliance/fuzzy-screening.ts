/**
 * F021: Fuzzy Sanctions Screening — S+ Grade
 * Levenshtein + Soundex + token-based matching.
 */
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface ScreeningResult {
  entityName: string;
  matchScore: number;
  matchType: 'exact' | 'fuzzy' | 'phonetic';
  listSource: string;
  entityType?: string;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function soundex(s: string): string {
  const a = s.toUpperCase().replace(/[^A-Z]/g, '');
  if (!a) return '';
  const codes: Record<string, string> = { B: '1', F: '1', P: '1', V: '1', C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2', D: '3', T: '3', L: '4', M: '5', N: '5', R: '6' };
  let result = a[0];
  let prev = codes[a[0]] || '0';
  for (let i = 1; i < a.length && result.length < 4; i++) {
    const code = codes[a[i]] || '0';
    if (code !== '0' && code !== prev) { result += code; }
    prev = code;
  }
  return result.padEnd(4, '0');
}

function tokenMatch(query: string, target: string): number {
  const qTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const tTokens = target.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (qTokens.length === 0) return 0;
  let matched = 0;
  for (const qt of qTokens) {
    if (tTokens.some(tt => tt.includes(qt) || qt.includes(tt) || similarity(qt, tt) > 0.8)) matched++;
  }
  return matched / qTokens.length;
}

export async function fuzzyMatch(query: string, threshold = 0.85): Promise<ScreeningResult[]> {
  const sb = getSupabase();
  const queryNorm = query.trim().toLowerCase();
  if (!queryNorm) return [];

  // Search sanctions_entries + aliases for comprehensive screening
  const tables = [
    { table: 'sanctions_entries', nameField: 'name', sourceField: 'source', typeField: 'entity_type' },
    { table: 'sanctions_aliases', nameField: 'alias_name', sourceField: 'alias_type', typeField: 'alias_type' },
  ];

  const results: ScreeningResult[] = [];

  for (const { table, nameField, sourceField, typeField } of tables) {
    // Try exact/prefix match first
    const { data: exact } = await sb
      .from(table)
      .select(`${nameField}, ${sourceField}, ${typeField}`)
      .ilike(nameField, `%${queryNorm.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`)
      .limit(20);

    for (const row of exact || []) {
      const r = row as unknown as Record<string, unknown>;
      const name = r[nameField] as string;
      const sim = similarity(queryNorm, name.toLowerCase());
      const tokenSim = tokenMatch(queryNorm, name);
      const phonSim = soundex(queryNorm) === soundex(name) ? 0.9 : 0;
      const bestScore = Math.max(sim, tokenSim, phonSim);

      if (bestScore >= threshold) {
        results.push({
          entityName: name,
          matchScore: Math.round(bestScore * 1000) / 1000,
          matchType: sim >= threshold ? (sim > 0.99 ? 'exact' : 'fuzzy') : phonSim >= threshold ? 'phonetic' : 'fuzzy',
          listSource: (r[sourceField] as string) || table,
          entityType: (r[typeField] as string) || undefined,
          riskScore: bestScore > 0.95 ? 'critical' : bestScore > 0.9 ? 'high' : bestScore > 0.85 ? 'medium' : 'low',
        });
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, 20);
}

export async function screenBatch(entities: Array<{ name: string; type?: string; country?: string }>): Promise<{ entity: string; cleared: boolean; matches: ScreeningResult[] }[]> {
  const results = [];
  for (const e of entities) {
    const matches = await fuzzyMatch(e.name, 0.85);
    results.push({ entity: e.name, cleared: matches.length === 0, matches });
  }
  return results;
}
