/**
 * Test the keyword classifier on 50 common e-commerce products.
 * Run: npx tsx scripts/test_50_products.ts
 */

import { classifyProduct } from '../app/lib/cost-engine/hs-code/classifier';

interface TestProduct {
  name: string;
  category: string;
  expectedChapters: number[];
}

const products: TestProduct[] = [
  // Apparel (10)
  { name: 'Cotton T-Shirt', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Silk Dress', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Wool Sweater', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Denim Jeans', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Leather Jacket', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Polyester Shorts', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Linen Shirt', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Cashmere Scarf', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Nylon Windbreaker', category: 'Apparel', expectedChapters: [61, 62] },
  { name: 'Baby Onesie', category: 'Apparel', expectedChapters: [61, 62] },

  // Footwear (5)
  { name: 'Running Shoes', category: 'Footwear', expectedChapters: [64] },
  { name: 'Leather Boots', category: 'Footwear', expectedChapters: [64] },
  { name: 'Canvas Sneakers', category: 'Footwear', expectedChapters: [64] },
  { name: 'Rubber Sandals', category: 'Footwear', expectedChapters: [64] },
  { name: 'Suede Loafers', category: 'Footwear', expectedChapters: [64] },

  // Bags (5)
  { name: 'Leather Handbag', category: 'Bags', expectedChapters: [42] },
  { name: 'Canvas Backpack', category: 'Bags', expectedChapters: [42] },
  { name: 'Leather Wallet', category: 'Bags', expectedChapters: [42] },
  { name: 'Nylon Suitcase', category: 'Bags', expectedChapters: [42] },
  { name: 'Laptop Bag', category: 'Bags', expectedChapters: [42] },

  // Electronics (5)
  { name: 'Laptop Computer', category: 'Electronics', expectedChapters: [84, 85] },
  { name: 'Wireless Headphones', category: 'Electronics', expectedChapters: [84, 85] },
  { name: 'Smartphone Case', category: 'Electronics', expectedChapters: [84, 85] },
  { name: 'USB Cable', category: 'Electronics', expectedChapters: [84, 85] },
  { name: 'LED Monitor', category: 'Electronics', expectedChapters: [84, 85] },

  // Home (5)
  { name: 'Wooden Chair', category: 'Home', expectedChapters: [94, 69, 70, 63, 57] },
  { name: 'Ceramic Vase', category: 'Home', expectedChapters: [94, 69, 70, 63, 57] },
  { name: 'Cotton Towel', category: 'Home', expectedChapters: [94, 69, 70, 63, 57] },
  { name: 'Glass Lamp', category: 'Home', expectedChapters: [94, 69, 70, 63, 57] },
  { name: 'Wool Rug', category: 'Home', expectedChapters: [94, 69, 70, 63, 57] },

  // Food (5)
  { name: 'Green Tea', category: 'Food', expectedChapters: [9, 17, 18, 15, 4] },
  { name: 'Coffee Beans', category: 'Food', expectedChapters: [9, 17, 18, 15, 4] },
  { name: 'Dark Chocolate', category: 'Food', expectedChapters: [9, 17, 18, 15, 4] },
  { name: 'Olive Oil', category: 'Food', expectedChapters: [9, 17, 18, 15, 4] },
  { name: 'Organic Honey', category: 'Food', expectedChapters: [9, 17, 18, 15, 4] },

  // Cosmetics (5)
  { name: 'Perfume', category: 'Cosmetics', expectedChapters: [33, 34] },
  { name: 'Lipstick', category: 'Cosmetics', expectedChapters: [33, 34] },
  { name: 'Facial Moisturizer', category: 'Cosmetics', expectedChapters: [33, 34] },
  { name: 'Shampoo', category: 'Cosmetics', expectedChapters: [33, 34] },
  { name: 'Sunscreen SPF50', category: 'Cosmetics', expectedChapters: [33, 34] },

  // Jewelry (3)
  { name: 'Gold Necklace', category: 'Jewelry', expectedChapters: [71] },
  { name: 'Silver Ring', category: 'Jewelry', expectedChapters: [71] },
  { name: 'Diamond Earrings', category: 'Jewelry', expectedChapters: [71] },

  // Industrial (4)
  { name: 'Steel Pipe', category: 'Industrial', expectedChapters: [73, 74, 85] },
  { name: 'Copper Wire', category: 'Industrial', expectedChapters: [73, 74, 85] },
  { name: 'Solar Panel', category: 'Industrial', expectedChapters: [73, 74, 85] },
  { name: 'Electric Motor', category: 'Industrial', expectedChapters: [73, 74, 85] },

  // Toys (3)
  { name: 'Plastic Toy Car', category: 'Toys', expectedChapters: [95] },
  { name: 'Wooden Puzzle', category: 'Toys', expectedChapters: [95] },
  { name: 'Board Game', category: 'Toys', expectedChapters: [95] },
];

// ─── Run tests ───────────────────────────────────────

interface Result {
  product: string;
  category: string;
  hsCode: string;
  chapter: number;
  confidence: number;
  description: string;
  expectedChapters: number[];
  chapterCorrect: boolean;
  verdict: 'CORRECT' | 'SAFE_MISS' | 'DANGEROUS';
}

const results: Result[] = [];

for (const p of products) {
  const r = classifyProduct(p.name);
  const chapter = parseInt(r.hsCode.slice(0, 2), 10);
  const chapterCorrect = p.expectedChapters.includes(chapter);

  let verdict: Result['verdict'];
  if (chapterCorrect) {
    verdict = 'CORRECT';
  } else if (r.confidence < 0.6) {
    verdict = 'SAFE_MISS'; // Wrong chapter but low confidence → would go to LLM
  } else {
    verdict = 'DANGEROUS'; // Wrong chapter AND high confidence → bad
  }

  results.push({
    product: p.name,
    category: p.category,
    hsCode: r.hsCode,
    chapter,
    confidence: r.confidence,
    description: r.description,
    expectedChapters: p.expectedChapters,
    chapterCorrect,
    verdict,
  });
}

// ─── Print results table ─────────────────────────────

const pad = (s: string, n: number) => s.slice(0, n).padEnd(n);
const rpad = (s: string, n: number) => s.slice(0, n).padStart(n);

console.log('');
console.log('=' .repeat(130));
console.log('  POTAL Keyword Classifier — 50 Product Test');
console.log('='.repeat(130));
console.log(
  pad('Product', 24) +
  pad('Category', 13) +
  pad('HS Code', 8) +
  rpad('Ch', 4) +
  pad(' Expected', 18) +
  rpad('Conf', 6) +
  pad(' Description', 38) +
  ' Verdict'
);
console.log('-'.repeat(130));

let currentCategory = '';
for (const r of results) {
  if (r.category !== currentCategory) {
    if (currentCategory !== '') console.log('');
    currentCategory = r.category;
  }

  const expectedStr = r.expectedChapters.map(c => c.toString().padStart(2, '0')).join(',');
  const verdictIcon =
    r.verdict === 'CORRECT' ? ' OK' :
    r.verdict === 'SAFE_MISS' ? ' ~LLM' :
    ' !!!DANGER!!!';

  console.log(
    pad(r.product, 24) +
    pad(r.category, 13) +
    pad(r.hsCode, 8) +
    rpad(r.chapter.toString().padStart(2, '0'), 4) +
    ' ' + pad(expectedStr, 17) +
    rpad(r.confidence.toFixed(2), 6) +
    ' ' + pad(r.description, 37) +
    verdictIcon
  );
}

// ─── Stats ───────────────────────────────────────────

console.log('');
console.log('='.repeat(130));
console.log('  SUMMARY');
console.log('='.repeat(130));

const correct = results.filter(r => r.verdict === 'CORRECT');
const safeMiss = results.filter(r => r.verdict === 'SAFE_MISS');
const dangerous = results.filter(r => r.verdict === 'DANGEROUS');

console.log(`Total products tested: ${results.length}`);
console.log(`  CORRECT  (right chapter):             ${correct.length}/${results.length} (${(correct.length / results.length * 100).toFixed(1)}%)`);
console.log(`  SAFE_MISS (wrong ch, conf<0.6 → LLM): ${safeMiss.length}/${results.length} (${(safeMiss.length / results.length * 100).toFixed(1)}%)`);
console.log(`  DANGEROUS (wrong ch, conf>=0.6):       ${dangerous.length}/${results.length} (${(dangerous.length / results.length * 100).toFixed(1)}%)`);
console.log('');
console.log(`Effective accuracy (CORRECT + SAFE_MISS): ${correct.length + safeMiss.length}/${results.length} (${((correct.length + safeMiss.length) / results.length * 100).toFixed(1)}%)`);

// Per-category breakdown
console.log('');
console.log('Per-category breakdown:');
const categories = [...new Set(results.map(r => r.category))];
for (const cat of categories) {
  const catResults = results.filter(r => r.category === cat);
  const catCorrect = catResults.filter(r => r.verdict === 'CORRECT').length;
  const catDangerous = catResults.filter(r => r.verdict === 'DANGEROUS').length;
  const catSafe = catResults.filter(r => r.verdict === 'SAFE_MISS').length;
  console.log(`  ${pad(cat, 14)} ${catCorrect}/${catResults.length} correct, ${catSafe} safe miss, ${catDangerous} dangerous`);
}

// List dangerous cases
if (dangerous.length > 0) {
  console.log('');
  console.log('DANGEROUS CASES (wrong chapter + high confidence):');
  for (const r of dangerous) {
    console.log(`  ${r.product}: got Ch${r.chapter.toString().padStart(2, '0')} (${r.hsCode}), expected Ch${r.expectedChapters.map(c => c.toString().padStart(2, '0')).join('/')}, conf=${r.confidence}`);
  }
}

// Average confidence
const avgConf = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
const avgConfCorrect = correct.length > 0 ? correct.reduce((sum, r) => sum + r.confidence, 0) / correct.length : 0;
const avgConfWrong = (safeMiss.length + dangerous.length) > 0
  ? [...safeMiss, ...dangerous].reduce((sum, r) => sum + r.confidence, 0) / (safeMiss.length + dangerous.length)
  : 0;

console.log('');
console.log(`Average confidence (all):     ${avgConf.toFixed(3)}`);
console.log(`Average confidence (correct): ${avgConfCorrect.toFixed(3)}`);
console.log(`Average confidence (wrong):   ${avgConfWrong.toFixed(3)}`);
console.log('='.repeat(130));
