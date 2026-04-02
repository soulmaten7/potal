# 터미널 — 1000건 9-Field 벤치마크
# 5,621개 subheading에서 1000개 상품 자동 생성 (9-Field 완전) → v3 파이프라인 벤치마크
# 결과: /Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_results.json

## 실행 명령어 (전체 복사-붙여넣기)

```bash
cd /Volumes/soulmaten/POTAL/portal

# ═══════════════════════════════════════════════════════════
# Phase 1: 1000건 9-Field 테스트 데이터 생성
# codified-subheadings.ts에서 HS6 description 파싱 → 9-Field 상품 역생성
# ═══════════════════════════════════════════════════════════

cat << 'GENSCRIPT' > /Volumes/soulmaten/POTAL/7field_benchmark/generate_1000_products.ts
/**
 * POTAL 1000건 9-Field 벤치마크 데이터 생성기
 *
 * 원리: 5,621개 subheading description에서 역으로 상품을 생성
 * - description에 material, processing 등이 명시되어 있으므로
 * - 이를 기반으로 9-Field를 채우면 정답(ground truth)이 자동으로 결정됨
 *
 * 9 Fields: product_name, material, origin_country, category, description,
 *           processing, composition, weight_spec, price
 */

import { getSubheadingConditions } from '../app/lib/cost-engine/gri-classifier/data/codified-subheadings';

// ═══ 국가 풀 (실제 무역 비중 기반) ═══
const COUNTRIES = [
  'CN','US','DE','JP','KR','IN','VN','IT','FR','GB',
  'TW','TH','MY','ID','TR','MX','BR','PL','CZ','NL',
  'BE','ES','CA','AU','CH','SE','AT','DK','FI','NO',
];

// ═══ HS Chapter → 카테고리 매핑 ═══
const CHAPTER_CATEGORIES: Record<string, string> = {
  '01':'live animals','02':'meat','03':'fish','04':'dairy','05':'animal products',
  '06':'plants','07':'vegetables','08':'fruits','09':'coffee tea spices','10':'cereals',
  '11':'milling products','12':'oil seeds','13':'lac gums','14':'vegetable materials',
  '15':'fats oils','16':'meat preparations','17':'sugars','18':'cocoa','19':'cereal preparations',
  '20':'vegetable preparations','21':'food preparations','22':'beverages','23':'food waste',
  '24':'tobacco','25':'salt sulphur','26':'ores','27':'mineral fuels',
  '28':'inorganic chemicals','29':'organic chemicals','30':'pharmaceuticals',
  '31':'fertilizers','32':'tanning extracts','33':'essential oils cosmetics','34':'soap',
  '35':'albuminoidal substances','36':'explosives','37':'photographic','38':'chemical products',
  '39':'plastics','40':'rubber','41':'raw hides leather','42':'leather articles',
  '43':'furskins','44':'wood','45':'cork','46':'straw articles',
  '47':'wood pulp','48':'paper','49':'printed books',
  '50':'silk','51':'wool','52':'cotton','53':'vegetable textile fibres',
  '54':'man-made filaments','55':'man-made staple fibres','56':'wadding felt',
  '57':'carpets','58':'special woven fabrics','59':'coated fabrics','60':'knitted fabrics',
  '61':'knitted apparel','62':'woven apparel','63':'textile articles',
  '64':'footwear','65':'headgear','66':'umbrellas','67':'feathers',
  '68':'stone cement','69':'ceramic','70':'glass',
  '71':'precious stones metals','72':'iron steel','73':'iron steel articles',
  '74':'copper','75':'nickel','76':'aluminium','78':'lead','79':'zinc','80':'tin',
  '81':'other base metals','82':'tools cutlery','83':'base metal articles',
  '84':'machinery','85':'electrical equipment',
  '86':'railway','87':'vehicles','88':'aircraft','89':'ships',
  '90':'optical instruments','91':'clocks watches','92':'musical instruments',
  '93':'arms ammunition','94':'furniture lighting','95':'toys games sports',
  '96':'miscellaneous manufactured','97':'works of art',
};

// ═══ 소재 추출 패턴 ═══
const MATERIAL_PATTERNS: [RegExp, string][] = [
  [/\bcotton\b/i, 'cotton'], [/\bwool\b/i, 'wool'], [/\bsilk\b/i, 'silk'],
  [/\bsynthetic\b|\bman-made\b|\bpolyester\b|\bnylon\b|\bacrylic\b/i, 'synthetic'],
  [/\bflax\b|\blinen\b/i, 'flax'], [/\brubber\b/i, 'rubber'],
  [/\bplastic[s]?\b/i, 'plastic'], [/\bglass\b/i, 'glass'],
  [/\bleather\b/i, 'leather'], [/\bwood\b|\bbamboo\b/i, 'wood'],
  [/\biron\b|\bsteel\b|\bstainless\b/i, 'steel'], [/\bcopper\b/i, 'copper'],
  [/\balumini?um\b/i, 'aluminium'], [/\bpaper\b|\bpaperboard\b/i, 'paper'],
  [/\bceramic\b|\bporcelain\b|\bstoneware\b/i, 'ceramic'],
  [/\bgold\b|\bsilver\b|\bplatinum\b/i, 'precious metal'],
  [/\bnickel\b/i, 'nickel'], [/\blead\b/i, 'lead'], [/\bzinc\b/i, 'zinc'],
  [/\btin\b/i, 'tin'], [/\btitanium\b/i, 'titanium'],
];

// ═══ 가공 상태 추출 패턴 ═══
const PROCESSING_PATTERNS: [RegExp, string][] = [
  [/\bfrozen\b/i, 'frozen'], [/\bfresh\b/i, 'fresh'], [/\bdried\b/i, 'dried'],
  [/\broasted\b/i, 'roasted'], [/\bsmoked\b/i, 'smoked'],
  [/\braw\b/i, 'raw'], [/\brefined\b/i, 'refined'],
  [/\bforged\b/i, 'forged'], [/\bcast\b/i, 'cast'], [/\brolled\b/i, 'rolled'],
  [/\bknitted\b|\bcrocheted\b/i, 'knitted'], [/\bwoven\b/i, 'woven'],
  [/\bpure-bred\b/i, 'pure-bred'], [/\blive\b/i, 'live'],
  [/\bprepared\b|\bpreserved\b/i, 'prepared'], [/\bconcentrated\b/i, 'concentrated'],
  [/\bground\b/i, 'ground'], [/\bcrushed\b/i, 'crushed'],
  [/\bpowdered?\b/i, 'powdered'], [/\bgalvanised\b|\bgalvanized\b/i, 'galvanized'],
  [/\bplated\b/i, 'plated'], [/\bcoated\b/i, 'coated'],
  [/\bprinted\b/i, 'printed'], [/\bdyed\b/i, 'dyed'],
  [/\bbleached\b/i, 'bleached'], [/\bunbleached\b/i, 'unbleached'],
];

// ═══ 셀러 관점 상품명 생성 ═══
function generateProductName(desc: string, material: string, chapter: string): string {
  // description에서 핵심 단어 추출하여 셀러가 쓸법한 상품명 생성
  const dl = desc.toLowerCase();

  // HS description → 일반 상품명 변환 패턴
  const simplifications: [RegExp, string][] = [
    // 의류
    [/men'?s.*(?:shirts|shirt)/i, "Men's Dress Shirt"],
    [/women'?s.*(?:shirts|blouse)/i, "Women's Blouse"],
    [/t-?shirts?/i, "T-Shirt"],
    [/trousers|pants/i, "Trousers"],
    [/skirts?/i, "Skirt"],
    [/dresses?\b/i, "Dress"],
    [/jackets?/i, "Jacket"],
    [/sweaters?|pullovers?|cardigans?/i, "Sweater"],
    [/socks?\b/i, "Socks"],
    [/underwear|briefs|panties/i, "Underwear"],
    [/gloves?\b/i, "Gloves"],
    [/scarves?|shawls?/i, "Scarf"],
    [/ties?\b.*neck/i, "Necktie"],
    // 신발
    [/(?:sports?|athletic)\s*footwear/i, "Athletic Shoes"],
    [/(?:ski|snowboard)\s*boots?/i, "Ski Boots"],
    [/boots?\b/i, "Boots"],
    [/sandals?/i, "Sandals"],
    [/slippers?/i, "Slippers"],
    // 식품
    [/shrimps?|prawns?/i, "Frozen Shrimp"],
    [/salmon/i, "Salmon Fillet"],
    [/tuna/i, "Canned Tuna"],
    [/chicken/i, "Chicken Breast"],
    [/beef|bovine/i, "Beef Cut"],
    [/pork|swine/i, "Pork Loin"],
    [/cheese/i, "Cheese"],
    [/butter/i, "Butter"],
    [/yogurt|yoghurt/i, "Yogurt"],
    [/rice\b/i, "Rice"],
    [/wheat/i, "Wheat Flour"],
    [/coffee/i, "Coffee Beans"],
    [/tea\b/i, "Green Tea"],
    [/chocolate/i, "Dark Chocolate"],
    [/wine/i, "Red Wine"],
    [/beer/i, "Craft Beer"],
    // 전자/기계
    [/laptop|notebook.*computer/i, "Laptop Computer"],
    [/mobile.*phone|smartphone/i, "Smartphone"],
    [/television|tv\b/i, "LED Television"],
    [/refrigerat/i, "Refrigerator"],
    [/washing.*machine/i, "Washing Machine"],
    [/air.*condition/i, "Air Conditioner"],
    [/motor.*vehicle|car\b|automobile/i, "Passenger Car"],
    [/bicycle/i, "Bicycle"],
    [/motorcycle/i, "Motorcycle"],
    // 가구/일반
    [/chairs?/i, "Office Chair"],
    [/tables?.*(?:dining|kitchen)/i, "Dining Table"],
    [/desks?/i, "Work Desk"],
    [/mattress/i, "Foam Mattress"],
    [/lamps?|lighting/i, "LED Desk Lamp"],
    // 도구/금속
    [/screws?\b/i, "Stainless Steel Screws"],
    [/bolts?\b/i, "Hex Bolts"],
    [/nuts?\b(?!.*coconut|.*almond)/i, "Hex Nuts"],
    [/nails?\b(?!.*finger|.*toe)/i, "Wire Nails"],
    [/pipes?\b|tubes?\b/i, "Steel Pipe"],
    [/wire\b/i, "Steel Wire"],
    // 화학
    [/acid\b/i, `${desc.split(';')[0].trim()}`],
    [/oxide/i, `${desc.split(';')[0].trim()}`],
    [/hydroxide/i, `${desc.split(';')[0].trim()}`],
  ];

  for (const [re, name] of simplifications) {
    if (re.test(dl)) {
      // material 추가
      if (material && !name.toLowerCase().includes(material.toLowerCase())) {
        const ch = parseInt(chapter);
        if (ch >= 50 && ch <= 63) return `${material.charAt(0).toUpperCase() + material.slice(1)} ${name}`;
        if (ch >= 72 && ch <= 83) return `${material.charAt(0).toUpperCase() + material.slice(1)} ${name}`;
      }
      return name;
    }
  }

  // 폴백: description 첫 부분 정리
  let name = desc.split(';')[0].trim();
  if (name.length > 60) name = name.substring(0, 60);
  return name;
}

// ═══ 9-Field 생성 ═══
interface TestProduct {
  input: {
    product_name: string;
    material: string;
    origin_country: string;
    category: string;
    description: string;
    processing: string;
    composition: string;
    weight_spec: string;
    price: number;
  };
  expected_hs6: string;
  expected_chapter: string;
  expected_heading: string;
  hs_description: string;
}

function generateProduct(code: string, desc: string, materialHint: string[], processingHint: string[], weightSpec: string | null): TestProduct {
  const chapter = code.substring(0, 2);
  const heading = code.substring(0, 4);
  const dl = desc.toLowerCase();

  // Material 추출
  let material = 'mixed';
  for (const [re, mat] of MATERIAL_PATTERNS) {
    if (re.test(dl)) { material = mat; break; }
  }
  if (materialHint.length > 0) material = materialHint[0];

  // Processing 추출
  let processing = 'finished';
  for (const [re, proc] of PROCESSING_PATTERNS) {
    if (re.test(dl)) { processing = proc; break; }
  }
  if (processingHint.length > 0) processing = processingHint[0];

  // Category
  const category = CHAPTER_CATEGORIES[chapter] || 'general merchandise';

  // Product name (셀러 관점)
  const productName = generateProductName(desc, material, chapter);

  // Origin country (랜덤)
  const origin = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

  // Composition (material 기반)
  let composition = `100% ${material}`;
  if (dl.includes('blend') || dl.includes('mixed')) {
    composition = `60% ${material}, 40% polyester`;
  }
  if (/alloy/.test(dl)) {
    composition = `${material} alloy`;
  }

  // Weight spec
  const ws = weightSpec || '';

  // Price (chapter 기반 합리적 범위)
  const ch = parseInt(chapter);
  let price = 25;
  if (ch <= 5) price = 5 + Math.random() * 50;        // 동물
  else if (ch <= 14) price = 2 + Math.random() * 30;   // 식물
  else if (ch <= 24) price = 3 + Math.random() * 40;   // 식품
  else if (ch <= 27) price = 10 + Math.random() * 100;  // 광물
  else if (ch <= 38) price = 15 + Math.random() * 200;  // 화학
  else if (ch <= 40) price = 5 + Math.random() * 50;    // 플라스틱/고무
  else if (ch <= 43) price = 20 + Math.random() * 300;  // 가죽
  else if (ch <= 46) price = 10 + Math.random() * 100;  // 목재
  else if (ch <= 49) price = 3 + Math.random() * 30;    // 종이
  else if (ch <= 63) price = 8 + Math.random() * 150;   // 섬유/의류
  else if (ch <= 67) price = 15 + Math.random() * 200;  // 신발/모자
  else if (ch <= 70) price = 10 + Math.random() * 100;  // 석재/유리
  else if (ch <= 83) price = 5 + Math.random() * 80;    // 금속
  else if (ch <= 85) price = 50 + Math.random() * 2000; // 기계/전자
  else if (ch <= 89) price = 100 + Math.random() * 5000;// 운송
  else if (ch <= 92) price = 20 + Math.random() * 500;  // 정밀/시계/악기
  else if (ch <= 97) price = 10 + Math.random() * 200;  // 기타
  price = Math.round(price * 100) / 100;

  // Description (셀러 관점)
  const descParts = desc.split(';');
  const sellerDesc = descParts.length > 1
    ? `${productName}. ${descParts.slice(1).join(', ').trim()}`
    : `${productName}. ${material} product for ${category}`;

  return {
    input: {
      product_name: productName,
      material,
      origin_country: origin,
      category,
      description: sellerDesc.substring(0, 200),
      processing,
      composition,
      weight_spec: ws,
      price,
    },
    expected_hs6: code,
    expected_chapter: chapter,
    expected_heading: heading,
    hs_description: desc,
  };
}

// ═══ 메인: 1000개 생성 ═══
async function main() {
  console.log('═══ POTAL 1000건 9-Field 벤치마크 데이터 생성 ═══\n');

  // 전체 subheading 수집
  const allSubheadings: { code: string; desc: string; materialHint: string[]; processingHint: string[]; weightSpec: string | null }[] = [];

  // 모든 heading 코드 순회 (0101~9706)
  for (let ch = 1; ch <= 97; ch++) {
    const chStr = ch.toString().padStart(2, '0');
    // 각 chapter 내 heading 순회
    for (let hd = 1; hd <= 99; hd++) {
      const hdStr = chStr + hd.toString().padStart(2, '0');
      const subs = getSubheadingConditions(hdStr);
      if (subs && subs.length > 0) {
        for (const s of subs) {
          // n.e.c./other 제외 (정답 확인이 애매하므로)
          const dl = s.description.toLowerCase();
          if (dl.includes('n.e.c.') || dl.includes('n.e.s.') || dl === 'other' || dl.endsWith('; other')) continue;
          // 너무 짧은 description 제외
          if (s.description.length < 10) continue;

          allSubheadings.push({
            code: s.code,
            desc: s.description,
            materialHint: s.material_hint || [],
            processingHint: s.processing_hint || [],
            weightSpec: s.weight_spec || null,
          });
        }
      }
    }
  }

  console.log(`총 subheading 후보: ${allSubheadings.length}개 (n.e.c. 제외)\n`);

  // 1000개 랜덤 샘플링 (chapter 골고루 분포)
  // Chapter별 최소 5개씩 확보 후 나머지 랜덤
  const byChapter: Record<string, typeof allSubheadings> = {};
  for (const s of allSubheadings) {
    const ch = s.code.substring(0, 2);
    if (!byChapter[ch]) byChapter[ch] = [];
    byChapter[ch].push(s);
  }

  const selected: typeof allSubheadings = [];
  const chapters = Object.keys(byChapter).sort();

  // Phase 1: 각 chapter에서 최소 3개
  for (const ch of chapters) {
    const pool = byChapter[ch];
    const take = Math.min(3, pool.length);
    for (let i = 0; i < take; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }
  }

  console.log(`Phase 1 (chapter별 최소 3개): ${selected.length}개`);

  // Phase 2: 나머지를 랜덤으로 채워서 1000개
  const remaining = Object.values(byChapter).flat();
  while (selected.length < 1000 && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.push(remaining.splice(idx, 1)[0]);
  }

  console.log(`Phase 2 (랜덤 충전): ${selected.length}개\n`);

  // 상품 생성
  const products: TestProduct[] = selected.map(s =>
    generateProduct(s.code, s.desc, s.materialHint, s.processingHint, s.weightSpec)
  );

  // 셔플
  for (let i = products.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]];
  }

  // Chapter 분포 확인
  const chapterDist: Record<string, number> = {};
  for (const p of products) {
    const ch = p.expected_chapter;
    chapterDist[ch] = (chapterDist[ch] || 0) + 1;
  }

  console.log('Chapter 분포 (상위 15):');
  const sortedCh = Object.entries(chapterDist).sort((a, b) => b[1] - a[1]);
  for (const [ch, cnt] of sortedCh.slice(0, 15)) {
    console.log(`  Ch.${ch} (${CHAPTER_CATEGORIES[ch] || '?'}): ${cnt}건`);
  }
  console.log(`  ... 총 ${Object.keys(chapterDist).length}개 chapter 커버\n`);

  // JSON 저장
  const fs = await import('fs');
  const outputPath = '/Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_products.json';
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
  console.log(`✅ ${products.length}건 저장: ${outputPath}`);
  console.log(`   파일 크기: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
GENSCRIPT

# ═══════════════════════════════════════════════════════════
# Phase 2: v3 파이프라인 벤치마크 실행
# ═══════════════════════════════════════════════════════════

cat << 'BENCHSCRIPT' > /Volumes/soulmaten/POTAL/7field_benchmark/run_1000_benchmark.ts
/**
 * POTAL v3 Pipeline — 1000건 벤치마크 실행기
 *
 * benchmark_1000_products.json → v3 파이프라인 → 정확도 측정
 * Section / Chapter / Heading / 6-digit 각각 측정
 */

import { classifyV3 } from '../app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3';
import type { ClassifyInputV3 } from '../app/lib/cost-engine/gri-classifier/types';

interface TestProduct {
  input: {
    product_name: string;
    material: string;
    origin_country: string;
    category: string;
    description: string;
    processing: string;
    composition: string;
    weight_spec: string;
    price: number;
  };
  expected_hs6: string;
  expected_chapter: string;
  expected_heading: string;
  hs_description: string;
}

interface BenchmarkResult {
  idx: number;
  product_name: string;
  expected_hs6: string;
  actual_hs6: string;
  section_match: boolean;
  chapter_match: boolean;
  heading_match: boolean;
  hs6_match: boolean;
  confidence: number;
  matched_by_heading: string;
  matched_by_subheading: string;
  time_ms: number;
  error?: string;
}

async function main() {
  const fs = await import('fs');
  const inputPath = '/Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_products.json';
  const outputPath = '/Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_results.json';
  const summaryPath = '/Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_summary.json';

  // 로드
  const products: TestProduct[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`═══ POTAL v3 Pipeline — ${products.length}건 벤치마크 ═══\n`);

  const results: BenchmarkResult[] = [];
  let sectionCorrect = 0, chapterCorrect = 0, headingCorrect = 0, hs6Correct = 0;
  let errors = 0;
  const startAll = Date.now();

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    try {
      const input: ClassifyInputV3 = {
        product_name: p.input.product_name,
        material: p.input.material,
        origin_country: p.input.origin_country,
        category: p.input.category,
        description: p.input.description,
        processing: p.input.processing,
        composition: p.input.composition,
        weight_spec: p.input.weight_spec,
        price: p.input.price,
      };

      const result = await classifyV3(input);

      const expectedSection = Math.ceil(parseInt(p.expected_chapter) / 5); // 대략적 Section
      const actualChapter = result.confirmed_chapter?.toString().padStart(2, '0') || '';
      const actualHeading = result.confirmed_heading || '';
      const actualHs6 = result.confirmed_hs6 || '';

      // 매칭 확인
      const chapterMatch = actualChapter === p.expected_chapter;
      const headingMatch = actualHeading === p.expected_heading;
      const hs6Match = actualHs6 === p.expected_hs6;

      // Section은 confirmed_section 사용
      const expectedSectionReal = result.confirmed_section; // 파이프라인 Section 출력으로 비교
      // Section은 chapter가 맞으면 Section도 맞은 것으로 간주 (Section→Chapter는 결정적)
      const sectionMatch = chapterMatch; // chapter가 맞으면 section도 맞음

      if (sectionMatch) sectionCorrect++;
      if (chapterMatch) chapterCorrect++;
      if (headingMatch) headingCorrect++;
      if (hs6Match) hs6Correct++;

      // Heading/Subheading matched_by 추출
      const headingStep = result.decision_path?.find(d => d.step.includes('Heading'));
      const subheadingStep = result.decision_path?.find(d => d.step.includes('Subheading'));

      results.push({
        idx: i + 1,
        product_name: p.input.product_name,
        expected_hs6: p.expected_hs6,
        actual_hs6: actualHs6,
        section_match: sectionMatch,
        chapter_match: chapterMatch,
        heading_match: headingMatch,
        hs6_match: hs6Match,
        confidence: result.confidence,
        matched_by_heading: headingStep?.output_summary?.match(/\((.*?)\)/)?.[1] || '',
        matched_by_subheading: subheadingStep?.output_summary?.match(/\((.*?)\)/)?.[1] || '',
        time_ms: result.processing_time_ms,
      });

    } catch (err: any) {
      errors++;
      results.push({
        idx: i + 1,
        product_name: p.input.product_name,
        expected_hs6: p.expected_hs6,
        actual_hs6: 'ERROR',
        section_match: false,
        chapter_match: false,
        heading_match: false,
        hs6_match: false,
        confidence: 0,
        matched_by_heading: '',
        matched_by_subheading: '',
        time_ms: 0,
        error: err.message?.substring(0, 100),
      });
    }

    // 진행률 (100건마다)
    if ((i + 1) % 100 === 0) {
      const elapsed = ((Date.now() - startAll) / 1000).toFixed(1);
      console.log(`  [${i + 1}/${products.length}] ${elapsed}s — HS6: ${hs6Correct}/${i + 1} (${((hs6Correct / (i + 1)) * 100).toFixed(1)}%)`);
    }
  }

  const totalTime = Date.now() - startAll;

  // ═══ 결과 요약 ═══
  const total = products.length;
  const summary = {
    total_products: total,
    section_accuracy: `${((sectionCorrect / total) * 100).toFixed(1)}%`,
    chapter_accuracy: `${((chapterCorrect / total) * 100).toFixed(1)}%`,
    heading_accuracy: `${((headingCorrect / total) * 100).toFixed(1)}%`,
    hs6_accuracy: `${((hs6Correct / total) * 100).toFixed(1)}%`,
    section_correct: sectionCorrect,
    chapter_correct: chapterCorrect,
    heading_correct: headingCorrect,
    hs6_correct: hs6Correct,
    errors,
    total_time_ms: totalTime,
    avg_time_ms: Math.round(totalTime / total),
    ai_calls: 0,
    cost: '$0',

    // 오류 분석
    wrong_chapter: results.filter(r => !r.chapter_match && !r.error).length,
    wrong_heading_right_chapter: results.filter(r => r.chapter_match && !r.heading_match && !r.error).length,
    wrong_hs6_right_heading: results.filter(r => r.heading_match && !r.hs6_match && !r.error).length,

    // Chapter별 정확도
    chapter_breakdown: {} as Record<string, { total: number; hs6_correct: number; pct: string }>,

    // matched_by 분포
    heading_method_dist: {} as Record<string, number>,
    subheading_method_dist: {} as Record<string, number>,
  };

  // Chapter별 분석
  for (const r of results) {
    const ch = r.expected_hs6.substring(0, 2);
    if (!summary.chapter_breakdown[ch]) {
      summary.chapter_breakdown[ch] = { total: 0, hs6_correct: 0, pct: '0%' };
    }
    summary.chapter_breakdown[ch].total++;
    if (r.hs6_match) summary.chapter_breakdown[ch].hs6_correct++;
  }
  for (const ch of Object.keys(summary.chapter_breakdown)) {
    const b = summary.chapter_breakdown[ch];
    b.pct = `${((b.hs6_correct / b.total) * 100).toFixed(0)}%`;
  }

  // Method 분포
  for (const r of results) {
    if (r.matched_by_heading) {
      const method = r.matched_by_heading.split(',')[0];
      summary.heading_method_dist[method] = (summary.heading_method_dist[method] || 0) + 1;
    }
    if (r.matched_by_subheading) {
      const method = r.matched_by_subheading.split(',')[0];
      summary.subheading_method_dist[method] = (summary.subheading_method_dist[method] || 0) + 1;
    }
  }

  // 출력
  console.log('\n' + '═'.repeat(60));
  console.log('POTAL v3 Pipeline — 1000건 벤치마크 결과');
  console.log('═'.repeat(60));
  console.log(`\n  Section:  ${sectionCorrect}/${total} (${summary.section_accuracy})`);
  console.log(`  Chapter:  ${chapterCorrect}/${total} (${summary.chapter_accuracy})`);
  console.log(`  Heading:  ${headingCorrect}/${total} (${summary.heading_accuracy})`);
  console.log(`  HS6:      ${hs6Correct}/${total} (${summary.hs6_accuracy}) ⭐`);
  console.log(`\n  에러:     ${errors}건`);
  console.log(`  총 시간:  ${(totalTime / 1000).toFixed(1)}초 (평균 ${summary.avg_time_ms}ms/건)`);
  console.log(`  AI 호출:  0회, 비용: $0`);

  console.log(`\n오류 분포:`);
  console.log(`  Chapter 틀림: ${summary.wrong_chapter}건`);
  console.log(`  Chapter 맞지만 Heading 틀림: ${summary.wrong_heading_right_chapter}건`);
  console.log(`  Heading 맞지만 HS6 틀림: ${summary.wrong_hs6_right_heading}건`);

  // 틀린 건 TOP 20 출력
  const wrongItems = results.filter(r => !r.hs6_match && !r.error).slice(0, 20);
  if (wrongItems.length > 0) {
    console.log(`\n틀린 건 샘플 (최대 20):`);
    for (const r of wrongItems) {
      console.log(`  #${r.idx} "${r.product_name}" → expected: ${r.expected_hs6}, got: ${r.actual_hs6}`);
    }
  }

  // 저장
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log(`\n파일 저장:`);
  console.log(`  결과: ${outputPath}`);
  console.log(`  요약: ${summaryPath}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
BENCHSCRIPT

# ═══════════════════════════════════════════════════════════
# Phase 3: 빌드 + 실행
# ═══════════════════════════════════════════════════════════

# TypeScript 빌드 확인
echo "═══ npm run build 확인 ═══"
npm run build 2>&1 | tail -5

# Phase 1: 1000건 생성
echo ""
echo "═══ Phase 1: 1000건 9-Field 상품 생성 ═══"
npx tsx /Volumes/soulmaten/POTAL/7field_benchmark/generate_1000_products.ts

# Phase 2: 벤치마크 실행
echo ""
echo "═══ Phase 2: v3 파이프라인 1000건 벤치마크 ═══"
npx tsx /Volumes/soulmaten/POTAL/7field_benchmark/run_1000_benchmark.ts

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "완료! 결과 파일:"
echo "  상품 데이터: /Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_products.json"
echo "  벤치마크 결과: /Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_results.json"
echo "  요약: /Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_summary.json"
echo "═══════════════════════════════════════════════════════════"
```

## 예상 소요 시간
- Phase 1 (데이터 생성): ~10초
- Phase 2 (1000건 분류): ~5-10초 (건당 <5ms × 1000 = <5초)
- 총: ~1분 이내 (빌드 제외)

## 결과 확인 명령어
```bash
cat /Volumes/soulmaten/POTAL/7field_benchmark/benchmark_1000_summary.json | python3 -m json.tool
```
