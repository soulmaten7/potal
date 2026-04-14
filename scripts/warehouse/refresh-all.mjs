#!/usr/bin/env node
/**
 * CW34-S3-F: Local full refresh pipeline.
 * Run on mac with external drive connected.
 *
 * Steps: download → bronze → silver → gold → platinum
 *
 * Usage:
 *   node scripts/warehouse/refresh-all.mjs
 *   npm run warehouse:refresh
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';

const POTAL_ROOT = '/Volumes/soulmaten/POTAL';

async function run(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${cmd} ${args.join(' ')}`);
    const p = spawn(cmd, args, { stdio: 'inherit', cwd: process.cwd() });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
  });
}

// Pre-check
if (!fs.existsSync(POTAL_ROOT)) {
  console.error('❌ External drive not mounted at /Volumes/soulmaten/POTAL/');
  console.error('   Connect the drive and try again.');
  process.exit(1);
}

const start = Date.now();

try {
  console.log('━━ 1/5: Download sources ━━');
  await run('node', ['scripts/warehouse/download-sources.mjs']);

  console.log('\n━━ 2/5: Bronze ingest (delta — new files only) ━━');
  await run('node', ['scripts/warehouse/ingest-bronze.mjs']);

  console.log('\n━━ 3/5: Silver normalization ━━');
  await run('node', ['scripts/warehouse/build-silver.mjs']);

  console.log('\n━━ 4/5: Gold business rules ━━');
  await run('node', ['scripts/warehouse/build-gold.mjs']);

  console.log('\n━━ 5/5: Platinum Supabase load ━━');
  await run('node', ['scripts/warehouse/load-platinum.mjs']);

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n━━ ✅ Refresh complete (${elapsed} min) ━━`);
  console.log('   Run SWAP SQL in Supabase Studio to finalize.');
} catch (e) {
  console.error(`\n━━ ❌ Refresh failed: ${e.message} ━━`);
  process.exit(1);
}
