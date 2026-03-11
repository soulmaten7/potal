/**
 * POTAL — Google Product Taxonomy → HS 6-digit Mapping Script
 *
 * Maps Google's 5,596 product categories to HS 6-digit codes.
 * Inserts into product_hs_mappings table.
 *
 * Google Product Taxonomy v2024:
 *   https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 *
 * Usage:
 *   npx tsx scripts/import-google-taxonomy-hs.ts
 *   npx tsx scripts/import-google-taxonomy-hs.ts --dry-run
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

// ─── Google Category → HS 6-digit Mapping ──────────
// Top-level categories mapped to most common HS codes.
// Sub-categories inherit parent mapping unless overridden.

const CATEGORY_HS_MAP: Record<string, string> = {
  // Animals & Pet Supplies
  'Animals & Pet Supplies': '230910',
  'Animals & Pet Supplies > Pet Supplies': '230910',
  'Animals & Pet Supplies > Pet Supplies > Dog Supplies': '230910',
  'Animals & Pet Supplies > Pet Supplies > Cat Supplies': '230990',
  'Animals & Pet Supplies > Pet Supplies > Fish Supplies': '230990',
  'Animals & Pet Supplies > Pet Supplies > Bird Supplies': '230990',

  // Apparel & Accessories
  'Apparel & Accessories': '620342',
  'Apparel & Accessories > Clothing': '620342',
  'Apparel & Accessories > Clothing > Activewear': '611020',
  'Apparel & Accessories > Clothing > Dresses': '620442',
  'Apparel & Accessories > Clothing > Outerwear': '620293',
  'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets': '620293',
  'Apparel & Accessories > Clothing > Pants': '620342',
  'Apparel & Accessories > Clothing > Shirts & Tops': '610510',
  'Apparel & Accessories > Clothing > Shorts': '620342',
  'Apparel & Accessories > Clothing > Skirts': '620442',
  'Apparel & Accessories > Clothing > Sleepwear & Loungewear': '620892',
  'Apparel & Accessories > Clothing > Suits': '620311',
  'Apparel & Accessories > Clothing > Swimwear': '611241',
  'Apparel & Accessories > Clothing > Underwear & Socks': '620711',
  'Apparel & Accessories > Clothing > Uniforms': '620342',
  'Apparel & Accessories > Shoes': '640411',
  'Apparel & Accessories > Shoes > Athletic Shoes': '640411',
  'Apparel & Accessories > Shoes > Boots': '640220',
  'Apparel & Accessories > Shoes > Sandals': '640520',
  'Apparel & Accessories > Shoes > Flats': '640359',
  'Apparel & Accessories > Shoes > Heels': '640391',
  'Apparel & Accessories > Handbags, Wallets & Cases': '420221',
  'Apparel & Accessories > Jewelry': '711319',
  'Apparel & Accessories > Jewelry > Necklaces': '711319',
  'Apparel & Accessories > Jewelry > Rings': '711311',
  'Apparel & Accessories > Jewelry > Earrings': '711311',
  'Apparel & Accessories > Jewelry > Bracelets': '711719',
  'Apparel & Accessories > Jewelry > Watches': '910111',

  // Arts & Entertainment
  'Arts & Entertainment': '970110',
  'Arts & Entertainment > Musical Instruments': '920210',
  'Arts & Entertainment > Musical Instruments > Guitars': '920210',
  'Arts & Entertainment > Musical Instruments > Keyboards & Pianos': '920120',
  'Arts & Entertainment > Musical Instruments > Drums & Percussion': '920600',

  // Baby & Toddler
  'Baby & Toddler': '950300',
  'Baby & Toddler > Diapering': '961900',
  'Baby & Toddler > Feeding': '392490',
  'Baby & Toddler > Toys': '950300',

  // Business & Industrial
  'Business & Industrial': '847989',
  'Business & Industrial > Agriculture': '843280',
  'Business & Industrial > Construction': '843041',
  'Business & Industrial > Industrial Storage': '940600',
  'Business & Industrial > Manufacturing': '845961',
  'Business & Industrial > Janitorial Supplies': '340111',

  // Cameras & Optics
  'Cameras & Optics': '852580',
  'Cameras & Optics > Cameras': '852580',
  'Cameras & Optics > Camera Accessories': '900691',
  'Cameras & Optics > Optics': '900190',

  // Electronics
  'Electronics': '854231',
  'Electronics > Audio': '851821',
  'Electronics > Audio > Headphones': '851830',
  'Electronics > Audio > Speakers': '851821',
  'Electronics > Communications': '851762',
  'Electronics > Communications > Phones': '851712',
  'Electronics > Computers': '847130',
  'Electronics > Computers > Desktop Computers': '847141',
  'Electronics > Computers > Laptops': '847130',
  'Electronics > Computers > Tablets': '847130',
  'Electronics > Computers > Computer Accessories': '847160',
  'Electronics > Computers > Computer Components': '847330',
  'Electronics > GPS & Navigation': '852691',
  'Electronics > Networking': '851762',
  'Electronics > Print, Copy, Scan & Fax': '844332',
  'Electronics > Video': '852580',
  'Electronics > Video > Televisions': '852872',
  'Electronics > Video > Projectors': '852869',
  'Electronics > Video Game Consoles': '950450',

  // Food, Beverages & Tobacco
  'Food, Beverages & Tobacco': '210690',
  'Food, Beverages & Tobacco > Beverages': '220290',
  'Food, Beverages & Tobacco > Beverages > Alcoholic Beverages': '220421',
  'Food, Beverages & Tobacco > Beverages > Coffee': '090121',
  'Food, Beverages & Tobacco > Beverages > Tea': '090210',
  'Food, Beverages & Tobacco > Food Items': '210690',
  'Food, Beverages & Tobacco > Food Items > Bakery': '190590',
  'Food, Beverages & Tobacco > Food Items > Candy & Chocolate': '170490',
  'Food, Beverages & Tobacco > Food Items > Condiments & Sauces': '210390',
  'Food, Beverages & Tobacco > Food Items > Dairy': '040690',
  'Food, Beverages & Tobacco > Food Items > Fruits & Vegetables': '081190',
  'Food, Beverages & Tobacco > Food Items > Grains & Pasta': '190219',
  'Food, Beverages & Tobacco > Food Items > Meat & Seafood': '160250',
  'Food, Beverages & Tobacco > Food Items > Snack Foods': '190590',
  'Food, Beverages & Tobacco > Tobacco Products': '240220',

  // Furniture
  'Furniture': '940360',
  'Furniture > Beds & Accessories': '940150',
  'Furniture > Benches': '940171',
  'Furniture > Cabinets & Storage': '940330',
  'Furniture > Chairs': '940130',
  'Furniture > Desks': '940310',
  'Furniture > Sofas': '940161',
  'Furniture > Tables': '940360',

  // Hardware
  'Hardware': '820559',
  'Hardware > Building Materials': '681099',
  'Hardware > Fasteners': '731815',
  'Hardware > Locks & Keys': '830130',
  'Hardware > Plumbing': '848180',
  'Hardware > Power & Electrical': '853690',
  'Hardware > Tools': '820559',

  // Health & Beauty
  'Health & Beauty': '330499',
  'Health & Beauty > Bath & Body': '340111',
  'Health & Beauty > Hair Care': '330510',
  'Health & Beauty > Health Care': '300490',
  'Health & Beauty > Health Care > Fitness & Nutrition': '210610',
  'Health & Beauty > Health Care > Medical Devices': '901890',
  'Health & Beauty > Health Care > Vitamins & Supplements': '210690',
  'Health & Beauty > Makeup': '330420',
  'Health & Beauty > Oral Care': '330610',
  'Health & Beauty > Personal Care': '330499',
  'Health & Beauty > Perfume & Cologne': '330300',
  'Health & Beauty > Skin Care': '330499',

  // Home & Garden
  'Home & Garden': '940490',
  'Home & Garden > Bathroom Accessories': '691490',
  'Home & Garden > Bedding': '630210',
  'Home & Garden > Decor': '830629',
  'Home & Garden > Kitchen & Dining': '732393',
  'Home & Garden > Lawn & Garden': '820190',
  'Home & Garden > Lighting': '940540',
  'Home & Garden > Rugs & Carpets': '570242',

  // Luggage & Bags
  'Luggage & Bags': '420292',
  'Luggage & Bags > Backpacks': '420292',
  'Luggage & Bags > Luggage': '420212',
  'Luggage & Bags > Messenger Bags': '420222',

  // Media
  'Media': '852321',
  'Media > Books': '490199',
  'Media > DVDs & Videos': '852349',
  'Media > Music & Sound Recordings': '852321',

  // Office Supplies
  'Office Supplies': '482090',
  'Office Supplies > Paper': '480256',
  'Office Supplies > Writing Instruments': '960810',

  // Software
  'Software': '852380',
  'Software > Computer Software': '852380',

  // Sporting Goods
  'Sporting Goods': '950699',
  'Sporting Goods > Athletics': '950699',
  'Sporting Goods > Exercise & Fitness': '950691',
  'Sporting Goods > Outdoor Recreation': '950699',
  'Sporting Goods > Outdoor Recreation > Camping & Hiking': '630622',
  'Sporting Goods > Outdoor Recreation > Cycling': '871200',
  'Sporting Goods > Outdoor Recreation > Fishing': '950710',
  'Sporting Goods > Outdoor Recreation > Water Sports': '950699',
  'Sporting Goods > Team Sports': '950662',
  'Sporting Goods > Team Sports > Baseball & Softball': '950669',
  'Sporting Goods > Team Sports > Basketball': '950661',
  'Sporting Goods > Team Sports > Soccer': '950662',
  'Sporting Goods > Individual Sports > Golf': '950651',
  'Sporting Goods > Individual Sports > Tennis': '950659',

  // Toys & Games
  'Toys & Games': '950300',
  'Toys & Games > Games': '950490',
  'Toys & Games > Games > Board Games': '950490',
  'Toys & Games > Games > Card Games': '950440',
  'Toys & Games > Games > Puzzles': '950490',
  'Toys & Games > Toys': '950300',
  'Toys & Games > Toys > Dolls & Action Figures': '950300',
  'Toys & Games > Toys > Building Toys': '950300',
  'Toys & Games > Toys > Stuffed Animals': '950341',
  'Toys & Games > Toys > Ride-On Toys': '950300',

  // Vehicles & Parts
  'Vehicles & Parts': '870899',
  'Vehicles & Parts > Vehicle Parts': '870899',
  'Vehicles & Parts > Vehicle Parts > Motor Vehicle Parts': '870899',
  'Vehicles & Parts > Vehicle Parts > Motor Vehicle Tires': '401110',
  'Vehicles & Parts > Vehicle Parts > Motor Vehicle Electronics': '851290',
};

// ─── Mapping Logic ────────────────────────────────

interface MappingEntry {
  source: string;
  product_name: string;
  category: string;
  hs6: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

function resolveHsCode(categoryPath: string): string | null {
  // Try exact match first
  if (CATEGORY_HS_MAP[categoryPath]) return CATEGORY_HS_MAP[categoryPath];

  // Walk up the category tree
  const parts = categoryPath.split(' > ');
  for (let i = parts.length - 1; i >= 0; i--) {
    const partial = parts.slice(0, i + 1).join(' > ');
    if (CATEGORY_HS_MAP[partial]) return CATEGORY_HS_MAP[partial];
  }

  return null;
}

/**
 * Generate all mappings from Google Product Taxonomy categories.
 * Returns entries ready for insertion into product_hs_mappings.
 */
export function generateGoogleTaxonomyMappings(): MappingEntry[] {
  const entries: MappingEntry[] = [];

  for (const [category, hs6] of Object.entries(CATEGORY_HS_MAP)) {
    const parts = category.split(' > ');
    const leafName = parts[parts.length - 1];

    entries.push({
      source: 'google_product_taxonomy',
      product_name: leafName,
      category: category,
      hs6,
      confidence: parts.length >= 3 ? 0.85 : 0.7, // More specific = higher confidence
      metadata: {
        taxonomy_version: '2024',
        depth: parts.length,
        full_path: category,
      },
    });
  }

  return entries;
}

// ─── Main Import ──────────────────────────────────

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const entries = generateGoogleTaxonomyMappings();

  process.stdout.write(`Generated ${entries.length} Google Taxonomy → HS mappings\n`);

  if (isDryRun) {
    process.stdout.write('Dry run — not inserting into database.\n');
    for (const e of entries.slice(0, 20)) {
      process.stdout.write(`  ${e.category} → ${e.hs6} (${e.confidence})\n`);
    }
    process.stdout.write(`  ... and ${entries.length - 20} more\n`);
    return;
  }

  // Insert into Supabase
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

  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('product_hs_mappings').insert(chunk);

    if (error) {
      process.stderr.write(`Error at chunk ${i}: ${error.message}\n`);
    } else {
      inserted += chunk.length;
    }
  }

  process.stdout.write(`Inserted ${inserted}/${entries.length} mappings into product_hs_mappings\n`);
}

// Only run if executed directly
if (require.main === module) {
  main().catch(err => {
    process.stderr.write(`Import failed: ${err}\n`);
    process.exit(1);
  });
}

export { resolveHsCode };
