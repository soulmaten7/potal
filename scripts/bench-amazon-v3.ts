import { classifyV3 } from './pipeline-v3';
import * as fs from 'fs';

async function main() {
  const products = JSON.parse(fs.readFileSync('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_50_products.json','utf-8'));
  process.stdout.write(`═══ Amazon 50건 v3 벤치마크 ═══\n\n`);

  const results:any[]=[];
  const t0=Date.now();

  for (let i=0;i<products.length;i++) {
    const p=products[i];
    try {
      const r=await classifyV3({
        product_name:p.product_name, material:p.material, origin_country:p.origin_country||'CN',
        category:p.category, description:p.description, processing:p.processing||'',
        composition:p.composition||'', weight_spec:p.weight_spec||'', price:p.price||undefined,
      });

      const s3=r.decision_path?.find((d:any)=>d.step.includes('Step 3'));
      const s4=r.decision_path?.find((d:any)=>d.step.includes('Step 4'));

      results.push({
        idx:i+1, asin:p.source_asin, query:p.search_query,
        product_name:p.product_name?.substring(0,60), material:p.material,
        category:p.category?.substring(0,40),
        section:r.confirmed_section, chapter:r.confirmed_chapter,
        heading:r.confirmed_heading, hs6:r.confirmed_hs6,
        confidence:r.confidence,
        heading_method:s3?.output_summary?.substring(0,50)||'',
        subheading_method:s4?.output_summary?.substring(0,50)||'',
        time_ms:r.processing_time_ms,
      });

      process.stdout.write(`✅ #${i+1} ${p.product_name?.substring(0,40).padEnd(40)} → S${r.confirmed_section}/Ch${r.confirmed_chapter}/${r.confirmed_heading}/${r.confirmed_hs6} [${r.processing_time_ms}ms]\n`);
    } catch(e:any) {
      results.push({idx:i+1,asin:p.source_asin,product_name:p.product_name?.substring(0,60),error:e.message?.substring(0,80)});
      process.stdout.write(`❌ #${i+1} ERROR: ${e.message?.substring(0,60)}\n`);
    }
  }

  const ms=Date.now()-t0;
  process.stdout.write(`\n${'═'.repeat(60)}\n`);
  process.stdout.write(`50건 완료: ${(ms/1000).toFixed(1)}s (${Math.round(ms/50)}ms/건)\n`);
  process.stdout.write(`에러: ${results.filter(r=>r.error).length}건\n`);

  // 카테고리별 요약
  const byQuery:Record<string,any[]>={};
  for(const r of results){const q=r.query||'?';if(!byQuery[q])byQuery[q]=[];byQuery[q].push(r);}
  process.stdout.write(`\n카테고리별 결과:\n`);
  for(const[q,items] of Object.entries(byQuery)){
    const chapters=items.map(i=>`Ch${i.chapter}`).join(',');
    const headings=items.map(i=>i.heading||'?').join(',');
    process.stdout.write(`  ${q}: ${chapters} | Headings: ${headings}\n`);
  }

  fs.writeFileSync('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_bench_result.json',JSON.stringify(results,null,2));
  process.stdout.write(`\n✅ amazon_bench_result.json saved\n`);
}
main().catch(console.error);
