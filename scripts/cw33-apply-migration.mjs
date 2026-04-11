#!/usr/bin/env node
/**
 * Apply a migration SQL file to Supabase via the REST RPC `exec_sql` function.
 * Falls back to splitting statements and using direct postgres connection if
 * exec_sql is not available.
 *
 * Usage: node scripts/cw33-apply-migration.mjs supabase/migrations/062_cw33_foundation.sql
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/cw33-apply-migration.mjs <migration.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(file, 'utf8');
console.log(`Applying ${file} (${sql.length} chars)...`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = new URL(url).hostname.split('.')[0];

// Supabase Management API requires an access token, not service role key.
// Easier route: use postgres-meta via the project's built-in REST by calling
// the `rpc` wrapper `exec_sql` if it exists, otherwise print the SQL so the
// user can paste it into the SQL editor.
const sb = createClient(url, key);

// Try Supabase Management API first (SUPABASE_MGMT_TOKEN)
const mgmtToken = process.env.SUPABASE_MGMT_TOKEN;
if (mgmtToken) {
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mgmtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      console.log(`✓ Applied via Management API. Rows: ${JSON.stringify(data).slice(0, 200)}`);
      process.exit(0);
    } else {
      const text = await res.text();
      console.log(`Management API error (${res.status}): ${text.slice(0, 300)}`);
    }
  } catch (e) {
    console.log(`Management API failed: ${e.message}`);
  }
}

// Try RPC second
try {
  const { data, error } = await sb.rpc('exec_sql', { sql });
  if (error) {
    console.log(`rpc('exec_sql') not available: ${error.message}`);
  } else {
    console.log('✓ Applied via rpc(exec_sql):', data);
    process.exit(0);
  }
} catch (e) {
  console.log(`rpc('exec_sql') failed: ${e.message}`);
}

// Fallback: use the Postgres REST endpoint directly via pg (if installed)
try {
  const pgModule = await import('pg').catch(() => null);
  if (!pgModule) {
    throw new Error('pg package not available');
  }
  const { Client } = pgModule.default || pgModule;
  // Derive the direct DB URL from the supabase URL (pooler endpoint)
  const dbUrl = process.env.DATABASE_URL ||
                process.env.POSTGRES_URL ||
                process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL / POSTGRES_URL / SUPABASE_DB_URL not set in .env.local');
  }
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to Postgres directly.');
  const result = await client.query(sql);
  console.log('✓ Migration applied via direct pg connection.');
  await client.end();
  process.exit(0);
} catch (e) {
  console.error(`Direct pg failed: ${e.message}`);
}

console.error('\n⚠️  Could not apply migration automatically.');
console.error('Paste the SQL into the Supabase SQL editor manually:');
console.error(`  https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.error(`\nFile: ${file}`);
process.exit(2);
