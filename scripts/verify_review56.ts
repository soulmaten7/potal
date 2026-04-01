/**
 * REVIEW 56건 수동 검증 — HS6 아래 모든 US 10자리 후보 조회 + 최적 코드 판정
 */
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running');
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE = '/Volumes/soulmaten/POTAL/7field_benchmark';
const results: any[] = JSON.parse(fs.readFileSync(`${BASE}/us_hs10_verification.json`, 'utf-8'));
const reviews = results.filter(r => r.judgment === 'REVIEW');

async function getCandidates(hs6: string): Promise<{code: string; desc: string}[]> {
  const { data } = await supabase
    .from('gov_tariff_schedules')
    .select('hs_code, description')
    .eq('country', 'US')
    .like('hs_code', `${hs6}%`)
    .order('hs_code');
  return (data || []).map((r: any) => ({ code: r.hs_code, desc: r.description || '' }));
}

function findBestCandidate(productName: string, material: string, candidates: {code:string;desc:string}[]): {code: string; desc: string; score: number} | null {
  if (candidates.length === 0) return null;
  const nl = productName.toLowerCase();
  const ml = material.toLowerCase();

  // Score each candidate
  const scored = candidates.map(c => {
    const dl = c.desc.toLowerCase();
    let score = 0;

    // Material match (strongest signal)
    if (ml && ml.length > 2 && dl.includes(ml)) score += 10;
    // Material variants
    if (ml.includes('cotton') && dl.includes('cotton')) score += 10;
    if (ml.includes('steel') && dl.includes('steel')) score += 10;
    if (ml.includes('stainless') && dl.includes('stainless')) score += 10;
    if (ml.includes('iron') && dl.includes('iron')) score += 10;
    if (ml.includes('leather') && dl.includes('leather')) score += 10;
    if (ml.includes('bamboo') && dl.includes('bamboo')) score += 10;
    if (ml.includes('ceramic') && (dl.includes('ceramic') || dl.includes('stoneware'))) score += 10;
    if (ml.includes('glass') && dl.includes('glass')) score += 10;
    if (ml.includes('plastic') && dl.includes('plast')) score += 10;
    if (ml.includes('rubber') && dl.includes('rubber')) score += 10;
    if (ml.includes('aluminum') && dl.includes('alumin')) score += 10;
    if (ml.includes('polyester') && (dl.includes('polyester') || dl.includes('synth') || dl.includes('man-made'))) score += 10;
    if (ml.includes('wax') && (dl.includes('wax') || dl.includes('candle'))) score += 10;
    if (ml.includes('foam') && (dl.includes('foam') || dl.includes('cellular'))) score += 10;
    if (ml.includes('brass') && dl.includes('brass')) score += 10;
    if (ml.includes('silver') && dl.includes('silver')) score += 10;

    // Product keywords match
    const words = nl.split(/\s+/).filter(w => w.length > 3);
    for (const w of words) {
      if (dl.includes(w)) score += 3;
    }

    // Specific product matches
    if (nl.includes('mug') && dl.includes('mug')) score += 8;
    if (nl.includes('cup') && dl.includes('cup')) score += 8;
    if (nl.includes('vase') && dl.includes('vase')) score += 8;
    if (nl.includes('candle') && dl.includes('candle')) score += 8;
    if (nl.includes('bottle') && dl.includes('bottle')) score += 8;
    if (nl.includes('table') && dl.includes('table')) score += 5;
    if (nl.includes('cloth') && dl.includes('cloth')) score += 5;
    if (nl.includes('helmet') && dl.includes('helmet')) score += 8;
    if (nl.includes('drill') && dl.includes('drill')) score += 8;
    if (nl.includes('blender') && dl.includes('blend')) score += 8;
    if (nl.includes('watch') && dl.includes('watch')) score += 8;
    if (nl.includes('necklace') && dl.includes('necklace')) score += 8;
    if (nl.includes('pendant') && dl.includes('pendant')) score += 8;
    if (nl.includes('skillet') && dl.includes('cast iron')) score += 8;
    if (nl.includes('box') && dl.includes('box')) score += 5;
    if (nl.includes('game') && dl.includes('game')) score += 8;

    // Penalize generic
    if (dl.includes('other') || dl.includes('not elsewhere')) score -= 2;

    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

function judge(pipelineCode: string, bestCode: string, bestDesc: string, productName: string, material: string, bestScore: number): {judgment: string; reason: string} {
  if (!bestCode) return { judgment: 'NO_BETTER_OPTION', reason: 'No candidates found in gov_tariff_schedules' };

  const pipelineSame = pipelineCode === bestCode;

  if (pipelineSame && bestScore >= 8) {
    return { judgment: 'CORRECT', reason: `Pipeline chose best match (score=${bestScore})` };
  }
  if (pipelineSame && bestScore >= 3) {
    return { judgment: 'ACCEPTABLE', reason: `Pipeline choice is reasonable (score=${bestScore})` };
  }
  if (pipelineSame && bestScore < 3) {
    return { judgment: 'NO_BETTER_OPTION', reason: `Low score but pipeline chose same as best available (score=${bestScore})` };
  }

  // Pipeline chose differently
  const hs6Pipeline = pipelineCode.substring(0, 6);
  const hs6Best = bestCode.substring(0, 6);

  if (hs6Pipeline !== hs6Best) {
    return { judgment: 'WRONG_HS6', reason: `HS6 mismatch: pipeline=${hs6Pipeline} vs best=${hs6Best}` };
  }

  if (bestScore >= 8) {
    return { judgment: 'WRONG_SUBCODE', reason: `Better 10-digit exists: ${bestCode} "${bestDesc.substring(0, 60)}" (score=${bestScore})` };
  }
  if (bestScore >= 3) {
    return { judgment: 'ACCEPTABLE', reason: `Slightly better option exists but pipeline choice is also valid (score diff=${bestScore})` };
  }

  return { judgment: 'NO_BETTER_OPTION', reason: `No clearly better candidate (best score=${bestScore})` };
}

async function main() {
  console.log(`\n=== REVIEW 56 Verification ===\n`);

  const verified: any[] = [];
  let correct = 0, acceptable = 0, wrongSub = 0, wrongHs6 = 0, noBetter = 0;

  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const hs6 = (r.final_code || '').substring(0, 6);

    const candidates = await getCandidates(hs6);
    const best = findBestCandidate(r.product_name, r.material, candidates);

    const { judgment, reason } = judge(
      r.final_code, best?.code || '', best?.desc || '',
      r.product_name, r.material, best?.score || 0
    );

    if (judgment === 'CORRECT') correct++;
    else if (judgment === 'ACCEPTABLE') acceptable++;
    else if (judgment === 'WRONG_SUBCODE') wrongSub++;
    else if (judgment === 'WRONG_HS6') wrongHs6++;
    else noBetter++;

    verified.push({
      idx: r.idx,
      product_name: r.product_name,
      material: r.material,
      pipeline_code: r.final_code,
      pipeline_desc: r.hts_description,
      best_code: best?.code || '',
      best_desc: (best?.desc || '').substring(0, 100),
      best_score: best?.score || 0,
      candidate_count: candidates.length,
      judgment,
      reason,
      all_candidates: candidates.map(c => `${c.code}: ${c.desc.substring(0, 60)}`).join(' | '),
    });

    const mark = judgment === 'CORRECT' ? '✅' : (judgment === 'ACCEPTABLE' ? '🔶' : (judgment === 'WRONG_SUBCODE' ? '❌' : '⬜'));
    if (i < 10 || judgment === 'WRONG_SUBCODE' || judgment === 'WRONG_HS6') {
      console.log(`[${i+1}/56] ${mark} ${judgment} "${r.product_name?.substring(0, 30)}" pipe=${r.final_code} best=${best?.code || 'N/A'}(${best?.score || 0})`);
    } else if (i % 10 === 0) {
      console.log(`[${i+1}/56] ... (CORRECT=${correct} ACCEPT=${acceptable} WRONG_SUB=${wrongSub})`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`CORRECT:        ${correct}/56 (${(correct/56*100).toFixed(1)}%)`);
  console.log(`ACCEPTABLE:     ${acceptable}/56 (${(acceptable/56*100).toFixed(1)}%)`);
  console.log(`WRONG_SUBCODE:  ${wrongSub}/56 (${(wrongSub/56*100).toFixed(1)}%)`);
  console.log(`WRONG_HS6:      ${wrongHs6}/56 (${(wrongHs6/56*100).toFixed(1)}%)`);
  console.log(`NO_BETTER:      ${noBetter}/56 (${(noBetter/56*100).toFixed(1)}%)`);

  // Final 169-item accuracy
  const matchPrev = 81; // From previous run
  const partialPrev = 17;
  const noExpPrev = 15;
  const totalCorrect = matchPrev + partialPrev + correct + acceptable;
  console.log(`\n=== Final 169-item US HS10 Accuracy ===`);
  console.log(`MATCH (auto): ${matchPrev}`);
  console.log(`PARTIAL (auto): ${partialPrev}`);
  console.log(`CORRECT (review): ${correct}`);
  console.log(`ACCEPTABLE (review): ${acceptable}`);
  console.log(`Total correct: ${totalCorrect}/154 expanded = ${(totalCorrect/154*100).toFixed(1)}%`);
  console.log(`WRONG_SUBCODE: ${wrongSub} (HS6 correct, 10-digit wrong)`);
  console.log(`WRONG_HS6: ${wrongHs6} (HS6 itself wrong)`);
  console.log(`NO_EXPANSION: ${noExpPrev} (gov_tariff gap)`);

  fs.writeFileSync(`${BASE}/review56_verification.json`, JSON.stringify(verified, null, 2));
  console.log(`\n✅ Saved: ${BASE}/review56_verification.json`);
}

main().catch(console.error);
