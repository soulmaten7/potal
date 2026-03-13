/**
 * POTAL — WDC Category → HS 6-digit Mapping Import
 *
 * Imports WDC (Web Data Commons) product categories mapped to HS codes.
 * Uses extracted product samples as representative examples per category.
 *
 * Usage:
 *   npx tsx scripts/import-wdc-category-hs.ts
 *   npx tsx scripts/import-wdc-category-hs.ts --dry-run
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── WDC Category → HS 6-digit Mapping ──────────
// 147 standard e-commerce categories mapped to HS6 codes

const WDC_CATEGORY_HS: Record<string, string> = {
  // Apparel & Fashion
  'accessories': '420292',
  'activewear': '611020',
  'clothing': '620342',
  'coats': '620293',
  'costumes': '950510',
  'dresses': '620442',
  'jackets': '620293',
  'pants': '620342',
  'shirts': '610510',
  'shoes': '640411',
  'swimwear': '611241',
  'underwear': '620711',
  'eyewear': '900490',
  'maternity': '620462',

  // Electronics
  'audio': '851821',
  'batteries': '850760',
  'cables': '854449',
  'cameras': '852580',
  'computers': '847130',
  'electronics': '854231',
  'gaming': '950450',
  'headphones': '851830',
  'laptops': '847130',
  'monitors': '852849',
  'networking': '851762',
  'phones': '851712',
  'printers': '844332',
  'projectors': '852869',
  'software': '852380',
  'speakers': '851821',
  'tablets': '847130',
  'televisions': '852872',

  // Home & Living
  'appliances': '851679',
  'air purifiers': '842139',
  'bath': '630260',
  'bedding': '630210',
  'decor': '830629',
  'dishwashers': '842211',
  'fans': '841451',
  'furniture': '940360',
  'heaters': '851629',
  'home': '940490',
  'kitchen': '732393',
  'laundry': '340111',
  'lighting': '940540',
  'microwaves': '851650',
  'refrigerators': '841810',
  'rugs': '570242',
  'storage': '940600',
  'washing machines': '845011',

  // Food & Beverages
  'beer': '220300',
  'beverages': '220290',
  'candy': '170490',
  'chocolate': '180690',
  'coffee': '090121',
  'condiments': '210390',
  'dairy': '040690',
  'food': '210690',
  'fruits': '081190',
  'grains': '190219',
  'meat': '160250',
  'pasta': '190219',
  'sauces': '210390',
  'snacks': '190590',
  'spices': '091099',
  'tea': '090240',
  'vegetables': '070999',
  'wine': '220421',

  // Health & Beauty
  'beauty': '330499',
  'dental': '330610',
  'fragrance': '330300',
  'hair care': '330510',
  'health': '300490',
  'makeup': '330420',
  'medicine': '300490',
  'nursing': '901890',
  'personal care': '330499',
  'skin care': '330499',
  'supplements': '210690',
  'vitamins': '210690',

  // Sports & Outdoors
  'baseball': '950669',
  'basketball': '950661',
  'bicycle': '871200',
  'camping': '630622',
  'cycling': '871200',
  'fitness': '950691',
  'golf': '950651',
  'hiking': '640411',
  'hunting': '930630',
  'outdoor': '950699',
  'soccer': '950662',
  'sports': '950699',
  'tennis': '950659',

  // Toys & Games
  'action figures': '950300',
  'board games': '950490',
  'building toys': '950300',
  'card games': '950440',
  'dolls': '950300',
  'model kits': '950300',
  'puzzles': '950490',
  'stuffed animals': '950341',
  'toys': '950300',

  // Office & Media
  'books': '490199',
  'ink': '321511',
  'movies': '852349',
  'music': '852321',
  'office': '482090',
  'paper': '480256',
  'stationery': '482090',
  'toner': '370790',

  // Bags & Luggage
  'backpacks': '420292',
  'bags': '420292',
  'luggage': '420212',
  'wallets': '420231',

  // Automotive
  'automotive': '870899',
  'car parts': '870899',
  'motorcycle': '871190',
  'tires': '401110',
  'wheels': '870870',

  // Jewelry & Watches
  'jewelry': '711319',
  'watches': '910111',

  // Hardware & Tools
  'electrical': '853690',
  'hand tools': '820559',
  'hardware': '820559',
  'locks': '830130',
  'measuring tools': '901780',
  'painting': '320910',
  'plumbing': '848180',
  'power tools': '846789',
  'safety equipment': '650610',
  'security': '853110',
  'solar': '854140',
  'tools': '820559',

  // Garden & Pets
  'bird': '230990',
  'cat': '230990',
  'cleaning': '340111',
  'craft': '970110',
  'dog': '230910',
  'fish': '030289',
  'garden': '820190',
  'pet': '230910',

  // Miscellaneous
  'art': '970110',
  'baby': '950300',
  'holiday': '950510',
  'seasonal': '950510',
  'video': '852349',
};

interface MappingEntry {
  source: string;
  product_name: string;
  category: string;
  hs6: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

// Load WDC product samples if available
function loadWdcSamples(): Record<string, Array<{ name: string; category: string; original_category?: string }>> {
  const samplesPath = path.join(process.env.HOME || '', 'portal/data/wdc_standard_samples.jsonl');
  const byCategory: Record<string, Array<{ name: string; category: string; original_category?: string }>> = {};

  try {
    const lines = fs.readFileSync(samplesPath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      const obj = JSON.parse(line);
      const cat = obj.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      if (byCategory[cat].length < 5) {
        byCategory[cat].push(obj);
      }
    }
  } catch {
    // No samples file — just use category names
  }

  return byCategory;
}

function generateWdcMappings(): MappingEntry[] {
  const entries: MappingEntry[] = [];
  const samples = loadWdcSamples();

  for (const [category, hs6] of Object.entries(WDC_CATEGORY_HS)) {
    const catSamples = samples[category] || [];

    // Entry for the category itself
    entries.push({
      source: 'wdc_category',
      product_name: category.charAt(0).toUpperCase() + category.slice(1),
      category: category,
      hs6,
      confidence: 0.75,
      metadata: {
        wdc_version: '2024',
        sample_count: catSamples.length,
      },
    });

    // Entries for each product sample
    for (const sample of catSamples) {
      entries.push({
        source: 'wdc_product',
        product_name: sample.name,
        category: sample.original_category || category,
        hs6,
        confidence: 0.80,
        metadata: {
          wdc_version: '2024',
          matched_category: category,
        },
      });
    }
  }

  return entries;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const entries = generateWdcMappings();

  process.stdout.write(`Generated ${entries.length} WDC Category → HS mappings\n`);
  process.stdout.write(`  Categories: ${Object.keys(WDC_CATEGORY_HS).length}\n`);
  process.stdout.write(`  With product samples: ${entries.filter(e => e.source === 'wdc_product').length}\n`);

  if (isDryRun) {
    process.stdout.write('\nDry run — not inserting into database.\n');
    for (const e of entries.slice(0, 20)) {
      process.stdout.write(`  [${e.source}] ${e.product_name.substring(0, 50)} → ${e.hs6} (${e.confidence})\n`);
    }
    process.stdout.write(`  ... and ${entries.length - 20} more\n`);
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    process.stderr.write('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Batch insert in chunks of 100
  const CHUNK_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('product_hs_mappings').insert(chunk);

    if (error) {
      process.stderr.write(`Error at chunk ${i}: ${error.message}\n`);
      errors++;
    } else {
      inserted += chunk.length;
    }
  }

  process.stdout.write(`\nInserted ${inserted}/${entries.length} mappings (${errors} errors)\n`);

  // Verify total
  const { count } = await supabase.from('product_hs_mappings').select('*', { count: 'exact', head: true });
  process.stdout.write(`Total product_hs_mappings: ${count}\n`);
}

if (require.main === module) {
  main().catch(err => {
    process.stderr.write(`Import failed: ${err}\n`);
    process.exit(1);
  });
}

export { WDC_CATEGORY_HS };
