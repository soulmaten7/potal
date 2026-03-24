# Claude Code 명령어: Step 1 LLM 키워드 추출 강화

> **목표**: Step 1(키워드 추출)에 LLM을 붙여서 브랜드명/비표준 상품명도 정확한 HS 키워드로 변환
> **원칙**: Step 1 하나만 수정 → 벤치마크 → Step 2 변화 확인 (스텝바이스텝)
> **비용**: GPT-4o-mini 1회 추가 (~$0.0005/query)

---

## 배경: 왜 Step 1에 LLM이 필요한가

현재 Step 1 (`step01-keyword-extract.ts`)은 완전 하드코딩:
- 재료 사전 ~68개, 상품유형 사전 ~68개 고정
- "KitKat" → material: null, productType: null (브랜드명 인식 불가)
- "Used Restaurant Grease" → "grease"가 재료 사전에 없어서 material: null
- 이 빈약한 키워드가 Step 2 이후로 전파 → 누적 오류

**해결**: Step 1 맨 앞에 LLM을 붙여서 "이 상품이 뭔지" 먼저 이해시키고, 그 결과를 기존 코드에 넘김

---

## 실행 순서

### 1단계: 현재 벤치마크 기준값 기록

```bash
# 먼저 현재 v2.0 결과 확인 (이미 있으면 스킵)
cat /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v2_results.json | head -20
```

### 2단계: Step 1 코드 수정

**파일**: `app/lib/cost-engine/gri-classifier/steps/step01-keyword-extract.ts`

**수정 방향** (기존 코드 삭제 금지, 보존):

1. 기존 `extractKeywords()` 함수를 `extractKeywordsCode()`로 이름 변경 (보존)
2. 새 `extractKeywordsLLM()` 함수 생성 — LLM이 먼저 상품을 이해
3. 새 `extractKeywords()` 함수 = LLM 호출 → 결과를 기존 코드와 병합

**구조:**
```
[상품명] → extractKeywordsLLM() → LLM이 상품 이해 + HS 키워드 추출
                                      ↓
                              extractKeywordsCode() → 기존 하드코딩으로 보강/검증
                                      ↓
                              [풍부한 키워드 + material + productType]
```

### 3단계: LLM 프롬프트 작성 (핵심)

아래 프롬프트를 `step01-keyword-extract.ts`에 내장해라. **프롬프트가 길고 디테일해야 매번 동일한 결과가 나온다.**

```typescript
const STEP1_LLM_PROMPT = `You are a world-class customs classification expert. Your ONLY job is to analyze a product name and extract structured information for HS Code classification.

## YOUR TASK:
Given a product name (which may be a brand name, trade name, slang, abbreviation, or technical term), you must:
1. IDENTIFY what this product actually IS (not what it's called)
2. EXTRACT keywords relevant to HS classification
3. DETERMINE the primary material and product type

## CRITICAL RULES:
- Brand names → translate to generic product description
  Examples: "KitKat" → chocolate-covered wafer bar | "iPhone" → smartphone/mobile phone | "Levi's 501" → denim jeans/trousers | "Tylenol" → acetaminophen tablet/pharmaceutical | "Tesla Model 3" → electric passenger vehicle | "Ray-Ban Aviator" → sunglasses | "Pampers" → disposable baby diapers | "Nutella" → chocolate hazelnut spread | "Band-Aid" → adhesive bandage | "Jacuzzi" → whirlpool bath
- Trade terms → translate to HS language
  Examples: "lumber" → wood sawn/chipped | "grease" (cooking) → animal/vegetable fat/oil | "sneakers" → footwear with rubber/plastic sole | "laptop" → portable automatic data processing machine | "brake pad" → parts of motor vehicles/braking system | "rebar" → bars and rods of iron/steel | "drywall" → plaster board/gypsum | "toner cartridge" → parts of printing machines | "LED bulb" → electrical lighting equipment/LED lamp
- Ambiguous products → provide BOTH possible interpretations
  Example: "Apple" → could be fresh fruit (apple) OR consumer electronics brand (Apple Inc.)
  Example: "Coach bag" → leather handbag/travel goods (Coach = luxury brand)
  Example: "Crown" → could be dental crown (medical), bottle crown cap (metal), or decorative crown (jewelry/misc)
- Waste/used/recycled → always note this, it affects classification
  Example: "Used Restaurant Grease" → WASTE cooking fat/oil (used/waste = important modifier)
  Example: "Scrap copper wire" → WASTE/SCRAP of copper (not copper wire)
- Composite/multi-material → list ALL materials in order of dominance
  Example: "Cotton-polyester blend shirt" → material_primary: cotton, material_secondary: polyester, form: knitted/woven garment
- Include PROCESSING LEVEL: raw, semi-processed, or finished
  Example: "crude petroleum" → raw | "plastic pellets" → semi-processed | "plastic bottle" → finished

## MATERIAL CATEGORIES (use these exact terms when applicable):
Animal: meat, fish, dairy, egg, honey, bone, horn, feather, gut, shellfish, crustacean, insect, silk, wool, leather, fur, hide
Vegetable: wood, bamboo, cork, straw, cotton, flax, hemp, rubber, coconut, palm, olive, seed, grain, fruit, vegetable, flower, mushroom, seaweed, tobacco
Fat/Oil: animal fat, vegetable oil, wax, margarine, tallow, lard, glycerol (NOTE: cooking grease/used oil = this category)
Food/Beverage: sugar, chocolate, cocoa, candy, pasta, bread, juice, wine, beer, spirits, vinegar, sauce, jam, cereal, flour, starch, coffee, tea, spice
Mineral: stone, cement, salt, sulfur, ore, slag, coal, petroleum, asphalt, natural gas, sand, gravel, gypsum, lime
Chemical: acid, alkali, oxide, pharmaceutical, medicine, drug, fertilizer, pesticide, insecticide, soap, cosmetic, perfume, dye, pigment, paint, ink, adhesive, explosive, photographic, enzyme
Plastic/Rubber: plastic, rubber, silicone, polymer, resin, acrylic, pvc, polyethylene, nylon, polyester, polyurethane, foam, film, tube
Metal: iron, steel, stainless steel, aluminum, copper, zinc, tin, lead, nickel, cobalt, tungsten, titanium, gold, silver, platinum, alloy
Textile: cotton fabric, silk fabric, wool fabric, synthetic fabric, knitted, woven, nonwoven, felt, lace, embroidery, rope, cord, twine, net
Glass/Ceramic: glass, crystal, ceramic, porcelain, pottery, tile, brick, fiberglass
Paper: paper, cardboard, pulp, printed matter, book, newspaper, label

## PRODUCT TYPE CATEGORIES (use these exact terms when applicable):
Clothing/Apparel: shirt, blouse, dress, skirt, pants, trousers, jacket, coat, sweater, vest, underwear, sock, scarf, tie, glove, hat, cap, garment
Footwear: shoe, boot, sandal, slipper, sneaker
Bags/Cases: handbag, wallet, briefcase, luggage, backpack, purse, travel bag, tool bag
Electronics: computer, phone, television, camera, battery, circuit, chip, display, speaker, charger, router, sensor
Machinery: engine, motor, pump, valve, bearing, gear, turbine, compressor, generator, transformer, conveyor, crane
Vehicle: car, truck, bicycle, motorcycle, ship, boat, aircraft, train, trailer, bus, tractor
Food Product: canned food, frozen food, dried food, preserved food, confectionery, biscuit, snack, beverage, alcoholic drink
Cosmetic/Pharma: cream, lotion, shampoo, toothpaste, medicine, tablet, capsule, ointment, vitamin
Tool: screwdriver, wrench, pliers, saw, drill, hammer, knife, blade, cutting tool
Furniture: chair, table, desk, bed, shelf, cabinet, mattress, lamp, lighting fixture
Toy/Sport: toy, game, puzzle, doll, ball, racket, bat, ski, exercise equipment
Instrument: medical instrument, surgical tool, measuring device, optical instrument, clock, watch, musical instrument
Jewelry: ring, necklace, bracelet, earring, brooch, pendant, gemstone

## OUTPUT FORMAT (STRICT JSON):
{
  "product_understood": "plain English description of what this product actually is",
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "material_primary": "primary material or null",
  "material_secondary": "secondary material or null",
  "product_type": "product type category or null",
  "processing_level": "raw|semi-processed|finished",
  "is_waste_or_used": false,
  "is_composite": false,
  "hs_relevant_notes": "any special notes for HS classification (e.g., 'toy version of vehicle = toy not vehicle')"
}

## EXAMPLES:
Input: "KitKat"
Output: {"product_understood":"chocolate-covered wafer bar, confectionery product","keywords":["chocolate","wafer","confectionery","cocoa","sugar","biscuit","candy","bar"],"material_primary":"chocolate","material_secondary":"wheat flour","product_type":"confectionery","processing_level":"finished","is_waste_or_used":false,"is_composite":true,"hs_relevant_notes":"Chocolate-covered products: if chocolate is primary character → Ch.18 cocoa, if biscuit is primary → Ch.19 bakery"}

Input: "Used Restaurant Grease"
Output: {"product_understood":"waste cooking oil/fat collected from restaurant, used frying oil","keywords":["waste","used","cooking","oil","fat","grease","animal fat","vegetable oil","frying oil","restaurant waste"],"material_primary":"vegetable oil","material_secondary":"animal fat","product_type":"waste fat/oil","processing_level":"raw","is_waste_or_used":true,"is_composite":true,"hs_relevant_notes":"WASTE cooking oil = Ch.15 (fats/oils), specifically heading 1518 (animal/vegetable fats chemically modified) or 1522 (degras/residues). NOT Ch.16 (prepared food). Waste status is critical for subheading."}

Input: "Tariff classification, country of origin of NAFTA eligibility of lead ingots from India"
Output: {"product_understood":"lead ingots, unwrought lead in ingot form imported from India","keywords":["lead","ingot","unwrought","metal","base metal","smelted","primary lead"],"material_primary":"lead","material_secondary":null,"product_type":"unwrought metal ingot","processing_level":"semi-processed","is_waste_or_used":false,"is_composite":false,"hs_relevant_notes":"Lead ingots = Ch.78 (lead and articles thereof), heading 7801 (unwrought lead). CBP ruling format - extract the actual product from the ruling description."}

Input: "Boy's jacket"
Output: {"product_understood":"jacket or outerwear garment for boys, children's clothing","keywords":["jacket","boy","children","outerwear","coat","garment","clothing","apparel"],"material_primary":null,"material_secondary":null,"product_type":"jacket/outerwear","processing_level":"finished","is_waste_or_used":false,"is_composite":false,"hs_relevant_notes":"Without material info: if woven → Ch.62 (6201/6202), if knitted → Ch.61 (6101/6102). Boy's = men's classification in HS. Jacket vs overcoat distinction matters at heading level."}

Input: "4 in 1 Screwdriver"
Output: {"product_understood":"multi-function screwdriver tool with 4 interchangeable bits or functions","keywords":["screwdriver","tool","hand tool","multi-function","interchangeable","bits","driver"],"material_primary":"steel","material_secondary":"plastic","product_type":"hand tool","processing_level":"finished","is_waste_or_used":false,"is_composite":true,"hs_relevant_notes":"Hand tools = Ch.82, heading 8205 (hand tools not elsewhere specified) or 8204 (socket wrenches). Multi-function: classify by principal function or GRI 3b essential character."}`;
```

### 4단계: LLM 호출 함수 구현

```typescript
// step01-keyword-extract.ts에 추가

import { callLLM } from '../utils/llm-call';

interface Step1LLMResponse {
  product_understood: string;
  keywords: string[];
  material_primary: string | null;
  material_secondary: string | null;
  product_type: string | null;
  processing_level: 'raw' | 'semi-processed' | 'finished';
  is_waste_or_used: boolean;
  is_composite: boolean;
  hs_relevant_notes: string;
}

async function extractKeywordsLLM(productName: string, description?: string): Promise<Step1LLMResponse | null> {
  const userPrompt = `## Input:
Product name: "${productName}"
${description ? `Description: ${description}` : ''}

## Output (STRICT JSON only):`;

  const result = await callLLM<Step1LLMResponse>({
    userPrompt: STEP1_LLM_PROMPT + '\n\n' + userPrompt,
    maxTokens: 300,
    temperature: 0,
  });

  return result.data || null;
}
```

### 5단계: 기존 코드와 병합하는 새 extractKeywords 구현

```typescript
// 기존 extractKeywords를 extractKeywordsCode로 이름 변경 (보존)
// 새 extractKeywords = LLM 결과 + 코드 결과 병합

export async function extractKeywords(input: {
  productName: string;
  description?: string;
  material?: string;
}): Promise<KeywordResult> {
  // 1. LLM으로 상품 이해
  const llmResult = await extractKeywordsLLM(input.productName, input.description);

  // 2. 기존 코드로도 추출 (보험)
  const codeResult = extractKeywordsCode(input);

  // 3. LLM 실패 시 코드 결과만 반환
  if (!llmResult) return codeResult;

  // 4. LLM + 코드 결과 병합
  const mergedKeywords = [...new Set([
    ...llmResult.keywords.map(k => k.toLowerCase()),
    ...codeResult.keywords,
  ])];

  return {
    keywords: mergedKeywords,
    material: llmResult.material_primary || codeResult.material,
    productType: llmResult.product_type || codeResult.productType,
    // 새 필드들 (타입에 추가 필요)
    productUnderstood: llmResult.product_understood,
    materialSecondary: llmResult.material_secondary,
    processingLevel: llmResult.processing_level,
    isWaste: llmResult.is_waste_or_used,
    isComposite: llmResult.is_composite,
    hsNotes: llmResult.hs_relevant_notes,
  };
}
```

### 6단계: types.ts 업데이트

`KeywordResult` 타입에 새 필드 추가:

```typescript
export interface KeywordResult {
  keywords: string[];
  material: string | null;
  productType: string | null;
  // v2.1 추가 — LLM 기반 상품 이해
  productUnderstood?: string;
  materialSecondary?: string | null;
  processingLevel?: 'raw' | 'semi-processed' | 'finished';
  isWaste?: boolean;
  isComposite?: boolean;
  hsNotes?: string;
}
```

### 7단계: pipeline.ts 수정

`extractKeywords`가 이제 `async`이므로 pipeline.ts에서 호출 방식 변경:

```typescript
// 기존:
const step1 = extractKeywords({ ... });

// 변경:
const step1 = await extractKeywords({ ... });
```

그리고 `aiCallCount` 업데이트:
```typescript
// Step 1 뒤에 추가
if (step1.productUnderstood) aiCallCount++; // LLM이 호출된 경우
```

### 8단계: npm run build 확인

```bash
npm run build
```

에러 0개 확인 후 다음 단계로.

### 9단계: 벤치마크 실행

```bash
npx tsx scripts/gri_benchmark.ts 2>&1 | tee /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v2.1_results.log
```

### 10단계: 결과 비교

벤치마크 결과를 아래 포맷으로 비교:

```
v2.0 (Step 1 하드코딩):  6-digit XX% | 4-digit XX% | Chapter XX% | AI calls: 4.0
v2.1 (Step 1 LLM 추가):  6-digit XX% | 4-digit XX% | Chapter XX% | AI calls: 5.0
```

**특히 확인할 것:**
1. Step 2 (Section) 정확도가 얼마나 올랐는지
2. chapter_miss 56건이 줄었는지
3. 브랜드명/비표준 상품명이 정답률이 올랐는지

---

## 절대 규칙

1. **기존 코드 삭제 금지** — `extractKeywordsCode()`로 이름만 변경해서 보존
2. **npm run build 통과 후에만 벤치마크 실행**
3. **Step 1만 수정** — Step 2~11은 이번에 건드리지 않음
4. **벤치마크 결과 파일 저장** — `/Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v2.1_results.json`
5. **결과 비교표 출력** — v2.0 vs v2.1 비교
6. **프롬프트 내용은 위에 작성한 것을 그대로 사용** — 임의로 줄이거나 수정하지 말 것. 프롬프트는 길고 디테일해야 매번 동일한 결과가 나온다

---

## 예상 결과

Step 1 LLM 추가로 기대되는 변화:
- "KitKat" → `keywords: ["chocolate", "wafer", "confectionery", ...]` (기존: `["kitkat"]`)
- "Used Restaurant Grease" → `keywords: ["waste", "cooking", "oil", "fat", ...]` (기존: `["used", "restaurant", "grease"]`)
- "Boy's jacket" → `keywords: ["jacket", "boy", "outerwear", "garment", ...]` + `productType: "jacket/outerwear"` (기존: `productType: null`)

이렇게 키워드가 풍부해지면:
- Step 2 폴백(키워드 매칭)이 더 정확해지고
- Step 2 LLM도 `productUnderstood` 필드를 참고할 수 있고
- Step 4~8의 키워드 기반 폴백도 전부 개선됨

**하지만 아직 Step 2~8 프롬프트는 수정하지 않는다.** Step 1만 바꾸고 전체 파이프라인에 미치는 영향을 먼저 측정한다.
