# 실제 데이터 벤치마크 — CBP 7/7 완전 데이터 92건
# 7개 필드 전부 있는 실제 상품만 테스트 (6/7도 제외)
# 소스: /Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7_with_category.json

## 실행 명령어 (전체 복사-붙여넣기)

```bash
cd /Volumes/soulmaten/POTAL/portal

# ═══════════════════════════════════════════════════════════
# CBP 7/7 완전 데이터 92건 → v3 벤치마크
# 7개 필드 전부 채워진 실제 상품 + 정답 HS6
# 6/7도 제외 — 오직 7/7만
# ═══════════════════════════════════════════════════════════

cat << 'BENCH' > /Volumes/soulmaten/POTAL/7field_benchmark/bench_7of7.ts
/**
 * POTAL v3 — CBP 7/7 완전 데이터 벤치마크
 * 7개 필드 전부 있는 92건만 테스트
 */

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';
import * as fs from 'fs';

async function main() {
  // 7/7 데이터 로드
  const dataPath = '/Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7_with_category.json';
  if (!fs.existsSync(dataPath)) {
    // fallback
    const alt = '/Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7.json';
    if (!fs.existsSync(alt)) {
      console.error('7/7 데이터 파일 없음! merged_7of7_with_category.json 또는 merged_7of7.json 필요');
      process.exit(1);
    }
  }

  const raw = JSON.parse(fs.readFileSync(
    fs.existsSync(dataPath) ? dataPath : '/Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7.json',
    'utf-8'
  ));

  console.log(`═══ POTAL v3 — CBP 7/7 완전 데이터 벤치마크 ═══`);
  console.log(`로드: ${raw.length}건 (7개 필드 전부 있는 실제 상품)\n`);

  let sOK = 0, cOK = 0, hOK = 0, h6OK = 0, errors = 0;
  const results: any[] = [];
  const t0 = Date.now();

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];

    // 필드 매핑 (CBP 7-field 형식 → ClassifyInputV3)
    const productName = item.product_name || item.subject || '';
    const material = item.material || '';
    const origin = item.origin_country || item.origin || item.country || 'US';
    const category = item.category || '';
    const description = item.description || item.goods_description || productName;
    const processing = item.processing || item.process || '';
    const composition = item.composition || '';
    const weightSpec = item.weight_spec || item.weight || '';
    const price = parseFloat(item.price || '0') || 0;
    const expectedHs6 = String(item.hs_code || item.hs6 || '').substring(0, 6);

    if (!productName || !expectedHs6 || expectedHs6.length < 6) {
      console.log(`  #${i+1} 스킵 (데이터 불완전): name="${productName}", hs6="${expectedHs6}"`);
      continue;
    }

    try {
      const input: ClassifyInputV3 = {
        product_name: productName,
        material: material,
        origin_country: origin,
        category: category,
        description: description,
        processing: processing,
        composition: composition,
        weight_spec: weightSpec,
        price: price > 0 ? price : undefined,
      };

      const r = await classifyV3(input);

      const actualCh = r.confirmed_chapter?.toString().padStart(2, '0') || '';
      const actualHd = r.confirmed_heading || '';
      const actualH6 = r.confirmed_hs6 || '';

      const expCh = expectedHs6.substring(0, 2);
      const expHd = expectedHs6.substring(0, 4);

      const cm = actualCh === expCh;
      const hm = actualHd === expHd;
      const h6m = actualH6 === expectedHs6;

      if (cm) { sOK++; cOK++; }
      if (hm) hOK++;
      if (h6m) h6OK++;

      // Heading/Subheading 매칭 방법 추출
      const hdStep = r.decision_path?.find(d => d.step.includes('Heading'));
      const shStep = r.decision_path?.find(d => d.step.includes('Subheading'));

      results.push({
        idx: i + 1,
        product_name: productName.substring(0, 80),
        material: material,
        category: category,
        expected_hs6: expectedHs6,
        actual_hs6: actualH6,
        chapter_match: cm,
        heading_match: hm,
        hs6_match: h6m,
        confidence: r.confidence,
        time_ms: r.processing_time_ms,
        heading_method: hdStep?.output_summary?.match(/\((.*?)\)/)?.[1] || '',
        subheading_method: shStep?.output_summary?.match(/\((.*?)\)/)?.[1] || '',
      });

      // 매 건 출력 (92건이니까 전부 보여줘도 OK)
      const mark = h6m ? '✅' : (hm ? '🟡' : (cm ? '🟠' : '❌'));
      console.log(`  ${mark} #${i+1} "${productName.substring(0,50)}" [${material}]`);
      if (!h6m) {
        console.log(`       expected=${expectedHs6} got=${actualH6} (ch:${cm?'O':'X'} hd:${hm?'O':'X'} h6:${h6m?'O':'X'})`);
      }

    } catch (err: any) {
      errors++;
      console.log(`  ❌ #${i+1} ERROR: ${err.message?.substring(0, 80)}`);
      results.push({
        idx: i + 1, product_name: productName.substring(0, 80),
        expected_hs6: expectedHs6, actual_hs6: 'ERROR',
        chapter_match: false, heading_match: false, hs6_match: false,
        confidence: 0, time_ms: 0, error: err.message?.substring(0, 100),
      });
    }
  }

  const elapsed = Date.now() - t0;
  const N = results.length;

  // ═══ 최종 결과 ═══
  console.log('\n' + '═'.repeat(60));
  console.log('POTAL v3 — CBP 7/7 실제 데이터 벤치마크 결과');
  console.log('═'.repeat(60));
  console.log(`\n  데이터:   CBP 7/7 완전 데이터 ${N}건 (7개 필드 전부 있음)`);
  console.log(`  Section:  ${sOK}/${N} (${(sOK/N*100).toFixed(1)}%)`);
  console.log(`  Chapter:  ${cOK}/${N} (${(cOK/N*100).toFixed(1)}%)`);
  console.log(`  Heading:  ${hOK}/${N} (${(hOK/N*100).toFixed(1)}%)`);
  console.log(`  HS6:      ${h6OK}/${N} (${(h6OK/N*100).toFixed(1)}%) ⭐`);
  console.log(`  에러:     ${errors}건`);
  console.log(`  시간:     ${(elapsed/1000).toFixed(1)}초 (${Math.round(elapsed/N)}ms/건)`);
  console.log(`  AI 호출:  0회, 비용: $0`);

  // 오류 분석
  const wrongCh = results.filter(r => !r.chapter_match && !r.error);
  const wrongHd = results.filter(r => r.chapter_match && !r.heading_match && !r.error);
  const wrongH6 = results.filter(r => r.heading_match && !r.hs6_match && !r.error);

  console.log(`\n오류 분류:`);
  console.log(`  Chapter부터 틀림: ${wrongCh.length}건`);
  console.log(`  Chapter OK → Heading 틀림: ${wrongHd.length}건`);
  console.log(`  Heading OK → HS6 틀림: ${wrongH6.length}건`);

  // Material별 정확도
  const byMat: Record<string, {total:number, ok:number}> = {};
  for (const r of results) {
    const m = r.material || 'unknown';
    if (!byMat[m]) byMat[m] = {total:0, ok:0};
    byMat[m].total++;
    if (r.hs6_match) byMat[m].ok++;
  }
  console.log(`\nMaterial별 HS6 정확도:`);
  for (const [m, d] of Object.entries(byMat).sort((a,b) => b[1].total - a[1].total)) {
    console.log(`  ${m}: ${d.ok}/${d.total} (${(d.ok/d.total*100).toFixed(0)}%)`);
  }

  // 저장
  const summary = {
    data: 'CBP 7/7 완전 데이터 (7개 필드 전부 있는 실제 상품)',
    total: N,
    section: `${(sOK/N*100).toFixed(1)}%`,
    chapter: `${(cOK/N*100).toFixed(1)}%`,
    heading: `${(hOK/N*100).toFixed(1)}%`,
    hs6: `${(h6OK/N*100).toFixed(1)}%`,
    errors,
    time_sec: +(elapsed/1000).toFixed(1),
    avg_ms: Math.round(elapsed/N),
    ai_calls: 0, cost: '$0',
    wrong_chapter: wrongCh.length,
    wrong_heading: wrongHd.length,
    wrong_hs6: wrongH6.length,
    by_material: Object.fromEntries(
      Object.entries(byMat).map(([m,d]) => [m, `${d.ok}/${d.total} (${(d.ok/d.total*100).toFixed(0)}%)`])
    ),
  };

  const outputPath = '/Volumes/soulmaten/POTAL/7field_benchmark/bench_7of7_results.json';
  const summaryPath = '/Volumes/soulmaten/POTAL/7field_benchmark/bench_7of7_summary.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n파일:`);
  console.log(`  결과: ${outputPath}`);
  console.log(`  요약: ${summaryPath}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
BENCH

# 실행
echo "═══ CBP 7/7 완전 데이터 벤치마크 실행 ═══"
npx tsx /Volumes/soulmaten/POTAL/7field_benchmark/bench_7of7.ts

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "결과 확인:"
echo "  cat /Volumes/soulmaten/POTAL/7field_benchmark/bench_7of7_summary.json | python3 -m json.tool"
echo "═══════════════════════════════════════════════════════════"
```
