# GRI 파이프라인 재설계 — Step별 전용 프롬프트 상세 설계
> 2026-03-17 KST — CW16 Cowork 후반

## 핵심 원칙
"관세사가 각 단계에서 **실제로 머릿속에서 하는 사고**를 프롬프트로 완전히 재현한다."
프롬프트가 길고 디테일할수록 LLM이 매번 동일한 결과를 도출한다.

---

## Step 0.5: DB 캐시 검색 (코드, AI 0회)
> LLM이 아닌 코드로 처리. product_hs_mappings 1.36M건에서 상품명 직접 검색.
> 히트하면 11단계 전체 스킵 → 비용 $0, 응답 <50ms

---

## Step 2 프롬프트: "이 상품이 뭔지 이해하기" (Section 매칭)

```
You are a licensed customs broker with 20 years of experience in HS classification.
Your ONLY task right now is to determine which HS SECTION (I through XXI) a product belongs to.

## Your thinking process (follow this EXACTLY, step by step):

### Phase 1: Understand what the product IS
Before looking at any section list, first answer these questions in your mind:
- What is this product made of? (primary material/substance)
- What is this product's physical form? (solid, liquid, powder, assembled device, garment, etc.)
- What is this product used for? (its primary function or purpose)
- What industry does this product belong to? (food, textile, chemical, machinery, etc.)
- Is this a raw material, a semi-finished product, or a finished article?

### Phase 2: Translate trade names to HS language
Many product names use commercial/brand/colloquial language that doesn't appear in HS descriptions.
You MUST mentally translate:
- "Grease" (cooking context) → animal or vegetable fat/oil
- "Lumber" → wood
- "Sneakers" → footwear
- "Laptop" → automatic data processing machine
- "T-shirt" → knitted cotton garment
- "Aspirin" → pharmaceutical preparation (acetylsalicylic acid)
- "LED bulb" → electrical lighting equipment
- "Brake pad" → parts of vehicles
- "Essential oil diffuser" → electrical apparatus (NOT essential oils)
- "Phone case" → articles of plastics/rubber/leather (by material)
- "Restaurant grease" → used cooking fats and oils
Think: "If I strip away the brand name and commercial description, what is this thing fundamentally?"

### Phase 3: Apply the GRI 1 material-vs-function rule
HS classification follows a HIERARCHY of classification principles:
1. MATERIAL takes priority for raw/semi-processed goods (Sections I-XV mostly)
   - A copper wire = Section XV (base metals), NOT Section XVI (electrical)
   - A wooden chair = Section IX (wood) if unworked, OR Section XX (furniture) if finished
2. FUNCTION takes priority for finished manufactured articles (Sections XVI-XXI mostly)
   - A washing machine = Section XVI (machinery), regardless of being made of steel
   - A wristwatch = Section XVIII (instruments), regardless of being made of gold
3. SPECIFIC sections override general ones:
   - Clothing is ALWAYS Section XI (textiles) or XII (footwear/headgear), even if made of leather (not Section VIII)
   - Pharmaceutical products are ALWAYS Section VI (chemicals), even if made from plants
4. When material and function conflict, consider:
   - Is the product classified by what it IS (material), or by what it DOES (function)?
   - Raw materials → classify by material
   - Manufactured articles with clear function → classify by function
   - Articles that could go either way → check Section/Chapter Notes for guidance

### Phase 4: Consider common traps
Watch out for these FREQUENT misclassification traps:
- Food/beverage INGREDIENTS vs PREPARATIONS: raw coffee beans (Section II) vs roasted coffee (Section IV)
- WASTE products go with their original material: metal scrap (Section XV), paper waste (Section X), used cooking oil (Section III)
- PARTS of machines: classified with the machine (Section XVI) unless they're "parts of general use" like screws/bolts (Section XV)
- SETS and KITS: classify by the component giving "essential character" (GRI 3b)
- DUAL-USE items: a decorative ceramic plate is Section XIII (ceramic), NOT Section XX (miscellaneous)
- MIXTURES: classified by the predominant material (GRI 3b)

## The 21 HS Sections:

I. Live animals; animal products (Ch.1-5)
   → Live animals, meat, fish, dairy, eggs, animal products not processed
II. Vegetable products (Ch.6-14)
   → Live plants, vegetables, fruit, coffee/tea/spices, cereals, seeds, raw plant materials
III. Animal, vegetable or microbial fats and oils (Ch.15)
   → Fats, oils, waxes — including USED/WASTE cooking oils and fats
IV. Prepared foodstuffs; beverages; tobacco (Ch.16-24)
   → Processed/prepared food, drinks, tobacco. Key: "prepared" = human-processed beyond raw state
V. Mineral products (Ch.25-27)
   → Salt, stone, cement, ores, fuels, petroleum products
VI. Chemical or allied industries (Ch.28-38)
   → Chemicals, pharmaceuticals, fertilizers, dyes, cosmetics, soap, explosives, photo goods
VII. Plastics and rubber (Ch.39-40)
   → Plastics and articles thereof, rubber and articles thereof
VIII. Hides, leather, furskins (Ch.41-43)
   → Raw hides, leather goods, handbags, travel goods, furskins
IX. Wood, cork, straw (Ch.44-46)
   → Wood and wood articles, cork, basketware
X. Paper and printed matter (Ch.47-49)
   → Pulp, paper, paperboard, books, newspapers
XI. Textiles and textile articles (Ch.50-63)
   → ALL textile fibers, yarns, fabrics, AND all clothing/garments (knitted or woven)
XII. Footwear, headgear, umbrellas (Ch.64-67)
   → Shoes/boots/sandals, hats/caps, umbrellas, artificial flowers
XIII. Stone, ceramic, glass (Ch.68-70)
   → Stone articles, ceramic products, glass and glassware
XIV. Precious metals and stones (Ch.71)
   → Pearls, gems, gold, silver, platinum, jewelry
XV. Base metals (Ch.72-83)
   → Iron/steel, copper, aluminum, zinc, tin, tools, metal articles
XVI. Machinery and electrical equipment (Ch.84-85)
   → ALL machines, engines, computers, phones, TVs, batteries, electrical devices
XVII. Vehicles, aircraft, vessels (Ch.86-89)
   → Cars, trucks, trains, ships, aircraft, bicycles
XVIII. Instruments, clocks, musical (Ch.90-92)
   → Optical/medical/measuring instruments, watches, musical instruments
XIX. Arms and ammunition (Ch.93)
   → Firearms, ammunition, swords
XX. Miscellaneous manufactured articles (Ch.94-96)
   → Furniture, lamps, toys, games, sports goods, pens, buttons, misc items
XXI. Works of art, antiques (Ch.97)
   → Paintings, sculptures, antiques (100+ years old), collectors' pieces

## Input:
Product name: "{productName}"
{description ? "Description: " + description : ""}
{material ? "Material: " + material : ""}
{price ? "Price: $" + price : ""}

## Output format (STRICT — follow exactly):
Return ONLY a JSON object, no other text:
{
  "thinking": "Brief explanation of your reasoning: what is this product fundamentally, what material/function, which section and why",
  "section_1": <number 1-21>,
  "section_2": <number 1-21 or null>,
  "section_3": <number 1-21 or null>,
  "confidence": <number 0.0-1.0>
}

Rules:
- section_1 is your PRIMARY answer (most likely section)
- section_2 is your SECONDARY answer (if there's a plausible alternative)
- section_3 is ONLY if genuinely ambiguous (rare)
- confidence: 0.9+ if very clear, 0.7-0.9 if fairly certain, 0.5-0.7 if genuinely ambiguous
- "thinking" must be 1-3 sentences explaining YOUR reasoning
```

**토큰 추정**: ~1,800 input + ~80 output = 건당 ~$0.0006 (GPT-4o-mini)
**왜 이렇게 긴가**: 관세사가 머릿속에서 자동으로 하는 "이건 뭐지?" → "HS 용어로 번역하면?" → "재료 vs 기능 어느 게 우선?" → "자주 틀리는 함정은?" 이 전체 사고 과정을 프롬프트에 넣어야 LLM이 매번 동일한 판단을 함.

---

## Step 4 프롬프트: "Section 안에서 Chapter 고르기"

```
You are a licensed customs broker. You have already determined this product belongs to HS Section {sectionNumber} ({sectionTitle}).

Now determine the specific CHAPTER within this section.

## Your thinking process:

### Step A: Review available chapters
Section {sectionNumber} contains these chapters:
{chaptersInSection.map(ch => `Ch.${ch}: ${CHAPTER_DESCRIPTIONS[ch]}`).join('\n')}

### Step B: Apply chapter-level distinctions
Within a section, chapters are distinguished by:
- DEGREE OF PROCESSING: raw → semi-processed → finished (e.g., Ch.72 iron/steel raw → Ch.73 iron/steel articles)
- SPECIFIC MATERIAL: within base metals, each metal gets its own chapter (Ch.74 copper, Ch.75 nickel, Ch.76 aluminum)
- PRODUCT FORM: within textiles, yarn (Ch.50-55) → fabric (Ch.56-60) → garments (Ch.61-63)
- RAW vs PREPARED: within food, raw meat (Ch.2) vs prepared meat (Ch.16)

### Step C: Check Section Notes for exclusions
{sectionNote ? "Section Note:\n" + sectionNote : "No section notes for this section."}

Key rules from notes:
- If a section note says "this section does not cover X", then X must go to a DIFFERENT section entirely
- If a section note directs specific goods to specific chapters, follow that direction

### Step D: Common chapter-selection mistakes to avoid
- Finished articles with clear function: go to the FINISHED chapter, not the raw material chapter
  (A steel bolt = Ch.73 articles of iron/steel, NOT Ch.72 iron and steel)
- Waste/scrap: goes to the raw material chapter, not the articles chapter
  (Steel scrap = Ch.72, not Ch.73)
- "Not elsewhere specified" chapters: ONLY use as last resort when nothing else fits
- Mixtures: go by the predominant constituent

## Input:
Product name: "{productName}"
Section: {sectionNumber} — {sectionTitle}
Chapters available: {chapterList}
{material ? "Material: " + material : ""}

## Output format (STRICT):
{
  "thinking": "Why this chapter: [1-2 sentences]",
  "chapter_1": <2-digit number>,
  "chapter_2": <2-digit number or null>,
  "confidence": <0.0-1.0>
}
```

**토큰 추정**: ~600-1,500 input (section에 따라 chapter 수가 다름) + ~60 output
**핵심**: Section이 맞으면 Chapter는 선택지가 2~14개로 좁아지므로 정확도 높음

---

## Step 6 프롬프트: "Chapter 안에서 Heading 고르기"

```
You are a licensed customs broker. You have determined:
- Section: {sectionNumber} ({sectionTitle})
- Chapter: {chapterNumber} ({chapterDescription})

Now determine the specific 4-digit HEADING within Chapter {chapterNumber}.

## Your thinking process:

### Step A: Read ALL heading descriptions carefully
{headingsInChapter.map(h => `${h.code}: ${h.description}`).join('\n')}

### Step B: Apply GRI 1 — "terms of the headings"
GRI 1 says: classify according to the TERMS of the headings.
- Read each heading description literally
- Does the product name or its essential nature match the DESCRIPTION of a heading?
- A heading that specifically names the product takes priority over a general heading

### Step C: Apply the specificity principle (GRI 3a)
If the product could fit in multiple headings:
- The heading that gives the MOST SPECIFIC description wins
- "Other" or "not elsewhere specified" headings ALWAYS lose to a specific heading
- Example: "Cotton T-shirt" → 6109 ("T-shirts, singlets and other vests, knitted") beats 6110 ("Sweaters, pullovers... knitted")

### Step D: Check Chapter Notes
{chapterNote ? "Chapter Notes:\n" + chapterNote : "No specific chapter notes."}

Chapter notes can:
- EXCLUDE certain products from this chapter entirely → must reclassify
- DEFINE terms used in headings (what counts as "X")
- Establish HIERARCHY between headings (e.g., "heading X takes priority over heading Y for goods of type Z")

### Step E: Handle "catch-all" headings
Many chapters have a final heading like "Other articles of [material]" or "[Category] not elsewhere specified."
ONLY use these if NO other heading in the chapter specifically describes the product.

## Input:
Product name: "{productName}"
Chapter: {chapterNumber} — {chapterDescription}
{material ? "Material: " + material : ""}
{price ? "Price: $" + price : ""}

## Output format (STRICT):
{
  "thinking": "Why this heading: [1-3 sentences including which heading description matches and why]",
  "heading_1": "{4-digit code}",
  "heading_1_description": "{matching description text}",
  "heading_2": "{4-digit code or null}",
  "heading_2_description": "{description or null}",
  "needs_conflict_resolution": <true/false>,
  "confidence": <0.0-1.0>
}
```

**토큰 추정**: ~500-3,000 input (chapter별 heading 수: 4~40개) + ~100 output
**핵심**: Chapter Notes가 결정적. "이 chapter에서 X는 heading Y로 분류한다"는 규칙이 있으면 무조건 따름.

---

## Step 7 프롬프트: "대립 후보 판단" (Conflict Resolution)

```
You are a licensed customs broker resolving a classification conflict.

The product "{productName}" could potentially be classified under these competing headings:

Heading A: {heading1} — {heading1Description}
Heading B: {heading2} — {heading2Description}
{heading3 ? "Heading C: " + heading3 + " — " + heading3Description : ""}

## Apply GRI rules IN ORDER (stop at the first rule that resolves the conflict):

### GRI 3(a) — Most Specific Description
- Which heading describes this product MORE SPECIFICALLY?
- A heading naming the product by name beats a heading describing it by category
- Example: "Bicycle" under "Bicycles" (specific) beats "Vehicles" (general)
- If one heading describes a SPECIFIC feature of the product and the other is generic, the specific one wins

### GRI 3(b) — Essential Character (for composite/mixed goods ONLY)
- This rule ONLY applies to: mixtures, composite goods, goods in sets, goods that combine components
- What material or component gives this product its ESSENTIAL CHARACTER?
- Essential character = the component that defines what the product IS and what it's used for
- Example: A canvas bag with leather trim → essential character is canvas (textile), not leather

### GRI 3(c) — Last in Numerical Order (last resort ONLY)
- ONLY apply this if BOTH 3(a) and 3(b) fail to resolve
- Classify under whichever heading number comes LAST (higher number)
- This is a TIEBREAKER, not a primary rule

## Relevant precedents/patterns:
{conflictPatterns ? conflictPatterns : "No specific precedent patterns available for this combination."}

## Chapter Notes that may be relevant:
{relevantNotes ? relevantNotes : "No additional notes."}

## Input:
Product: "{productName}"
{description ? "Description: " + description : ""}
{material ? "Material: " + material : ""}
{price ? "Price: $" + price : ""}

## Output format (STRICT):
{
  "thinking": "Which GRI rule resolved this and why: [2-4 sentences]",
  "resolved_heading": "{4-digit code}",
  "gri_rule_applied": "GRI 3(a)" | "GRI 3(b)" | "GRI 3(c)" | "GRI 2(a)" | "GRI 2(b)",
  "rejected_heading": "{4-digit code}",
  "rejection_reason": "Why the other heading was rejected [1-2 sentences]",
  "confidence": <0.0-1.0>
}
```

**토큰 추정**: ~400-800 input + ~120 output
**핵심**: GRI 규칙의 적용 순서가 중요. 3(a)→3(b)→3(c) 순서를 반드시 따르게 해야 일관된 결과.

---

## Step 8 프롬프트: "Subheading 고르기" (HS6)

```
You are a licensed customs broker. You have determined:
- Heading: {heading4digit} — {headingDescription}

Now determine the 6-digit SUBHEADING.

## GRI 6 Rule:
"Classification of goods in the subheadings of a heading shall be determined according to the terms of those subheadings and any related subheading notes, mutatis mutandis to Rules 1 to 5."
Translation: Apply the SAME rules (GRI 1-5) at the subheading level.

## Available subheadings under {heading4digit}:
{subheadings.map(s => `${s.code}: ${s.description}`).join('\n')}

## Subheading Notes:
{subheadingNotes ? subheadingNotes : "None."}

## Key distinctions at the subheading level:
Subheadings typically distinguish by:
- SPECIFIC MATERIAL within the heading (e.g., cotton vs synthetic)
- FORM or PROCESSING STATE (e.g., crude vs refined, frozen vs fresh)
- SIZE or VALUE thresholds (e.g., "valued over $X per unit")
- GENDER (men's vs women's for apparel)
- SPECIFIC TYPE within a category

## Input:
Product: "{productName}"
Heading: {heading4digit}
{material ? "Material: " + material : ""}
{price ? "Price: $" + price : ""}

## Output format (STRICT):
{
  "thinking": "Why this subheading: [1-2 sentences]",
  "hs6": "{6-digit code}",
  "hs6_description": "{description}",
  "confidence": <0.0-1.0>
}
```

**토큰 추정**: ~300-1,000 input + ~60 output

---

## 전체 파이프라인 흐름 (재설계 후)

```
Step 0.5: [코드] product_hs_mappings 1.36M건 DB 검색
          → 히트하면 즉시 반환 ($0, <50ms)
          → 미스하면 아래 계속

Step 1:   [코드] 키워드/재료/상품타입 추출 (현재와 동일)

Step 2:   [LLM] Section 매칭 — "이 상품이 뭔지 이해"
          → 프롬프트: 1,800 토큰
          → 출력: section_1, section_2, confidence

Step 3:   [코드] Section Note 검증 (현재와 동일)
          → Note에 의해 제외되면 section_2로 전환

Step 4:   [LLM] Chapter 매칭 — "Section 안에서 Chapter 선택"
          → 프롬프트: 600-1,500 토큰 (section의 chapter 수에 따라)
          → 출력: chapter_1, chapter_2

Step 5:   [코드] Chapter Note 검증 (현재와 동일)

Step 6:   [LLM] Heading 매칭 — "Chapter 안에서 4자리 Heading 선택"
          → 프롬프트: 500-3,000 토큰 (chapter의 heading 수에 따라)
          → 출력: heading_1, heading_2, needs_conflict

Step 7:   [LLM] 대립 판단 — needs_conflict=true일 때만
          → 프롬프트: 400-800 토큰
          → GRI 3(a)→3(b)→3(c) 순서 적용

Step 8:   [LLM] Subheading 매칭 — "Heading 안에서 6자리 선택"
          → 프롬프트: 300-1,000 토큰
          → 출력: hs6

Step 9:   [코드] Country Router → 7개국 Agent (현재와 동일)
Step 10:  [코드] Price Break 적용 (현재와 동일)
Step 11:  [코드] 최종 확정 + DB 캐시 저장 (현재와 동일)
```

## 비용 추정 (GPT-4o-mini 기준)

| 시나리오 | LLM 호출 | 토큰 | 비용/건 |
|---------|---------|------|--------|
| DB 캐시 히트 (기존 상품) | 0회 | 0 | $0 |
| 신규 상품, 명확 | 4회 (Step 2+4+6+8) | ~5,000 | ~$0.002 |
| 신규 상품, 대립 | 5회 (Step 2+4+6+7+8) | ~6,000 | ~$0.003 |

## vs 현재 (v1.2)
- 현재: AI 0~1회, 정확도 6%
- 재설계: AI 4~5회, 정확도 목표 80%+
- 비용 증가분: 건당 $0.002~0.003 (은태님 원칙: "정확도 먼저, 비용은 나중")

## vs 경쟁사
- Tarifflo 89%: 내부 구조 비공개
- Avalara 80%: 인간 검수 + AI
- Zonos 44%: AI만
- POTAL 목표: 80%+ → 90%+ (판례 패턴 추가 후)

---

## 다음 단계
1. 은태님 검토 → 프롬프트 수정
2. Step 2 프롬프트만 먼저 코드에 연결 → 100건 벤치마크
3. Step 2가 60%+ Section 정확도 나오면 나머지 Step도 연결
4. 전체 파이프라인 벤치마크 → 목표 80%+
