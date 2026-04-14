#!/usr/bin/env node
/**
 * CW36-SYNC: Seed classification rules from local JSON → Supabase
 * Requires: DATABASE_URL in .env.local, migration 069 applied
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function seed() {
  await client.connect();
  console.log('━━ CW36-SYNC: Seeding classification rules ━━\n');

  // 1. HS Chapter Rules
  console.log('▸ hs_chapter_rules...');
  const trees = JSON.parse(fs.readFileSync('config/chapter_decision_trees.json', 'utf-8'));
  await client.query('DELETE FROM hs_chapter_rules');
  let chCount = 0;
  for (const [code, ch] of Object.entries(trees.chapters)) {
    await client.query(
      `INSERT INTO hs_chapter_rules (chapter, description, rules, material_hints, form_hints, use_hints, cross_ref_headings, subheading_note, has_subheading_rules, note_length, rule_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (chapter) DO UPDATE SET rules=$3, material_hints=$4, form_hints=$5, use_hints=$6, cross_ref_headings=$7, subheading_note=$8, has_subheading_rules=$9, note_length=$10, rule_count=$11`,
      [code, ch.description, JSON.stringify(ch.rules), ch.materialHints || [], ch.formHints || [], ch.useHints || [],
       ch.crossRefHeadings || [], ch.subheadingNote || null, ch.hasSubheadingRules || false, ch.noteLength || 0, ch.ruleCount || 0]
    );
    chCount++;
  }
  console.log(`  ✅ ${chCount} chapters`);

  // 2. Section Notes
  console.log('▸ hs_section_notes...');
  const sections = JSON.parse(fs.readFileSync('/Volumes/soulmaten/POTAL/hs_classification_rules/section_notes.json', 'utf-8'));
  await client.query('DELETE FROM hs_section_notes');
  let snCount = 0;
  for (const s of sections) {
    const num = s.section_number ?? s.sectionNumber ?? snCount + 1;
    const roman = s.section_roman ?? s.sectionRoman ?? null;
    const note = s.section_note ?? s.note ?? s.sectionNote ?? JSON.stringify(s);
    await client.query(
      'INSERT INTO hs_section_notes (section_number, section_roman, note_text) VALUES ($1, $2, $3) ON CONFLICT (section_number) DO UPDATE SET note_text=$3',
      [num, roman, typeof note === 'string' ? note : JSON.stringify(note)]
    );
    snCount++;
  }
  console.log(`  ✅ ${snCount} sections`);

  // 3. Subheading Notes
  console.log('▸ hs_subheading_notes...');
  const subheadings = JSON.parse(fs.readFileSync('/Volumes/soulmaten/POTAL/hs_classification_rules/subheading_notes.json', 'utf-8'));
  await client.query('DELETE FROM hs_subheading_notes');
  let shCount = 0;
  for (const sh of subheadings) {
    await client.query(
      'INSERT INTO hs_subheading_notes (chapter_code, chapter_number, subheading_note) VALUES ($1, $2, $3) ON CONFLICT (chapter_code) DO UPDATE SET subheading_note=$3',
      [sh.chapter_code, sh.chapter_number, sh.subheading_note]
    );
    shCount++;
  }
  console.log(`  ✅ ${shCount} subheading notes`);

  // 4. JP Classification Rules
  console.log('▸ jp_classification_rules...');
  const jp = JSON.parse(fs.readFileSync('config/jp_classification_rules.json', 'utf-8'));
  await client.query('DELETE FROM jp_classification_rules');
  let jpCount = 0;
  for (const [, ch] of Object.entries(jp.chapters)) {
    for (const code of ch.codes) {
      const code9flat = code.code.replace(/\./g, '');
      await client.query(
        `INSERT INTO jp_classification_rules (code9, hs6, heading, chapter, chapter_title, description, duty_rate, subdivision_logic, subdivision_axis)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (code9) DO NOTHING`,
        [code9flat, code.hs6, code9flat.slice(0, 4), ch.title?.match(/\d+/)?.[0]?.padStart(2, '0') || '',
         ch.title, code.description, code.duty_rate || null, code.subdivision_logic || null, null]
      );
      jpCount++;
    }
  }
  console.log(`  ✅ ${jpCount} JP codes`);

  // Summary
  const counts = await client.query(`
    SELECT 'hs_chapter_rules' AS tbl, COUNT(*)::int AS cnt FROM hs_chapter_rules
    UNION ALL SELECT 'hs_section_notes', COUNT(*)::int FROM hs_section_notes
    UNION ALL SELECT 'hs_subheading_notes', COUNT(*)::int FROM hs_subheading_notes
    UNION ALL SELECT 'jp_classification_rules', COUNT(*)::int FROM jp_classification_rules
  `);
  console.log('\n━━ SEED COMPLETE ━━');
  for (const r of counts.rows) console.log(`  ${r.tbl}: ${r.cnt}`);

  await client.end();
}

seed().catch(e => { console.error('❌', e.message); process.exit(1); });
