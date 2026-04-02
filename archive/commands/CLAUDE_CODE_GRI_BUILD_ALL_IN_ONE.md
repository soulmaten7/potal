# GRI Agent Team — 4단계 통합 실행 명령어
# 2026-03-17 23:00 KST
#
# 사용법: 이 전체 내용을 Claude Code 터미널 하나에 붙여넣기
# 1단계→2단계→3단계→4단계 순서로 자동 진행
# 4단계(벤치마크)는 DB read-write 복구가 필요하므로 상태 체크 포함
#
# ⚠️ 필수 전제조건:
#   - /Volumes/soulmaten/POTAL/hs_classification_rules/ 에 14개 GRI 참고파일 존재
#   - /Volumes/soulmaten/POTAL/ 에 cbp_cross_combined_mappings.csv 존재
#   - /Volumes/soulmaten/POTAL/regulations/eu_ebti/ 에 EBTI 데이터 존재
#   - /Volumes/soulmaten/POTAL/benchmark_test_data.json 존재 (100건)
#   - 프로젝트 루트: portal/ (Next.js 프로젝트)

```
아래 4단계를 순서대로 전부 실행해. 각 단계가 끝나면 바로 다음 단계로 넘어가. 중간에 멈추지 마. 에러가 나면 에러 내용을 기록하고 가능하면 수정한 후 계속 진행해.

한 번에 하나의 단계만 실행하고, 이전 단계 결과물을 다음 단계에서 사용해.

모든 작업이 끝나면 최종 요약을 출력해줘.

절대 규칙:
- console.log 금지
- 기존 코드 삭제 금지 (새 폴더에 새로 만듦)
- npm run build 에러 0개 유지
- 병렬 실행 금지 — 순차만
- 각 단계 완료 시 "=== Stage N 완료 ===" 출력

================================================================
█ 1단계: 판례 → 대립 패턴 규칙화 (데이터 전처리)
================================================================

== 목표 ==
CBP CROSS rulings와 EU EBTI rulings에서 반복되는 분류 논쟁 패턴을 추출하여,
97개 Chapter별로 "대립 패턴 규칙 파일"을 생성한다.

== 데이터 소스 ==
1. CBP CROSS: /Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv (142,251건)
   - 형식: product_name, hs_code, source 등
   - 없으면: DB의 product_hs_mappings에서 source='cbp_cross'인 데이터
2. EU EBTI: /Volumes/soulmaten/POTAL/regulations/eu_ebti/ 에 저장된 데이터
   - 269,730건의 ruling → 231,727 고유 product-HS 매핑
3. GRI 참고자료: /Volumes/soulmaten/POTAL/hs_classification_rules/
   - section_notes.json (21개 섹션)
   - chapter_notes.json (96개 챕터)
   - COMPLETE_GRI_REFERENCE.md (42KB)

== 작업 순서 ==

Step 1: 데이터 로드 및 챕터별 그룹핑
- CBP CSV + EBTI 데이터를 HS 6자리의 앞 2자리 기준으로 97개 챕터로 분류
- 각 챕터별 ruling 수 집계
- CBP CSV 파일 형식 먼저 확인 (head로 컬럼 구조 파악)
- EBTI 폴더 구조도 먼저 확인 (ls로 파일 목록 파악)

Step 2: 챕터별 대립 패턴 추출 (핵심)
- 같은 상품(유사 상품명/키워드)이 서로 다른 HS Code로 분류된 사례들을 찾아
- 패턴 추출 기준:
  a) 같은 상품명/키워드가 2개 이상의 다른 Heading(4자리)으로 분류된 경우
  b) 같은 Heading 내에서 다른 Subheading(6자리)으로 분류된 경우
  c) chapter_notes.json에서 "이 챕터에서 제외" 또는 "~를 포함"이라고 명시한 것과 관련된 분류
- 상품명에서 핵심 키워드 추출: 불용어 제거, 소문자 변환, 특수문자 제거
- 유사 키워드끼리 그룹핑: "bluetooth speaker" vs "wireless speaker" → 같은 그룹

Step 3: 각 패턴을 구조화된 JSON으로 정리
- 각 패턴에 포함될 필드:

{
  "pattern_id": "ch85_001",
  "chapter": 85,
  "pattern_name": "복합기능 전자제품 (음향+조명)",
  "conflict_headings": ["8518", "9405"],
  "correct_heading": "8518",
  "decision_criteria": {
    "primary": "주 기능(primary function)이 음향 출력인 경우 8518",
    "indicators": [
      "마케팅/상품명이 '스피커'를 포함",
      "전력소비의 50% 이상이 음향 기능",
      "조명은 분위기/장식용으로 독립 사용 불가"
    ]
  },
  "rejection_reason": "9405(조명기기)는 조명이 주 기능일 때만 적용. 부수적 LED는 해당 없음",
  "exceptions": [
    "LED가 독서등 수준의 독립 조명 기능을 가진 경우 → 9405",
    "조명 출력이 300 lumen 이상이고 스피커 출력이 3W 이하인 경우 → 9405"
  ],
  "related_rulings": ["N123456", "N234567"],
  "gri_rule_applied": "GRI 3(b) — essential character",
  "keywords": ["bluetooth speaker", "LED", "light", "lamp", "speaker"],
  "source_count": { "cbp": 12, "ebti": 8 }
}

Step 4: 우선순위 챕터부터 처리
- P0 (핵심 소비재, 가장 많은 분류 요청): Ch.61-62(의류), Ch.84-85(기계/전기), Ch.39(플라스틱), Ch.42(가죽), Ch.64(신발), Ch.94(가구), Ch.95(완구), Ch.71(보석)
- P1 (산업재): Ch.73(철강), Ch.90(정밀기기), Ch.29(유기화학), Ch.38(화학제품)
- P2 (나머지): 나머지 챕터

Step 5: 저장
- 개별 파일: /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/ch{XX}_patterns.json
- 통합 인덱스: /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/index.json
  - 전체 패턴 수, 챕터별 패턴 수, 총 커버 HS Code 수
- 요약: /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/SUMMARY.md

== 1단계 완료 조건 ==
- 97개 챕터 파일 전부 생성 (데이터 없는 챕터는 빈 패턴 + "no_conflicts_found")
- index.json에 전체 통계
- SUMMARY.md에 요약
- 완료 후 출력: 총 패턴 수, 챕터별 패턴 수 TOP 10, 가장 빈번한 GRI 규칙

== 1단계 주의사항 ==
- 판례 텍스트에 무기/마약 관련 내용이 있으면 패턴 추출만 하고 원문은 저장하지 마
- 각 패턴에 반드시 gri_rule_applied 필드 포함
- 각 패턴에 반드시 keywords 필드 포함
- exceptions 필드는 반드시 포함 — 대립 패턴에서 정답이 뒤집히는 조건
- 진행 상황을 10개 챕터 완료할 때마다 출력

"=== Stage 1 완료 ===" 출력 후 바로 2단계로 넘어가.

================================================================
█ 2단계: GRI Agent Team 11단계 코드 체인 구축 (핵심 엔진)
================================================================

== 전체 아키텍처 ==

기존 파이프라인 (유지, 폴백으로 사용):
  app/lib/cost-engine/ai-classifier/ (벡터검색 → 키워드 → LLM)

새 GRI 파이프라인 (신규 생성):
  app/lib/cost-engine/gri-classifier/ ← 여기에 새로 만듦

API 라우트는 기존 app/api/v1/classify/route.ts를 수정하여:
  - 환경변수 CLASSIFICATION_ENGINE=gri 이면 GRI 엔진 사용
  - CLASSIFICATION_ENGINE=legacy 또는 미설정이면 기존 엔진 사용

== 파일 구조 ==

app/lib/cost-engine/gri-classifier/
├── index.ts                    # Public API (classifyWithGRI 함수 export)
├── types.ts                    # GRI 분류 전용 타입 정의
├── pipeline.ts                 # 11단계 파이프라인 오케스트레이터
├── steps/
│   ├── step01-keyword-extract.ts    # Step 1: 상품명 키워드 추출
│   ├── step02-section-match.ts      # Step 2: 21개 Section 매칭
│   ├── step03-section-note-check.ts # Step 3: Section Note 포함/제외 체크
│   ├── step04-chapter-match.ts      # Step 4: Chapter 매칭
│   ├── step05-chapter-note-check.ts # Step 5: Chapter Note 포함/제외 체크
│   ├── step06-heading-match.ts      # Step 6: Heading 매칭 (1,228개)
│   ├── step07-conflict-resolve.ts   # Step 7: [AI] 대립 패턴 매칭
│   ├── step08-subheading-match.ts   # Step 8: Subheading 매칭 (5,371개)
│   ├── step09-country-router.ts     # Step 9: Country Router → 해당 Agent
│   ├── step10-price-break.ts        # Step 10: 가격 분기/추가 규칙
│   └── step11-final-resolve.ts      # Step 11: 최종 7~10자리 확정
├── data/
│   ├── section-notes.ts             # section_notes.json 로드
│   ├── chapter-notes.ts             # chapter_notes.json 로드
│   ├── subheading-notes.ts          # subheading_notes.json 로드
│   ├── conflict-patterns.ts         # 대립 패턴 로드 (1단계 결과물)
│   └── gri-rules.ts                # GRI 1-6 규칙 텍스트
└── country-agents/
    ├── index.ts                     # Country Agent 라우터
    ├── us-agent.ts                  # 미국 (HTSUS 10자리)
    ├── eu-agent.ts                  # EU (CN 8자리 + TARIC 10자리)
    ├── uk-agent.ts                  # 영국
    ├── kr-agent.ts                  # 한국
    ├── jp-agent.ts                  # 일본
    ├── au-agent.ts                  # 호주
    └── ca-agent.ts                  # 캐나다

== 각 Step 상세 구현 ==

Step 1 (step01-keyword-extract.ts):
- 입력: productName (string), description? (string), material? (string)
- 처리:
  a) 소문자 변환 + 특수문자 제거
  b) 불용어(stopwords) 제거: "the", "a", "for", "with", "made of" 등
  c) 복합 키워드 추출: "bluetooth speaker" → ["bluetooth", "speaker", "bluetooth speaker"]
  d) 소재 키워드 분리: "cotton t-shirt" → ["cotton", "t-shirt"], material="cotton"
  e) 브랜드명 제거 (분류에 불필요): "Nike Air Max" → ["air", "max", "shoe"]
  f) 소재 사전 (하드코딩): cotton, polyester, leather, silk, wool, nylon, rubber, plastic, metal, wood, glass, ceramic, paper, stone 등
  g) 상품 유형 사전: shirt, shoe, bag, phone, laptop, toy, furniture, tool, food 등
- 출력: { keywords: string[], material?: string, productType?: string }
- AI 호출: 없음 (정규식 + 사전 기반)

Step 2 (step02-section-match.ts):
- 입력: keywords, material
- 처리:
  a) 21개 Section별 대표 키워드 매핑 테이블 (하드코딩):
     Section I (Ch.1-5): animal, meat, fish, dairy, egg, live, poultry, crustacean, insect
     Section II (Ch.6-14): plant, vegetable, fruit, coffee, tea, spice, cereal, grain, seed, straw, bamboo
     Section III (Ch.15): fat, oil, wax, margarine, tallow
     Section IV (Ch.16-24): food, beverage, tobacco, candy, chocolate, sugar, pasta, bread, juice, wine, beer, spirits
     Section V (Ch.25-27): mineral, stone, cement, fuel, oil, coal, petroleum, asphalt, salt, sulfur
     Section VI (Ch.28-38): chemical, pharmaceutical, fertilizer, soap, cosmetic, perfume, gelatin, enzyme, explosive, photographic, glue
     Section VII (Ch.39-40): plastic, rubber, silicone, polymer, resin, acrylic, PVC, polyethylene
     Section VIII (Ch.41-43): leather, skin, fur, handbag, wallet, belt, saddlery, travel goods
     Section IX (Ch.44-46): wood, cork, straw, bamboo, basket, plywood, veneer, particle board
     Section X (Ch.47-49): paper, cardboard, book, newspaper, printing, pulp, wallpaper, label, calendar
     Section XI (Ch.50-63): textile, cotton, silk, wool, fabric, clothing, knit, woven, yarn, thread, carpet, towel, curtain, bedding
     Section XII (Ch.64-67): footwear, shoe, boot, sandal, slipper, hat, cap, umbrella, feather, artificial flower
     Section XIII (Ch.68-70): stone product, ceramic, tile, brick, glass, mirror, bottle, vase, concrete
     Section XIV (Ch.71): jewelry, pearl, gold, silver, diamond, precious, gemstone, platinum, watch case
     Section XV (Ch.72-83): iron, steel, copper, aluminum, metal, screw, bolt, nail, wire, chain, lock, safe, anchor, needle, spring
     Section XVI (Ch.84-85): machine, engine, motor, pump, valve, bearing, gear, turbine, computer, phone, television, camera, battery, LED, circuit, chip, electric, electronic, appliance, refrigerator, washing machine, microwave, printer, scanner
     Section XVII (Ch.86-89): vehicle, car, truck, bicycle, motorcycle, ship, boat, aircraft, airplane, train, railway, trailer, wheelchair
     Section XVIII (Ch.90-92): optical, medical, surgical, instrument, meter, thermometer, clock, watch, music, piano, guitar, violin, lens, microscope
     Section XIX (Ch.93): weapon, firearm, ammunition, bomb, grenade
     Section XX (Ch.94-96): furniture, mattress, lamp, light fixture, prefab building, toy, game, sport, exercise, pen, pencil, brush, button, zipper, lighter, comb
     Section XXI (Ch.97): art, antique, painting, sculpture, stamp, coin, collection
  b) 키워드 매칭 점수 계산: 각 Section별로 매칭된 키워드 수
  c) 상위 1~3개 Section 후보 선정 (점수 기반)
  d) material 키워드 보너스: material="cotton" → Section XI 가중치 +2
  e) productType 보너스: productType="shoe" → Section XII 가중치 +2
- 출력: { sectionCandidates: [{section: number, score: number, chapters: number[]}] }
- AI 호출: 없음

Step 3 (step03-section-note-check.ts):
- 입력: sectionCandidates, keywords, material
- 처리:
  a) data/section-notes.ts에서 해당 Section Note 로드
  b) "제외(exclude)" 규칙 체크: Note가 "이 섹션에서 XX는 제외"라고 하면 해당 Section 탈락
  c) "포함(include)" 규칙 체크: Note가 "이 섹션에서 XX는 포함"이라고 하면 확정
  d) "용어 정의" 체크: Note에서 정의한 용어가 상품명에 해당하는지
  e) "다른 섹션으로 redirect" 체크: Note가 "XX는 Section YY에 분류"라고 하면 해당 Section 추가
- 출력: { validSections: [{section, chapters}], excludedSections: [{section, reason}] }
- AI 호출: 없음 (규칙 기반 매칭)

Step 4 (step04-chapter-match.ts):
- 입력: validSections, keywords, material
- 처리:
  a) validSections에 속한 Chapter들만 대상으로 키워드 매칭
  b) DB에서 hs_codes 테이블의 4자리 코드 + 설명 조회 (Supabase REST API)
     - 또는 로컬 캐시: 1,228개 Heading 설명은 한번 로드 후 메모리 유지
  c) 각 Chapter의 공식 설명 텍스트와 키워드 매칭 (포함 여부 + 가중치)
  d) material 기반 분기: cotton → Ch.52(면직물) vs Ch.61(편직의류) vs Ch.62(비편직의류)
  e) 상위 1~5개 Chapter 후보 선정
- 출력: { chapterCandidates: [{chapter: number, score: number, description: string}] }
- AI 호출: 없음

Step 5 (step05-chapter-note-check.ts):
- 입력: chapterCandidates, keywords, material, price
- 처리:
  a) data/chapter-notes.ts에서 해당 Chapter Note 로드
  b) "제외" 규칙: "이 류에서 다음은 제외한다: ..."
  c) "포함" 규칙: "이 류에서 XX라 함은 ... 을 포함한다"
  d) "용어 정의": Chapter Note에서 정의한 용어가 상품에 해당하는지
  e) 제외된 Chapter는 대안 Chapter 제시 (Note가 "XX는 Ch.YY에 분류"라고 명시하는 경우)
  f) redirect된 Chapter가 기존 후보에 없으면 추가
- 출력: { validChapters: [{chapter, description}], excludedChapters: [{chapter, reason, redirectTo?}] }
- AI 호출: 없음

Step 6 (step06-heading-match.ts):
- 입력: validChapters, keywords, material, productType
- 처리:
  a) validChapters에 속한 Heading(4자리) 목록을 DB 또는 로컬 캐시에서 조회
  b) 각 Heading의 공식 설명과 상품 키워드 매칭
  c) 점수 = (매칭 키워드 수 × 가중치) + (material 일치 보너스) + (productType 일치 보너스)
  d) "Other" heading (XX.XX에 해당하지 않는 것)은 최하위 우선순위
  e) 후보 1개면 → needsConflictResolution = false, Step 8로 직행
  f) 후보 2개 이상이면 → needsConflictResolution = true, Step 7로
- 출력: { headingCandidates: [{heading: string, description: string, score: number}], needsConflictResolution: boolean }
- AI 호출: 없음

Step 7 (step07-conflict-resolve.ts): ★ AI 호출 가능 (유일한 주요 호출 지점)
- 입력: headingCandidates (2개 이상), keywords, material, productName, price
- 처리:
  a) 1단계 결과물인 conflict_patterns/ch{XX}_patterns.json 로드
  b) 상품 키워드와 패턴의 keywords 필드 매칭 (키워드 교집합 크기로 점수)
  c) 매칭된 패턴이 있으면:
     - 패턴의 decision_criteria.indicators 하나씩 체크
     - exceptions 하나씩 체크 — 예외에 해당하면 정답이 뒤집힘
     - correct_heading 반환
     - AI 호출 없음 (패턴 매칭만으로 결정)
  d) 매칭된 패턴이 없으면 (새로운 유형의 대립):
     - LLM 호출 1회 (Groq llama 또는 GPT-4o):
       프롬프트:
       "You are a WCO-certified customs classification expert.
       Classify the following product according to GRI rules 1-5.

       Product: {productName}
       Material: {material}
       Price: {price}

       Candidate headings:
       {candidates 각각의 4자리 코드 + 공식 설명}

       Section Note: {relevant notes}
       Chapter Note: {relevant notes}

       Apply in order:
       GRI 1: Most specific heading description
       GRI 3(a): Most specific description
       GRI 3(b): Essential character
       GRI 3(c): Last in numerical order

       Respond in JSON only:
       { "heading": "XXXX", "gri_rule": "GRI X(x)", "reasoning": "..." }"
     - 결과를 새 대립 패턴으로 저장 → 다음에 같은 유형은 AI 없이 처리 (학습)
  e) 패턴 매칭도 AI도 결정 못 하면: 가장 높은 점수의 heading 선택 (폴백)
- 출력: { resolvedHeading: string, method: 'pattern_match' | 'ai_resolution' | 'score_fallback', reasoning: string, griRuleApplied?: string }
- AI 호출: 패턴에 없을 때만 1회

Step 8 (step08-subheading-match.ts):
- 입력: resolvedHeading (4자리), keywords, material, price
- 처리:
  a) 해당 Heading의 Subheading(6자리) 목록을 DB 또는 캐시에서 조회
  b) GRI 6 적용: "Subheading 간 비교는 동일 레벨에서만, 동일 자릿수 dash 수 기준"
  c) Subheading 설명과 키워드 매칭 (점수)
  d) data/subheading-notes.ts에서 해당 Subheading Note 체크 (있는 경우)
  e) Subheading이 1개면 → 확정
  f) 여러 개면 → 가장 구체적인 설명(GRI 3(a) 적용)을 선택
  g) "Other"는 최하위 우선순위
  h) 점수가 동일하면 → 번호가 앞선 것 (GRI 3(c) 아님 — 마지막이 아니라 가장 구체적인 것 우선)
- 출력: { hs6: string, description: string, confidence: number }
- AI 호출: 없음 (설명 매칭)

Step 9 (step09-country-router.ts):
- 입력: hs6, destinationCountry
- 처리:
  a) destinationCountry가 7개국(US/EU/GB/KR/JP/AU/CA) 중 하나인지 확인
  b) 해당 국가면 → country-agents/{country}-agent.ts 호출
  c) 나머지 233국이면 → hs6 그대로 반환 (6자리에서 끝)
  d) destinationCountry가 없으면 → hs6 그대로 반환
- 출력: → Country Agent 결과 또는 { hs6, country: 'default' }

Step 10 (step10-price-break.ts):
- 입력: hs6 또는 hs10 후보들, price
- 처리:
  a) DB에서 hs_price_break_rules 테이블의 해당 HS Code 가격 분기 규칙 조회
  b) "valued over $X" / "valued not over $X" 조건 체크
  c) 가격에 따라 후보 필터링
  d) 기존 app/lib/classification/price-break-engine.ts 로직 재활용
- 출력: { filteredCandidates: string[], priceBreakApplied: boolean, rule?: string }
- AI 호출: 없음

Step 11 (step11-final-resolve.ts):
- 입력: hs6, 국가별 결과 (있으면), filteredCandidates, productName
- 처리:
  a) 후보 1개면 → 확정
  b) 후보 2개 이상이면 → 키워드 매칭으로 최종 선택
  c) 키워드로도 구분 안 되면 → LLM 1회 (5~10개 후보에서 1개 선택)
     - 프롬프트: "Product: {productName}. Choose the most appropriate code from: {candidates with descriptions}. Respond with the code only."
  d) 결과를 DB 캐시에 저장 (gri_classification_cache 테이블)
  e) 전체 분류 경로(decisionPath) 기록 — 감사 추적용
- 출력: GriClassificationResult (최종)
- AI 호출: 키워드로 불충분할 때만 1회

== 타입 정의 (types.ts) ==

export interface GriProductInput {
  productName: string;
  description?: string;
  material?: string;
  price?: number;
  weight?: number;
  originCountry?: string;
  destinationCountry?: string;
  imageUrl?: string;
}

export interface GriClassificationResult {
  hsCode: string;           // 최종 HS Code (6~10자리)
  hsCodePrecision: 'HS10' | 'HS8' | 'HS6';
  description: string;      // 해당 코드의 공식 설명
  confidence: number;       // 0~1

  // 분류 경로 (감사 추적)
  decisionPath: {
    step: number;
    name: string;
    input: string;
    output: string;
    method: 'code' | 'pattern_match' | 'ai';
    timeMs: number;
  }[];

  // GRI 적용 기록
  griRulesApplied: {
    rule: string;  // "GRI 1", "GRI 3(b)" 등
    reason: string;
  }[];

  // 대안 (있으면)
  alternatives?: {
    hsCode: string;
    description: string;
    confidence: number;
    rejectionReason: string;
  }[];

  // 메타
  classificationMethod: 'gri_pipeline';
  aiCallCount: number;     // AI 호출 횟수 (0, 1, 또는 2)
  processingTimeMs: number;

  // Country Agent 결과 (7개국만)
  countrySpecific?: {
    country: string;
    nationalCode: string;
    dutyRate?: number;
    additionalNotes?: string;
  };
}

export interface ConflictPattern {
  pattern_id: string;
  chapter: number;
  pattern_name: string;
  conflict_headings: string[];
  correct_heading: string;
  decision_criteria: {
    primary: string;
    indicators: string[];
  };
  rejection_reason: string;
  exceptions: string[];
  related_rulings: string[];
  gri_rule_applied: string;
  keywords: string[];
  source_count?: { cbp: number; ebti: number };
}

export interface CountryAgentResult {
  nationalCode: string;      // 7~10자리 최종 코드
  codePrecision: number;     // 자릿수 (8, 9, 10)
  description: string;       // 해당 코드의 공식 설명
  dutyRate?: number;         // 해당 코드의 관세율
  additionalDuties?: string[];
  confidence: number;
  method: 'exact_match' | 'keyword_match' | 'price_break' | 'ai_selection';
  aiCallCount: number;       // 0 또는 1
}

== data/ 파일 구현 ==

data/section-notes.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/section_notes.json 로드
- 파일이 없으면 에러 대신 빈 객체 반환 (graceful degradation)
- getSectionNote(sectionNumber) → { includes: string[], excludes: string[], definitions: Record<string,string>, redirects: {from: string, to: number}[] }
- 캐싱: 한번 로드 후 모듈 레벨 변수에 저장

data/chapter-notes.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/chapter_notes.json 로드
- getChapterNote(chapterNumber) → { includes, excludes, definitions, redirects }
- 같은 캐싱 패턴

data/subheading-notes.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/subheading_notes.json 로드

data/conflict-patterns.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/*.json 로드 (1단계 결과물)
- findMatchingPattern(chapter: number, keywords: string[]) → ConflictPattern | null
- 매칭 로직: keywords 교집합 크기 ≥ 2이면 매칭

data/gri-rules.ts:
- GRI 1-6 규칙 텍스트 하드코딩 (짧으므로 파일 불필요)
- getGriRule(ruleNumber: 1|2|3|4|5|6) → string

== pipeline.ts (오케스트레이터) ==

export async function classifyWithGRI(input: GriProductInput): Promise<GriClassificationResult> {
  const startTime = Date.now();
  const decisionPath: GriClassificationResult['decisionPath'] = [];
  let aiCallCount = 0;

  // Step 0: DB 캐시 확인 (같은 상품+도착지면 즉시 반환)
  const cacheKey = hashProductName(input.productName) + '_' + (input.destinationCountry || 'XX');
  const cached = await checkGriCache(cacheKey);
  if (cached) return { ...cached, processingTimeMs: Date.now() - startTime };

  // Step 1~11 순차 실행 (각 step은 독립 순수 함수)
  const step1 = extractKeywords(input);
  decisionPath.push({ step: 1, name: 'keyword_extract', input: input.productName, output: JSON.stringify(step1.keywords.slice(0,5)), method: 'code', timeMs: Date.now()-startTime });

  const step2 = matchSections(step1);
  // ... (각 step의 결과를 다음 step의 입력으로 전달)

  // Step 7: AI가 필요할 수도 있음
  if (step6.needsConflictResolution) {
    const step7 = await resolveConflict(step6.headingCandidates, step1, input);
    if (step7.method === 'ai_resolution') aiCallCount++;
  }

  // ... Step 8~11 ...

  // 결과 DB 캐시 저장
  await saveGriCache(cacheKey, result);

  return {
    ...result,
    decisionPath,
    aiCallCount,
    processingTimeMs: Date.now() - startTime,
    classificationMethod: 'gri_pipeline',
  };
}

== API 라우트 수정 (app/api/v1/classify/route.ts) ==

기존 코드 유지하면서 분기 추가:

import { classifyWithGRI } from '@/app/lib/cost-engine/gri-classifier';

const useGriEngine = process.env.CLASSIFICATION_ENGINE === 'gri';

if (useGriEngine) {
  try {
    const griResult = await classifyWithGRI({
      productName,
      description: category,
      price,
      material,
      destinationCountry: destination || 'US',
    });
    return apiSuccess({
      hsCode: griResult.hsCode,
      description: griResult.description,
      confidence: griResult.confidence,
      alternatives: griResult.alternatives,
      decisionPath: griResult.decisionPath,
      griRulesApplied: griResult.griRulesApplied,
      aiCallCount: griResult.aiCallCount,
      classificationMethod: griResult.classificationMethod,
    });
  } catch (griError) {
    // GRI 엔진 실패 시 기존 엔진으로 폴백
    // 아래 기존 코드가 실행됨
  }
}
// else: 기존 파이프라인 사용 (기존 코드 그대로)

== DB 마이그레이션 ==

파일: supabase/migrations/038_gri_classification.sql

-- GRI 분류 캐시 테이블
CREATE TABLE IF NOT EXISTS gri_classification_cache (
  id SERIAL PRIMARY KEY,
  product_name_hash VARCHAR(64) NOT NULL,
  destination_country VARCHAR(2) NOT NULL DEFAULT 'XX',
  hs_code VARCHAR(12) NOT NULL,
  hs_code_precision VARCHAR(4) NOT NULL,
  description TEXT,
  confidence NUMERIC(4,3),
  decision_path JSONB,
  gri_rules_applied JSONB,
  ai_call_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_name_hash, destination_country)
);
CREATE INDEX idx_gri_cache_lookup ON gri_classification_cache(product_name_hash, destination_country);

-- 대립 패턴 DB 테이블 (JSON 파일의 DB 버전, 나중에 이관용)
CREATE TABLE IF NOT EXISTS gri_conflict_patterns (
  id SERIAL PRIMARY KEY,
  chapter INTEGER NOT NULL,
  pattern_id VARCHAR(20) NOT NULL UNIQUE,
  pattern_name VARCHAR(200) NOT NULL,
  conflict_headings TEXT[] NOT NULL,
  correct_heading VARCHAR(10) NOT NULL,
  decision_criteria JSONB NOT NULL,
  rejection_reason TEXT,
  exceptions JSONB,
  keywords TEXT[],
  gri_rule_applied VARCHAR(20),
  related_rulings TEXT[],
  source VARCHAR(50) DEFAULT 'manual',
  source_count JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_gri_patterns_chapter ON gri_conflict_patterns(chapter);
CREATE INDEX idx_gri_patterns_keywords ON gri_conflict_patterns USING GIN(keywords);

-- 이 마이그레이션은 DB가 read-write일 때만 실행 가능
-- DB가 아직 read-only면 이 SQL은 나중에 수동 실행

== 2단계 완료 조건 ==
1. app/lib/cost-engine/gri-classifier/ 폴더 전체 생성 완료 (약 20개 파일)
2. 각 step 파일이 독립적 순수 함수로 구현됨
3. pipeline.ts가 11단계를 순차 실행
4. index.ts가 classifyWithGRI를 export
5. app/api/v1/classify/route.ts에 분기 추가
6. supabase/migrations/038_gri_classification.sql 생성
7. npm run build 에러 0개 ✅
8. TypeScript 타입 에러 0개 ✅

== 2단계 핵심 원칙 ==
1. 기존 코드를 삭제하지 마. 새 폴더(gri-classifier/)에 새로 만들어.
2. CLASSIFICATION_ENGINE 환경변수로 전환. 기본값은 legacy (기존 엔진).
3. npm run build가 통과해야 함. 타입 에러 0개.
4. Section/Chapter 키워드 매핑은 하드코딩 OK.
5. console.log 금지. 디버그 로그는 process.env.GRI_DEBUG === 'true'일 때만.
6. 각 Step은 독립적인 순수 함수로 — 유닛 테스트 가능하게.
7. 에러 시 기존 엔진으로 자동 폴백.
8. Supabase REST API 사용 (기존 패턴: @supabase/supabase-js 아닌 fetch 기반이면 fetch, 아니면 기존 클라이언트 활용)

"=== Stage 2 완료 ===" 출력 후 바로 3단계로 넘어가.

================================================================
█ 3단계: 7 Country Agent 구축 (7~10자리)
================================================================

2단계에서 만든 gri-classifier/country-agents/ 안의 7개 파일을 구현해.

== 공통 구조 (모든 Agent 동일) ==

각 Country Agent 함수 시그니처:
export async function classify{COUNTRY}(hs6: string, keywords: string[], price?: number, productName?: string): Promise<CountryAgentResult>

각 Agent 동작 순서:
1. DB에서 gov_tariff_schedules 조회: country='{CC}' AND hs_code LIKE '{hs6}%'
   → 해당 국가의 7~10자리 후보 목록
2. 후보가 0개 → { nationalCode: hs6, codePrecision: 6, method: 'exact_match', confidence: 0.5 }
3. 후보가 1개 → 확정 (confidence: 0.95)
4. 후보가 여러 개:
   a) 해당 국가 규칙 파일에서 Additional Notes 확인
   b) 가격 분기 체크 (hs_price_break_rules)
   c) 키워드 매칭으로 후보 점수 계산
   d) 최고 점수 후보 선택
   e) 점수 차이가 미미하면 → "Other" 후보 선택 (가장 포괄적)
   f) 최후 수단: AI 1회 호출 (후보 목록 제시 → 1개 선택)
5. 결과 반환

== 국가별 규칙 파일 참조 ==

| 국가 | Agent 파일 | 규칙 파일 (외장하드) | DB country | 코드 자릿수 |
|------|-----------|---------------------|-----------|-----------|
| US | us-agent.ts | us_additional_rules.md | 'US' | 10자리 |
| EU | eu-agent.ts | eu_cn_rules.md | 'EU' | 10자리 |
| UK | uk-agent.ts | uk_tariff_rules.md | 'GB' | 10자리 |
| KR | kr-agent.ts | kr_classification_rules.md | 'KR' | 10자리 |
| JP | jp-agent.ts | jp_tariff_rules.md | 'JP' | 9자리 |
| AU | au-agent.ts | au_tariff_rules.md | 'AU' | 10자리 |
| CA | ca-agent.ts | ca_tariff_rules.md | 'CA' | 10자리 |

규칙 파일 경로: /Volumes/soulmaten/POTAL/hs_classification_rules/{파일명}
→ 서버리스에서는 외장하드 접근 불가하므로, 규칙 파일 내용 중 핵심 규칙만 코드에 하드코딩
→ 나머지는 DB 조회로 대체 (gov_tariff_schedules의 description 필드)

== US Agent 상세 (us-agent.ts) — 가장 복잡 ==

1. gov_tariff_schedules에서 country='US', hs_code LIKE '{hs6}%' 조회
   → 보통 3~15개 후보 (US는 Statistical Suffix까지 10자리)
2. US Additional Notes 확인:
   - us_additional_rules.md에서 핵심 규칙 추출하여 코드에 내장
   - "For the purposes of heading XX.XX, the term 'YY' means..." 패턴 파싱
3. 가격 분기: hs_price_break_rules에서 해당 HS6 조회
   - "valued not over $5 per dozen" → price 체크
4. Statistical Suffix 매칭: 후보 description과 키워드 매칭
5. Section 301/232 추가 관세 정보 (있으면 additionalDuties에 포함)
6. 결과 반환

== EU Agent (eu-agent.ts) ==
- CN 8자리 + TARIC 10자리 구조
- eu_cn_rules.md 핵심 규칙 내장
- Combined Nomenclature Additional Notes 적용
- Meursing Table은 현 단계에서 생략 (농산가공품에만 적용, 복잡)

== UK Agent (uk-agent.ts) ==
- Brexit 이후 독자 관세율표 (EU와 대부분 동일하나 세율 다름)
- uk_tariff_rules.md 핵심 규칙 내장
- UK Trade Tariff 10자리

== KR Agent (kr-agent.ts) ==
- 관세·통계통합품목분류표 10자리
- kr_classification_rules.md 핵심 규칙 내장
- 한국 특유의 추가 단위(수량 단위) 참고

== JP Agent (jp-agent.ts) ==
- 関税率表 9자리 (6+3, 일본은 9자리)
- jp_tariff_rules.md 핵심 규칙 내장

== AU Agent (au-agent.ts) ==
- Australian Customs Tariff 10자리
- au_tariff_rules.md 핵심 규칙 내장
- Tariff Concession Orders (TCO) 참고 (있으면)

== CA Agent (ca-agent.ts) ==
- Canadian Customs Tariff 10자리
- ca_tariff_rules.md 핵심 규칙 내장
- CUSMA/CPTPP/CETA 등 FTA 관련 Tariff Treatment Code 참고

== country-agents/index.ts (라우터) ==

export async function routeToCountryAgent(
  hs6: string,
  destinationCountry: string,
  keywords: string[],
  price?: number,
  productName?: string
): Promise<CountryAgentResult | null> {
  const countryMap: Record<string, Function> = {
    'US': classifyUS,
    'EU': classifyEU,
    'GB': classifyUK,
    'KR': classifyKR,
    'JP': classifyJP,
    'AU': classifyAU,
    'CA': classifyCA,
  };

  const agent = countryMap[destinationCountry?.toUpperCase()];
  if (!agent) return null; // 233개국은 null 반환 → 6자리로 끝

  return await agent(hs6, keywords, price, productName);
}

== 3단계 완료 조건 ==
1. 7개 country agent 파일 + index.ts 라우터 구현 완료
2. 각 agent가 gov_tariff_schedules에서 해당 국가 데이터 조회
3. 가격 분기 로직 포함
4. AI 호출은 최후 수단 (0 또는 1회)
5. npm run build 에러 0개 ✅

== 3단계 핵심 원칙 ==
1. 규칙 파일 핵심 내용은 코드에 하드코딩 (서버리스 환경에서 외장하드 접근 불가)
2. DB 조회는 기존 Supabase 클라이언트 사용
3. 각 Agent는 독립적 — 하나가 에러나도 다른 Agent에 영향 없음
4. AI 호출 시 프롬프트에 해당 국가 규칙 + 후보 목록만 포함 (다른 국가 정보 불포함)
5. 233개국(7개국 외)은 null 반환

"=== Stage 3 완료 ===" 출력 후 4단계 진입 전 DB 상태 체크.

================================================================
█ 4단계: CBP 100건 벤치마크 테스트 (검증)
================================================================

⚠️ 4단계 진입 전 DB 체크:
먼저 DB가 read-write인지 확인해. 다음 쿼리로 테스트:

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_a1b63803f34e5db4742340bc78b938b5f0e3cab8" \
  -H "Content-Type: application/json" \
  -d '{"query": "INSERT INTO health_check_logs (check_type, status, details) VALUES ('\''gri_db_test'\'', '\''ok'\'', '\''{}'\''::jsonb) RETURNING id;"}'

성공하면 → 4단계 진행
실패하면 (read-only 에러) → "DB가 아직 read-only입니다. 4단계(벤치마크)는 DB 복구 후 별도 실행해주세요." 출력하고 종료

== 4단계 진행 ==

1. 038_gri_classification.sql 마이그레이션 실행 (DB에 테이블 생성)

2. 벤치마크 테스트 데이터 로드:
   - /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건)
   - 형식: [{ product_name, expected_hs6, source }]
   - 없으면: DB product_hs_mappings에서 source='cbp_cross' 100건 랜덤 추출

3. CLASSIFICATION_ENGINE=gri 환경변수 설정

4. 100건 각각에 대해:
   a) classifyWithGRI({ productName: item.product_name, destinationCountry: 'US' }) 호출
   b) 결과 HS 6자리를 expected_hs6와 비교
   c) 매칭 기준:
      - 6자리 전체 일치: ✅ Exact Match
      - 4자리 일치: ⚠️ Heading Match
      - 2자리 일치: ❌ Chapter Only
      - 완전 불일치: ❌ Miss
   d) 벤치마크 중에는 DB 캐시 저장 하지 마 (공정성)

5. 수집 지표:
   a) 정확도: 6/4/2-digit match rates
   b) 성능: 평균/중앙/최대/최소 처리시간 (ms)
   c) AI 호출 통계: 0회/1회/2회 건수, 평균 호출 횟수
   d) Step별 통계: GRI 1에서 결정된 건수, GRI 3 패턴 매칭, GRI 3 AI, Country Agent
   e) 오분류 분석: 틀린 문제별 원인 (Section Note? Chapter Note? Heading 매칭? 패턴 누락?)

6. 결과 저장:
   - /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1_results.json (100건 전체)
   - /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1_summary.md (요약 리포트)
   - /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1_errors.json (틀린 문제만)

7. 요약 리포트 형식:
```
GRI Agent Team Benchmark v1 — [날짜]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6-digit Exact: XX/100 (XX%)
4-digit Heading: XX/100 (XX%)
2-digit Chapter: XX/100 (XX%)

AI Calls: 평균 X.XX회/건, 0회 XX건, 1회 XX건, 2회 XX건
처리시간: 평균 XXXms, 중앙값 XXXms, 최대 XXXms

vs 이전 POTAL 버전:
- v2 (GPT-4o-mini): 25%
- v8 (GPT-4o): 37%
- v10 (GPT-4o + GRI prompt): 38%
→ GRI Agent Team v1: XX% ★

vs 경쟁사:
- Tarifflo: 89%
- Avalara: 80%
- Zonos: 44%
- WCO BACUDA: 13%

오분류 TOP 원인:
1. [원인] — XX건
2. [원인] — XX건
3. [원인] — XX건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

"=== Stage 4 완료 ===" 출력.

================================================================
█ 최종 요약 출력
================================================================

4단계 전부 끝나면 (또는 DB 문제로 3단계까지만 끝나면) 최종 요약:

```
================================================================
GRI Agent Team 구축 최종 요약 — [날짜 시간]
================================================================

Stage 1: 판례 → 대립 패턴
- 챕터 파일: XX/97개 생성
- 총 대립 패턴: XXX개
- 커버 HS Code: XXX개

Stage 2: 11단계 코드 체인
- 파일 생성: XX개
- npm run build: ✅/❌
- TypeScript 에러: X개

Stage 3: 7 Country Agent
- Agent 구현: X/7개
- npm run build: ✅/❌

Stage 4: 벤치마크
- 6-digit 정확도: XX%
- AI 호출 평균: X.XX회/건
- (또는: DB read-only로 미실행)

다음 작업:
- [ ] git commit + push
- [ ] Vercel 배포
- [ ] CLASSIFICATION_ENGINE=gri 환경변수 Vercel에 설정
- [ ] CBP 100건 외 추가 벤치마크 (ATLAS 18,731건 등)
================================================================
```
```
