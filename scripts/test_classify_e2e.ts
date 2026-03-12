import { classifyProductAsync } from '../app/lib/cost-engine';

async function main() {
  const products = [
    'Cotton T-Shirt',
    'Laptop Computer',
    'Running Shoes',
    'Leather Handbag',
    'Wireless Headphones'
  ];

  console.log('=== HS Classification Pipeline Test ===\n');
  console.log('| # | Product | HS Code | Description | Method | Confidence | Alt1 |');
  console.log('|---|---------|---------|-------------|--------|------------|------|');

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      const r = await classifyProductAsync(p);
      const alt1 = r.alternatives?.[0] ? `${r.alternatives[0].hsCode} (${(r.alternatives[0].confidence * 100).toFixed(0)}%)` : 'N/A';
      console.log(`| ${i+1} | ${p} | ${r.hsCode} | ${r.description} | ${r.method} | ${(r.confidence * 100).toFixed(0)}% | ${alt1} |`);
    } catch (e: any) {
      console.log(`| ${i+1} | ${p} | ERR | ${e.message} | - | - | - |`);
    }
  }
}

main().catch(console.error);
