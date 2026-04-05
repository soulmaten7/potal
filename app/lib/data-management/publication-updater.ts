/**
 * Updates source-publications.json entries when monitors detect new regulations.
 * Two modes:
 * - savePublicationToDb(): Stores in Supabase (for Vercel cron, no filesystem access)
 * - updateSourcePublication(): Direct JSON file update (for local/build scripts)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SourcePublication {
  name: string;
  publication?: string;
  effectiveDate?: string | null;
  reference?: string;
  sourceUrl?: string;
  shortLabel: string;
}

interface PublicationData {
  lastManualUpdate: string;
  lastAutoUpdate?: string;
  sources: SourcePublication[];
}

const JSON_PATH = join(process.cwd(), 'data', 'source-publications.json');

export function updateSourcePublication(
  sourceName: string,
  updates: Partial<Pick<SourcePublication, 'publication' | 'effectiveDate' | 'reference' | 'shortLabel'>>
): boolean {
  try {
    const raw = readFileSync(JSON_PATH, 'utf-8');
    const data: PublicationData = JSON.parse(raw);

    const sourceIndex = data.sources.findIndex(s => s.name === sourceName);
    if (sourceIndex === -1) return false;

    const source = data.sources[sourceIndex];
    if (updates.publication) source.publication = updates.publication;
    if (updates.effectiveDate !== undefined) source.effectiveDate = updates.effectiveDate;
    if (updates.reference) source.reference = updates.reference;
    if (updates.shortLabel) source.shortLabel = updates.shortLabel;

    data.lastAutoUpdate = new Date().toISOString();
    writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

export async function savePublicationToDb(
  sourceName: string,
  updates: {
    publication?: string;
    effectiveDate?: string;
    reference?: string;
    shortLabel?: string;
  }
): Promise<boolean> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return false;

    const sb = createClient(url, key);

    const { error } = await sb.from('source_publications').upsert({
      source_name: sourceName,
      publication: updates.publication || null,
      effective_date: updates.effectiveDate || null,
      reference: updates.reference || null,
      short_label: updates.shortLabel || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_name' });

    if (error) return false;
    return true;
  } catch {
    return false;
  }
}
