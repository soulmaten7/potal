# GRI Agent Team 구축 — 4단계 마스터 명령어
# 2026-03-17 22:00 KST
#
# 사용법: 각 단계를 순서대로 Claude Code 터미널에 복사-붙여넣기
# 반드시 이전 단계가 완료된 후 다음 단계를 실행할 것
#
# 전체 구조:
#   1단계: 판례 → 대립 패턴 규칙화 (데이터 전처리)
#   2단계: GRI Agent Team 11단계 코드 체인 구축 (핵심 엔진)
#   3단계: 7 Country Agent 구축 (7~10자리)
#   4단계: CBP 100건 벤치마크 테스트 (검증)

---

# ███████████████████████████████████████████████████████████
# █ 1단계: 판례 → 대립 패턴 규칙화                          █
# ███████████████████████████████████████████████████████████

## 배경:
## - CBP CROSS 220,114건 + EU EBTI 269,730건 = ~50만 판례
## - 이걸 날것으로 검색하면: 느리고, 매번 다른 결과, 토큰 낭비
## - 대신: 챕터별 "대립 패턴"으로 1회 정리 → 매칭으로 사용
## - 각 패턴: 대립 후보(A vs B) + 정답 + 판단 근거 + 탈락 이유 + 예외 조건

```
HS Code 분류 엔진의 "판례 → 대립 패턴 규칙화" 작업을 수행해.

== 목표 ==
CBP CROSS rulings와 EU EBTI rulings에서 반복되는 분류 논쟁 패턴을 추출하여,
97개 Chapter별로 "대립 패턴 규칙 파일"을 생성한다.

== 데이터 소스 ==
1. CBP CROSS rulings: /Volumes/soulmaten/POTAL/regulations/ 에 저장된 220,114건
   - 만약 파일이 없으면: DB의 product_hs_mappings에서 source='cbp_cross'인 데이터 활용
   - 또는 /Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv (142,251건)
2. EU EBTI rulings: /Volumes/soulmaten/POTAL/regulations/eu_ebti/ 에 저장된 269,730건
3. GRI 참고자료: /Volumes/soulmaten/POTAL/hs_classification_rules/ (14개 파일, 2.1MB)
   - section_notes.json (21개 섹션)
   - chapter_notes.json (96개 챕터)
   - COMPLETE_GRI_REFERENCE.md (42KB)

== 작업 순서 ==

Step 1: 데이터 로드 및 챕터별 그룹핑
- CBP + EBTI 데이터를 HS 6자리의 앞 2자리 기준으로 97개 챕터로 분류
- 각 챕터별 ruling 수 집계

Step 2: 챕터별 대립 패턴 추출 (핵심)
- 같은 상품이 서로 다른 HS Code로 분류된 사례들을 찾아
- 이것이 "대립"이야 — 같은 물건인데 A로 분류할지 B로 분류할지 논쟁이 된 것
- 패턴 추출 기준:
  a) 같은 상품명/키워드가 2개 이상의 다른 Heading(4자리)으로 분류된 경우
  b) 같은 Heading 내에서 다른 Subheading(6자리)으로 분류된 경우
  c) chapter_notes.json에서 "이 챕터에서 제외" 또는 "~를 포함"이라고 명시한 것과 관련된 분류

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
  "keywords": ["bluetooth speaker", "LED", "light", "lamp", "speaker"]
}

Step 4: 우선순위 챕터부터 처리
- P0 (핵심 소비재 챕터, 가장 많은 분류 요청): Ch.61-62(의류), Ch.84-85(기계/전기), Ch.39(플라스틱), Ch.42(가죽), Ch.64(신발), Ch.94(가구), Ch.95(완구), Ch.71(보석)
- P1 (산업재): Ch.73(철강), Ch.90(정밀기기), Ch.29(유기화학), Ch.38(화학제품)
- P2 (나머지): 나머지 챕터

Step 5: 저장
- 개별 파일: /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/ch{XX}_patterns.json
- 통합 인덱스: /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/index.json
  - 전체 패턴 수, 챕터별 패턴 수, 총 커버 HS Code 수
- 요약: /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/SUMMARY.md

== 중요 ==
- 데이터가 없는 챕터는 빈 파일이라도 생성 (나중에 채움)
- P0 챕터를 먼저 하고, 완료되면 P1, P2 순서
- 챕터 당 패턴이 0개면 "no_conflicts_found" 표시
- 판례 텍스트에 무기/마약 관련 내용이 있으면 패턴 추출만 하고 원문은 저장하지 마
- 각 패턴에 반드시 gri_rule_applied 필드 포함 (어떤 GRI 규칙이 적용됐는지)
- 각 패턴에 반드시 keywords 필드 포함 (이 패턴에 해당하는 상품 키워드들)
- exceptions 필드는 반드시 포함 — 대립 패턴에서 정답이 뒤집히는 조건
- 진행 상황을 챕터 완료할 때마다 출력해줘

완료 후: 전체 통계 출력 (총 패턴 수, 챕터별 패턴 수 TOP 10, 가장 빈번한 GRI 규칙)
```

---

# ███████████████████████████████████████████████████████████
# █ 2단계: GRI Agent Team 11단계 코드 체인 구축              █
# ███████████████████████████████████████████████████████████

## 배경:
## - 기존 분류 파이프라인: 벡터검색 → 키워드매칭 → LLM 폴백 (정확도 38%)
## - 새 파이프라인: GRI 1~6 순차 적용, 11단계 코드 체인 (목표 89%+)
## - 기존 파일 위치: app/lib/cost-engine/ai-classifier/ (5개 파일)
## - 기존 라우트: app/api/v1/classify/route.ts
## - 기존 타입: app/lib/cost-engine/hs-code/types.ts
##
## 핵심 원칙: 기존 API 인터페이스(입출력)는 유지하고, 내부 엔진만 교체
## 기존 코드는 삭제하지 말고, 새 엔진을 만들어서 플래그로 전환

```
GRI 기반 HS Code 분류 엔진을 구축해.

== 전체 아키텍처 ==

기존 파이프라인 (유지, 폴백으로 사용):
  app/lib/cost-engine/ai-classifier/ (벡터검색 → 키워드 → LLM)

새 GRI 파이프라인 (신규 생성):
  app/lib/cost-engine/gri-classifier/ ← 여기에 새로 만듦

API 라우트는 기존 app/api/v1/classify/route.ts를 수정하여:
  - 환경변수 CLASSIFICATION_ENGINE=gri 이면 GRI 엔진 사용
  - CLASSIFICATION_ENGINE=legacy 또는 미설정이면 기존 엔진 사용
  - 이렇게 하면 안전하게 A/B 테스트 가능

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
- 출력: { keywords: string[], material?: string, productType?: string }
- AI 호출: 없음 (정규식 + 사전 기반)

Step 2 (step02-section-match.ts):
- 입력: keywords, material
- 처리:
  a) 21개 Section별 대표 키워드 매핑 테이블 (하드코딩):
     Section I (Ch.1-5): animal, meat, fish, dairy, egg, live...
     Section II (Ch.6-14): plant, vegetable, fruit, coffee, tea, spice...
     Section III (Ch.15): fat, oil, wax...
     Section IV (Ch.16-24): food, beverage, tobacco, candy, chocolate...
     Section V (Ch.25-27): mineral, stone, cement, fuel, oil, coal...
     Section VI (Ch.28-38): chemical, pharmaceutical, fertilizer, soap, plastic...
     Section VII (Ch.39-40): plastic, rubber, silicone...
     Section VIII (Ch.41-43): leather, skin, fur, handbag, wallet, belt...
     Section IX (Ch.44-46): wood, cork, straw, bamboo, basket...
     Section X (Ch.47-49): paper, cardboard, book, newspaper, printing...
     Section XI (Ch.50-63): textile, cotton, silk, wool, fabric, clothing, knit...
     Section XII (Ch.64-67): footwear, shoe, boot, hat, umbrella, feather...
     Section XIII (Ch.68-70): stone, ceramic, glass, cement, concrete...
     Section XIV (Ch.71): jewelry, pearl, gold, silver, diamond, precious...
     Section XV (Ch.72-83): iron, steel, copper, aluminum, metal, screw, bolt...
     Section XVI (Ch.84-85): machine, engine, motor, electric, electronic, computer...
     Section XVII (Ch.86-89): vehicle, car, bicycle, ship, aircraft, railway...
     Section XVIII (Ch.90-92): optical, medical, instrument, clock, watch, music...
     Section XIX (Ch.93): weapon, firearm, ammunition...
     Section XX (Ch.94-96): furniture, mattress, lamp, toy, game, pen, brush...
     Section XXI (Ch.97): art, antique, painting, sculpture...
  b) 키워드 매칭 점수 계산: 각 Section별로 매칭된 키워드 수
  c) 상위 1~3개 Section 후보 선정 (점수 기반)
  d) material 키워드 보너스: material="cotton" → Section XI 가중치 +2
- 출력: { sectionCandidates: [{section: number, score: number, chapters: number[]}] }
- AI 호출: 없음

Step 3 (step03-section-note-check.ts):
- 입력: sectionCandidates, keywords, material
- 처리:
  a) section_notes.json에서 해당 Section Note 로드
  b) "제외(exclude)" 규칙 체크: Note가 "이 섹션에서 XX는 제외"라고 하면 해당 Section 탈락
  c) "포함(include)" 규칙 체크: Note가 "이 섹션에서 XX는 포함"이라고 하면 확정
  d) "용어 정의" 체크: Note에서 정의한 용어가 상품명에 해당하는지
  e) 예: Section XI Note: "이 섹션에서 '직물(textile)'이란 ... 천연/인조 섬유의 직조물"
     → 상품이 "silicone mat"이면 textile 아님 → Section XI 탈락
- 출력: { validSections: [{section, chapters}], excludedSections: [{section, reason}] }
- AI 호출: 없음 (규칙 기반 매칭)

Step 4 (step04-chapter-match.ts):
- 입력: validSections, keywords, material
- 처리:
  a) validSections에 속한 Chapter들만 대상으로 키워드 매칭
  b) 각 Chapter의 공식 설명 텍스트(DB: hs_codes 테이블 4자리)와 매칭
  c) material 기반 분기: cotton → Ch.52(면직물) vs Ch.61(편직의류) vs Ch.62(비편직의류)
  d) 상위 1~5개 Chapter 후보 선정
- 출력: { chapterCandidates: [{chapter: number, score: number, description: string}] }
- AI 호출: 없음

Step 5 (step05-chapter-note-check.ts):
- 입력: chapterCandidates, keywords, material, price
- 처리:
  a) chapter_notes.json에서 해당 Chapter Note 로드
  b) "제외" 규칙: "이 류에서 다음은 제외한다: ..."
  c) "포함" 규칙: "이 류에서 XX라 함은 ... 을 포함한다"
  d) "용어 정의": Chapter Note에서 정의한 용어가 상품에 해당하는지
  e) "가격 분기": 일부 Chapter Note에 가격 기준 있음 (주로 Step 10에서 처리)
  f) 제외된 Chapter는 대안 Chapter 제시 (Note가 "XX는 Ch.YY에 분류"라고 명시하는 경우)
- 출력: { validChapters: [{chapter, description}], excludedChapters: [{chapter, reason, redirectTo?}] }
- AI 호출: 없음

Step 6 (step06-heading-match.ts):
- 입력: validChapters, keywords, material, productType
- 처리:
  a) validChapters에 속한 Heading(4자리) 목록을 DB에서 조회
  b) 각 Heading의 공식 설명과 상품 키워드 매칭
  c) 점수 = (매칭 키워드 수 × 가중치) + (material 일치 보너스) + (productType 일치 보너스)
  d) "Other" heading (XX.XX에 해당하지 않는 것)은 최하위 우선순위
  e) 후보 1개면 → Step 8로 직행
  f) 후보 2개 이상이면 → Step 7로
- 출력: { headingCandidates: [{heading: string, description: string, score: number}], needsConflictResolution: boolean }
- AI 호출: 없음

Step 7 (step07-conflict-resolve.ts): ★ AI 호출 가능 (유일한 곳)
- 입력: headingCandidates (2개 이상), keywords, material, productName, price
- 처리:
  a) 1단계 결과물인 conflict_patterns/{chapter}_patterns.json 로드
  b) 상품 키워드와 패턴의 keywords 필드 매칭
  c) 매칭된 패턴이 있으면:
     - 패턴의 decision_criteria 적용
     - exceptions 체크
     - correct_heading 반환
     - AI 호출 없음 (패턴 매칭만으로 결정)
  d) 매칭된 패턴이 없으면 (새로운 유형):
     - GPT-4o 호출 (1회):
       프롬프트: "다음 상품을 GRI 3에 따라 분류하시오.
       상품: {productName}
       후보 Heading: {candidates}
       GRI 3(a): 가장 구체적인 설명
       GRI 3(b): 본질적 특성
       GRI 3(c): 마지막 번호
       Section Note: {relevant notes}
       Chapter Note: {relevant notes}
       답변 형식: { heading: string, gri_rule: string, reasoning: string }"
     - 결과를 새 패턴으로 저장 (학습 효과 — 다음에 같은 유형은 AI 없이 처리)
- 출력: { resolvedHeading: string, method: 'pattern_match' | 'ai_resolution', reasoning: string }
- AI 호출: 패턴에 없을 때만 1회

Step 8 (step08-subheading-match.ts):
- 입력: resolvedHeading (4자리), keywords, material, price
- 처리:
  a) 해당 Heading의 Subheading(6자리) 목록을 DB에서 조회
  b) GRI 6 적용: "Subheading 간 비교는 동일 레벨에서만"
  c) Subheading 설명과 키워드 매칭
  d) subheading_notes.json 체크 (있는 경우)
  e) Subheading이 1개면 → 확정
  f) 여러 개면 → 가장 구체적인 설명(GRI 3(a)) 적용
  g) "Other"는 최하위 우선순위
- 출력: { hs6: string, description: string, confidence: number }
- AI 호출: 없음 (설명 매칭)

Step 9 (step09-country-router.ts):
- 입력: hs6, destinationCountry
- 처리:
  a) destinationCountry가 7개국(US/EU/GB/KR/JP/AU/CA) 중 하나인지 확인
  b) 해당 국가면 → country-agents/{country}-agent.ts 호출
  c) 나머지 233국이면 → hs6 그대로 반환 (6자리에서 끝)
- 출력: → Country Agent로 전달 또는 최종 결과

Step 10 (step10-price-break.ts):
- 입력: hs6, hs10_candidates, price
- 처리:
  a) hs_price_break_rules 테이블에서 해당 HS6의 가격 분기 규칙 조회
  b) "valued over $X" / "valued not over $X" 조건 체크
  c) 가격에 따라 후보 필터링
  d) 기존 price-break-engine.ts 활용 (app/lib/classification/price-break-engine.ts)
- 출력: { filteredCandidates: Hs10Candidate[] }
- AI 호출: 없음

Step 11 (step11-final-resolve.ts):
- 입력: hs6, filteredCandidates, country, productName
- 처리:
  a) 후보 1개면 → 확정
  b) 후보 2개 이상이면 → 키워드 매칭으로 최종 선택
  c) 키워드로도 구분 안 되면 → LLM 1회 (5~10개 후보에서 1개 선택)
  d) 결과를 DB 캐시에 저장 (같은 상품 다시 오면 AI 없이 즉시 응답)
  e) 전체 분류 경로(decisionPath) 기록 — 감사 추적용
- 출력: GriClassificationResult (최종)
- AI 호출: 키워드로 불충분할 때만 1회

== 타입 정의 (types.ts) ==

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

== data/ 파일 구현 ==

data/section-notes.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/section_notes.json 로드
- 각 Section의 포함/제외 규칙을 파싱하여 구조화된 객체로 변환
- getSectionNote(sectionNumber: number) → { includes: string[], excludes: string[], definitions: Record<string, string> }

data/chapter-notes.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/chapter_notes.json 로드
- 같은 방식으로 파싱
- getChapterNote(chapterNumber: number) → { includes, excludes, definitions, redirects }

data/subheading-notes.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/subheading_notes.json 로드

data/conflict-patterns.ts:
- /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/*.json 로드
- findMatchingPattern(chapter: number, keywords: string[]) → ConflictPattern | null

data/gri-rules.ts:
- GRI 1-6 규칙 텍스트 하드코딩 (각 규칙이 짧으므로)
- getGriRule(ruleNumber: number) → string

== pipeline.ts (오케스트레이터) ==

export async function classifyWithGRI(input: ProductInput): Promise<GriClassificationResult> {
  const startTime = Date.now();
  const decisionPath = [];
  let aiCallCount = 0;

  // Step 0: DB 캐시 확인 (같은 상품이면 즉시 반환)
  const cached = await checkCache(input.productName, input.destinationCountry);
  if (cached) return cached;

  // Step 1~11 순차 실행
  const step1 = extractKeywords(input);
  decisionPath.push({ step: 1, name: 'keyword_extract', input: input.productName, output: JSON.stringify(step1), method: 'code' });

  const step2 = matchSections(step1);
  decisionPath.push({ step: 2, ... });

  // ... Step 3~6 (전부 코드)

  // Step 7: AI가 필요할 수도 있음
  if (step6.needsConflictResolution) {
    const step7 = await resolveConflict(step6.headingCandidates, step1, input);
    if (step7.method === 'ai_resolution') aiCallCount++;
    decisionPath.push({ step: 7, ..., method: step7.method });
  }

  // Step 8~11
  // ...

  // 결과 DB 캐시 저장
  await saveToCache(input.productName, input.destinationCountry, result);

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

// 기존 분류 로직 위에 추가
const useGriEngine = process.env.CLASSIFICATION_ENGINE === 'gri';

if (useGriEngine) {
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
}
// else: 기존 파이프라인 사용

== DB 테이블 (마이그레이션) ==

파일: supabase/migrations/038_gri_classification.sql

-- GRI 분류 캐시
CREATE TABLE IF NOT EXISTS gri_classification_cache (
  id SERIAL PRIMARY KEY,
  product_name_hash VARCHAR(64) NOT NULL,
  destination_country VARCHAR(2) NOT NULL,
  hs_code VARCHAR(12) NOT NULL,
  hs_code_precision VARCHAR(4) NOT NULL,
  confidence NUMERIC(4,3),
  decision_path JSONB,
  gri_rules_applied JSONB,
  ai_call_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_name_hash, destination_country)
);

CREATE INDEX idx_gri_cache_lookup ON gri_classification_cache(product_name_hash, destination_country);

-- 대립 패턴 DB (나중에 conflict_patterns JSON 파일을 DB로 이관할 때 사용)
CREATE TABLE IF NOT EXISTS gri_conflict_patterns (
  id SERIAL PRIMARY KEY,
  chapter INTEGER NOT NULL,
  pattern_name VARCHAR(200) NOT NULL,
  conflict_headings TEXT[] NOT NULL,
  correct_heading VARCHAR(10) NOT NULL,
  decision_criteria JSONB NOT NULL,
  rejection_reason TEXT,
  exceptions JSONB,
  keywords TEXT[],
  gri_rule_applied VARCHAR(20),
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gri_patterns_chapter ON gri_conflict_patterns(chapter);
CREATE INDEX idx_gri_patterns_keywords ON gri_conflict_patterns USING GIN(keywords);

== 중요 원칙 ==
1. 기존 코드를 삭제하지 마. 새 폴더(gri-classifier/)에 새로 만들어.
2. CLASSIFICATION_ENGINE 환경변수로 전환. 기본값은 legacy (기존 엔진).
3. TypeScript 타입은 기존 HsClassificationResult와 호환되게 만들어.
4. npm run build가 통과해야 함. 타입 에러 0개.
5. Section/Chapter 키워드 매핑은 처음에 하드코딩 OK. 나중에 DB로 이관.
6. console.log 금지. 디버그 로그는 process.env.GRI_DEBUG === 'true'일 때만.
7. 각 Step은 독립적인 순수 함수로 — 테스트 가능하게.
8. 에러 시 기존 엔진으로 자동 폴백 (classifyWithGRI가 실패하면 기존 classifyProductAsync 호출).
```

---

# ███████████████████████████████████████████████████████████
# █ 3단계: 7 Country Agent 구축                              █
# ███████████████████████████████████████████████████████████

## 배경:
## - 2단계의 country-agents/ 폴더에 7개 파일 생성
## - 각 Agent는 해당 국가의 규칙 파일을 참조
## - 규칙 파일 위치: /Volumes/soulmaten/POTAL/hs_classification_rules/
## - 기존 HS10 파이프라인: app/lib/cost-engine/hs-code/hs10-resolver.ts (활용)
## - 기존 gov_tariff_schedules: 89,842행 (7개국 10자리 코드)

```
2단계에서 만든 gri-classifier/country-agents/ 안의 7개 Country Agent를 구현해.

== 공통 구조 (모든 Agent 동일) ==

각 Country Agent는 다음 순서로 동작:
1. HS 6자리 → gov_tariff_schedules에서 해당 국가의 7~10자리 후보 조회
2. 해당 국가의 추가 규칙 파일 참조 (Additional Notes, 가격 분기 등)
3. 후보가 1개 → 확정
4. 후보가 여러 개 → 키워드 매칭 → 가격 분기 → 필요 시 AI 1회
5. 결과 반환 + 해당 국가 관세율 포함

== 국가별 규칙 파일 매핑 ==

| 국가 | 규칙 파일 | DB 테이블 | 코드 자릿수 |
|------|----------|----------|-----------|
| US | us_additional_rules.md | gov_tariff_schedules (country='US') | 10자리 |
| EU | eu_cn_rules.md | gov_tariff_schedules (country='EU') | 10자리 (CN8+TARIC2) |
| UK | uk_tariff_rules.md | gov_tariff_schedules (country='GB') | 10자리 |
| KR | kr_classification_rules.md | gov_tariff_schedules (country='KR') | 10자리 |
| JP | jp_tariff_rules.md | gov_tariff_schedules (country='JP') | 9자리 |
| AU | au_tariff_rules.md | gov_tariff_schedules (country='AU') | 10자리 |
| CA | ca_tariff_rules.md | gov_tariff_schedules (country='CA') | 10자리 |

== US Agent 상세 (us-agent.ts) — 가장 복잡 ==

export async function classifyUS(hs6: string, keywords: string[], price?: number): Promise<CountryAgentResult>

1. gov_tariff_schedules에서 country='US', hs_code LIKE '{hs6}%' 조회
   → US 10자리 후보 목록 (보통 3~15개)
2. us_additional_rules.md에서 해당 Chapter의 US Additional Notes 확인
   - "For the purposes of heading XX.XX, the term 'YY' means..."
3. 가격 분기: hs_price_break_rules에서 해당 HS6 조회
   - "valued not over $5 per dozen" → price 체크 → 후보 필터링
4. Statistical Suffix 매칭: 후보 설명과 키워드 매칭
5. 후보 1개면 확정, 여러 개면:
   - 키워드 매칭 점수 기반 선택
   - 점수 동일하면 "Other" 후보 선택 (가장 포괄적)
   - 또는 AI 1회 호출 (5개 후보에서 1개 선택)
6. Section 301/232 추가 관세 체크 (section301-lookup.ts 활용)

== EU Agent (eu-agent.ts) ==
- CN 8자리 + TARIC 10자리 구조
- eu_cn_rules.md 참조: CN Additional Notes (~1097개), Meursing Table
- Combined Nomenclature 규칙 적용
- 반덤핑 코드 체크 (TARIC measures)

== UK Agent (uk-agent.ts) ==
- Brexit 이후 독자 관세율표
- uk_tariff_rules.md 참조
- UK Trade Tariff 10자리

== KR Agent (kr-agent.ts) ==
- kr_classification_rules.md 참조
- 관세·통계통합품목분류표 10자리
- 한국 특유의 추가 단위(수량 단위) 체크

== JP Agent (jp-agent.ts) ==
- jp_tariff_rules.md 참조
- 関税率表 9자리 (6+3)
- 統計品目番号

== AU Agent (au-agent.ts) ==
- au_tariff_rules.md 참조
- Australian Customs Tariff 10자리
- Tariff Concession Orders (TCO) 체크

== CA Agent (ca-agent.ts) ==
- ca_tariff_rules.md 참조
- Canadian Customs Tariff 10자리
- Tariff Treatment Codes (CUSMA/CPTPP/CETA 등)

== 기존 코드 활용 ==
- hs10-resolver.ts의 로직을 참고하되, GRI 파이프라인에 맞게 재구현
- hs_price_break_rules 테이블 재사용
- gov_tariff_schedules 테이블 재사용
- section301-lookup.ts 재사용

== 출력 타입 ==

interface CountryAgentResult {
  nationalCode: string;      // 7~10자리 최종 코드
  codePrecision: number;     // 자릿수 (8, 9, 10)
  description: string;       // 해당 코드의 공식 설명
  dutyRate?: number;         // 해당 코드의 관세율 (gov_tariff_schedules에 있으면)
  additionalDuties?: string[]; // 추가 관세 (Section 301, AD/CVD 등)
  confidence: number;
  method: 'exact_match' | 'keyword_match' | 'price_break' | 'ai_selection';
  aiCallCount: number;       // 0 또는 1
}

== 중요 ==
1. 규칙 파일은 빌드 타임에 로드하지 말고, 런타임에 lazy load (서버리스 환경)
2. DB 조회는 Supabase REST API 사용 (기존 패턴 따름)
3. 각 Agent는 독립적 — 하나가 에러나도 다른 Agent에 영향 없음
4. AI 호출 시 프롬프트에 해당 국가 규칙 + 후보 목록만 포함 (다른 국가 정보 불포함)
5. 233개국(7개국 외)은 country-agents/index.ts에서 hs6 그대로 반환
```

---

# ███████████████████████████████████████████████████████████
# █ 4단계: CBP 100건 벤치마크 테스트                          █
# ███████████████████████████████████████████████████████████

## 배경:
## - arXiv:2412.14179 논문 방법론 재현
## - 이전 벤치마크: v2(25%) → v8(37%) → v10(38%)
## - 경쟁사: Tarifflo 89%, Avalara 80%, Zonos 44%
## - 목표: GRI Agent Team으로 89%+ (Tarifflo 수준)
## - 벤치마크 데이터: 이전에 /Volumes/soulmaten/POTAL/benchmark_test_data.json 100건 준비 완료

```
GRI 분류 엔진의 벤치마크 테스트를 실행해.

== 테스트 데이터 ==
- /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건)
  - 각 항목: { product_name, expected_hs6, source: "cbp_cross" }
- 없으면: DB의 product_hs_mappings에서 source='cbp_cross'이고 confidence 높은 것 100건 랜덤 추출

== 테스트 방법 ==

1. 100건 각각에 대해 classifyWithGRI() 호출
2. 결과 HS 6자리를 expected_hs6와 비교
3. 매칭 기준:
   - 정확 일치 (6자리 전체): ✅ Exact Match
   - 4자리 일치 (Heading): ⚠️ Heading Match (부분 정답)
   - 2자리 일치 (Chapter): ❌ Chapter Only
   - 완전 불일치: ❌ Miss

== 수집 지표 ==

1. 정확도:
   - 6-digit exact match rate (%)
   - 4-digit heading match rate (%)
   - 2-digit chapter match rate (%)

2. 성능:
   - 평균 처리 시간 (ms)
   - 중앙값 처리 시간
   - 최대/최소

3. AI 호출 통계:
   - AI 호출 0회인 건수 (코드만으로 분류 완료)
   - AI 호출 1회인 건수
   - AI 호출 2회인 건수
   - 평균 AI 호출 횟수

4. 단계별 탈락/결정 통계:
   - GRI 1에서 결정된 건수 (Step 1~6으로 Heading 확정)
   - GRI 3에서 결정된 건수 (Step 7 대립 패턴 매칭)
   - GRI 3 AI 호출로 결정된 건수
   - Country Agent에서 결정된 건수

5. 오분류 분석:
   - 틀린 문제 각각에 대해:
     a) 상품명
     b) 예상 HS6 vs 실제 HS6
     c) 어느 Step에서 잘못 분기됐는지
     d) Section Note/Chapter Note 문제인지, Heading 매칭 문제인지, 대립 패턴 누락인지
     e) 수정 방안 제안

== 결과 저장 ==

파일: /Volumes/soulmaten/POTAL/benchmark_results/
- gri_benchmark_v1_results.json — 100건 전체 결과 (입력, 출력, 예상, 매칭여부, decisionPath)
- gri_benchmark_v1_summary.md — 요약 리포트:
  ```
  GRI Agent Team Benchmark v1 — [날짜]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  6-digit Exact: XX/100 (XX%)
  4-digit Heading: XX/100 (XX%)
  2-digit Chapter: XX/100 (XX%)

  AI Calls: 평균 X.XX회/건
  처리시간: 평균 XXXms, 중앙값 XXXms

  vs 이전 버전:
  - v2 (GPT-4o-mini): 25%
  - v8 (GPT-4o): 37%
  - v10 (GPT-4o + GRI prompt): 38%
  - GRI Agent Team v1: XX% ← 이번

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
- gri_benchmark_v1_errors.json — 틀린 문제만 별도 (수정용)

== 비교 실행 (선택) ==
시간이 되면, 같은 100건에 대해 기존 엔진도 실행해서 A/B 비교:
- CLASSIFICATION_ENGINE=legacy → 기존 정확도
- CLASSIFICATION_ENGINE=gri → 새 정확도
- 건별 비교: 기존은 맞았는데 GRI는 틀린 것, 반대인 것

== 중요 ==
1. 벤치마크 중 DB에 캐시 저장하지 마 (공정한 테스트를 위해)
2. AI 호출은 실제로 해 (모의가 아닌 진짜 API 호출)
3. 100건 전부 완료한 후 결과 출력 (중간에 멈추지 마)
4. 에러 발생 시 해당 건은 "error"로 표시하고 다음으로 넘어가
5. 환경변수 OPENAI_API_KEY 또는 GROQ_API_KEY 확인 필요
```

---

# ███████████████████████████████████████████████████████████
# █ 실행 순서                                                █
# ███████████████████████████████████████████████████████████
#
# 1단계 → 터미널 1에 넣기 (판례 전처리, DB 복구 기다리면서 로컬 작업)
# 2단계 → 터미널 1 또는 2에 넣기 (1단계 완료 후)
# 3단계 → 2단계와 같은 터미널 (2단계 완료 후 바로 이어서)
# 4단계 → 2+3단계 완료 후 + DB read-write 복구 완료 후
#
# 주의: 한 번에 하나의 터미널에서만 실행 (병렬 금지)
# 주의: npm run build 확인 후 다음 단계로
