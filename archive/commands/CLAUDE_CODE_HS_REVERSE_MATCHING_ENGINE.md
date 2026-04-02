# HS Code 역매칭 엔진 설계 + 구현 + 1000건 테스트
# Claude Code 터미널 2에 복사-붙여넣기

```
너는 POTAL의 HS Code 분류 시스템 아키텍트다.
지금부터 완전히 새로운 분류 엔진을 설계하고 구현한다.

## 핵심 원칙

기존 방식 (위→아래, 틀림):
  상품명 → product_hs_mappings에서 이름 매칭 → 없으면 AI 추측
  문제: 매핑이 없으면 틀리고, 매핑이 과거 데이터면 오답

새로운 방식 (아래→위, 역매칭):
  상품명 → 95,213개 공식 설명 전부와 동시 매칭 → 후보 축소 → 조건 대입 → 정답
  장점: 정부 공식 데이터 기반, 과거 데이터 의존 없음, 100% 도달 가능

95,213개 = gov_tariff_schedules 89,842개 (7개국 10자리) + HS 2022 5,371개 (6자리)
모든 코드에는 공식 설명(description)이 붙어있다. 이 설명 = 분류 공식.

## Phase 1: 공식 설명 데이터 확보 및 분석

### 1-1. gov_tariff_schedules에서 전체 설명 추출

Supabase에서 전체 데이터 다운로드:
```bash
PGPASSWORD='potalqwepoi2@' /opt/homebrew/Cellar/libpq/18.3/bin/psql \
  -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres \
  -c "\copy (SELECT country, hs_code, description, parent_code, level, unit_of_quantity FROM gov_tariff_schedules ORDER BY country, hs_code) TO '/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv' WITH CSV HEADER"
```

### 1-2. HS 2022 6자리 설명 추출

```bash
PGPASSWORD='potalqwepoi2@' /opt/homebrew/Cellar/libpq/18.3/bin/psql \
  -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres \
  -c "\copy (SELECT code, description FROM hs_codes ORDER BY code) TO '/Volumes/soulmaten/POTAL/benchmark/hs6_descriptions.csv' WITH CSV HEADER"
```

만약 hs_codes 테이블이 없으면, gov_tariff_schedules에서 6자리 레벨만 추출:
```bash
PGPASSWORD='potalqwepoi2@' /opt/homebrew/Cellar/libpq/18.3/bin/psql \
  -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres \
  -c "\copy (SELECT DISTINCT LEFT(hs_code, 6) as hs6, description FROM gov_tariff_schedules WHERE LENGTH(hs_code) >= 6 ORDER BY hs6) TO '/Volumes/soulmaten/POTAL/benchmark/hs6_from_gov.csv' WITH CSV HEADER"
```

### 1-3. 설명 분석 — 분류 키워드 추출

95,213개 설명에서 반복되는 **분류 결정 키워드**를 전부 추출하라:

카테고리별:
- MATERIAL: cotton, polyester, wool, silk, nylon, leather, rubber, plastic, steel, iron, aluminum, nickel, copper, wood, paper, glass, ceramic, ...
- GENDER: men's, women's, boys', girls', unisex, ...
- CONSTRUCTION: knitted, woven, crocheted, forged, cast, molded, extruded, ...
- FORM: powder, liquid, solid, sheet, wire, tube, bar, rod, strip, pellet, granule, ...
- FUNCTION: for cooking, for industrial use, household, medical, agricultural, ...
- VALUE: "valued over", "valued under", "valued not over", specific dollar thresholds
- WEIGHT: "weighing more than", "weighing less than", "not exceeding X kg", ...
- SIZE: "width exceeding", "length not over", "diameter", ...
- COMPOSITION: "containing by weight", "X% or more", "less than X%", ...
- PROCESSING: raw, unprocessed, semi-processed, refined, crude, prepared, preserved, ...
- ORIGIN: animal, vegetable, mineral, synthetic, artificial, ...
- POWER: electric, manual, pneumatic, hydraulic, "output exceeding X kW", ...
- AGE: adult, children, infant, ...
- CAPACITY: "cylinder capacity exceeding", "storage capacity", ...

각 키워드가 HS 코드 설명에서 몇 번 등장하는지, 어떤 챕터에서 주로 사용되는지 통계 정리.

출력: /Volumes/soulmaten/POTAL/benchmark/formulas/KEYWORD_ANALYSIS.md

## Phase 2: 역매칭 엔진 설계

### 2-1. 매칭 알고리즘 설계

```typescript
// reverse-matcher.ts — 역매칭 분류 엔진

interface ProductInput {
  productName: string;          // 필수
  description?: string;         // 선택 (더 정확)
  price?: number;               // 선택 (가격 분기용)
  weight?: number;              // 선택 (무게 분기용)
  originCountry?: string;       // 선택 (원산지)
  destinationCountry: string;   // 필수 (어느 나라 코드 기준?)
}

interface MatchResult {
  hs10: string;                 // 최종 10자리 코드
  hs6: string;                  // 6자리 코드
  description: string;          // 공식 설명
  confidence: number;           // 매칭 신뢰도
  matchedKeywords: string[];    // 매칭된 키워드
  candidates: CandidateCode[];  // 후보 목록 (디버깅용)
  decisionPath: string[];       // 어떤 기준으로 좁혔는지 경로
}

interface CandidateCode {
  code: string;
  description: string;
  score: number;
  matchedTerms: string[];
}
```

### 2-2. 매칭 프로세스 (5단계)

```
Step 1: 상품명 토큰화 + 키워드 추출
  "Men's cotton knitted t-shirt, valued at $12"
  → tokens: [men's, cotton, knitted, t-shirt]
  → attributes: { gender: men's, material: cotton, construction: knitted, type: t-shirt, value: 12 }

Step 2: 95,213개 설명과 병렬 매칭 (역매칭)
  각 코드의 description에 tokens가 몇 개 매칭되는지 점수 계산
  → 상위 N개 후보 추출 (N = 20~50)

Step 3: 후보 축소 — 속성 기반 필터링
  gender: "men's" → 여성용 코드 제외
  material: "cotton" → 합성섬유 코드 제외
  construction: "knitted" → 직조(woven) 코드 제외
  → 후보 3~5개로 축소

Step 4: 조건 분기 — 가격/무게/크기 대입
  value: $12 → "valued over $X" 조건 확인
  weight: 200g → "weighing more than X" 조건 확인
  → 후보 1~2개로 축소

Step 5: 최종 결정
  후보 1개 → 정답 (confidence: 0.99)
  후보 2개 → 둘 다 반환 + "이 정보가 추가로 필요합니다" 메시지
  후보 0개 → "Other" 카테고리 (XXXX.90 계열) 매칭
```

### 2-3. 스코어링 로직 상세

```typescript
function scoreCandidate(product: ProductInput, candidate: TariffCode): number {
  let score = 0;
  const desc = candidate.description.toLowerCase();
  const productTokens = extractTokens(product.productName);

  // 1. 직접 키워드 매칭 (가장 높은 가중치)
  for (const token of productTokens) {
    if (desc.includes(token)) score += 10;
  }

  // 2. 동의어 매칭
  // "t-shirt" = "tee" = "tee shirt" = "singlet"
  // "jacket" = "coat" = "blazer" (주의: Chapter Note에 따라 다를 수 있음)
  for (const token of productTokens) {
    for (const synonym of getSynonyms(token)) {
      if (desc.includes(synonym)) score += 7;
    }
  }

  // 3. 속성 매칭 (소재/성별/제조방식)
  if (product.material && desc.includes(product.material)) score += 15;
  if (product.gender && desc.includes(product.gender)) score += 15;
  if (product.construction && desc.includes(product.construction)) score += 15;

  // 4. 부정 매칭 (이 코드가 아님을 나타내는 키워드)
  // "other than cotton" → cotton 상품이면 이 코드가 아님
  if (desc.includes("other than") || desc.includes("excluding")) {
    // 제외 조건 확인
    score -= checkExclusion(product, desc);
  }

  // 5. 계층 보너스 — 더 구체적인 설명일수록 높은 점수
  // 10자리 > 8자리 > 6자리
  score += candidate.code.replace(/\./g, '').length * 2;

  // 6. 챕터 일관성 — 후보들이 같은 챕터에 모이면 보너스
  // (다른 곳에서 계산)

  return score;
}
```

### 2-4. 동의어 사전 구축

95,213개 설명에서 실제 사용되는 용어를 기반으로 동의어 사전 구축:

```typescript
const SYNONYM_MAP: Record<string, string[]> = {
  // 의류
  "t-shirt": ["tee", "tee shirt", "singlet", "vest", "undershirt"],
  "jacket": ["blazer", "sport coat"],
  "pants": ["trousers", "slacks"],
  "shoes": ["footwear", "boots"],

  // 소재
  "cotton": ["cotton fiber", "cotton fibre"],
  "polyester": ["synthetic fiber", "man-made fiber", "synthetic fibre"],
  "leather": ["hide", "skin"],

  // 형태
  "powder": ["powdered", "in powder form", "pulverized"],
  "liquid": ["in liquid form", "fluid"],

  // ... 95,213개 설명에서 실제로 추출한 동의어로 채움
};
```

이 사전은 Phase 1의 키워드 분석에서 자동 생성되어야 함.

## Phase 3: 구현

### 3-1. reverse-matcher.ts 작성

위 설계를 TypeScript로 구현. 파일 위치: app/lib/ai-classifier/reverse-matcher.ts

요구사항:
- gov_tariff_schedules 89,842행 + HS6 5,371개를 메모리에 로드 (서버 시작 시 1회)
- 상품명 입력 → Step 1~5 실행 → MatchResult 반환
- 기존 ai-classifier.ts를 대체하지 않고, **우선순위를 reverse-matcher가 가지도록** 연결
  - 1순위: reverse-matcher (공식 설명 역매칭)
  - 2순위: product_hs_mappings (기존 매핑, 검증 필요)
  - 3순위: AI/LLM (최후의 수단)

### 3-2. 인덱싱 전략

95,213개를 매번 전체 스캔하면 느리다. 인덱싱 필요:

```typescript
// 키워드 → 코드 역인덱스
const keywordIndex: Map<string, Set<string>> = new Map();
// "cotton" → Set(["610910", "610990", "520100", ...])
// "knitted" → Set(["610110", "610120", "610210", ...])

// 챕터 → 코드 인덱스
const chapterIndex: Map<string, string[]> = new Map();
// "61" → ["610110", "610120", ..., "611790"]
```

이러면 "cotton" + "knitted" 검색 시:
- cotton 매칭 코드 Set ∩ knitted 매칭 코드 Set = 교집합
- 전체 스캔 없이 수십 개 후보로 바로 축소

### 3-3. API 엔드포인트 연결

기존 /api/v1/classify 엔드포인트에 reverse-matcher 연결:

```typescript
// classify/route.ts 수정
export async function POST(request: Request) {
  const { productName, description, price, weight, destinationCountry } = await request.json();

  // 1순위: 역매칭 엔진
  const reverseResult = await reverseMatcher.classify({
    productName,
    description,
    price,
    weight,
    destinationCountry: destinationCountry || 'US'
  });

  if (reverseResult.confidence >= 0.8) {
    return Response.json({
      hsCode: reverseResult.hs10,
      hs6: reverseResult.hs6,
      description: reverseResult.description,
      confidence: reverseResult.confidence,
      method: 'reverse-match',
      decisionPath: reverseResult.decisionPath
    });
  }

  // 2순위: 기존 매핑 (reverse-matcher가 불확실할 때만)
  const mappingResult = await lookupProductHsMapping(productName);

  // 3순위: AI/LLM (최후의 수단)
  const aiResult = await aiClassifier.classify(productName);

  // 결과 종합
  return Response.json(bestResult(reverseResult, mappingResult, aiResult));
}
```

## Phase 4: 1000건 랜덤 테스트

### 4-1. 테스트 데이터 생성

1000개 상품명을 아래 소스에서 랜덤 추출:

A. CBP benchmark_test_data.json에서 100건 (이미 있음, 정답 포함)
B. product_hs_mappings에서 랜덤 300건 (기존 매핑 검증)
C. WDC 상품명에서 랜덤 300건 (실제 이커머스 상품)
D. 97개 챕터별 대표 상품 97건 (챕터 커버리지 확인)
E. 산업용/특수 상품 100건 (화학, 기계, 금속 등 어려운 것들)
F. 엣지 케이스 103건 (세트 상품, 혼합 소재, 미완성품, 부품 등)

총 1,000건

### 4-2. 정답 확보 방법

- A (100건): CBP rulings 정답 이미 있음
- B (300건): product_hs_mappings의 hs6_code가 정답 → 역매칭 결과와 비교 → 다르면 둘 중 뭐가 맞는지 검증
- C (300건): reverse-matcher 결과 vs 기존 ai-classifier 결과 비교
- D (97건): 7개국 정부 API로 현재 정답 조회
- E (100건): CBP rulings DB에서 산업용 상품 정답 추출
- F (103건): GIR 2-5 적용 사례 (세트, 혼합, 미완성 등)

### 4-3. 테스트 실행

```bash
# 1000건 테스트 스크립트
python3 << 'PYEOF'
import json, csv, random, requests, time

# 테스트 데이터 로드
test_items = load_test_data()  # 1000건

results = {
    "total": 0,
    "correct_6digit": 0,
    "correct_10digit": 0,
    "wrong": 0,
    "no_match": 0,
    "errors": [],
    "by_chapter": {},        # 챕터별 정확도
    "by_method": {},         # reverse-match vs mapping vs ai 비율
    "wrong_details": [],     # 틀린 문제 상세
    "improvement_vs_old": {} # 기존 방식 대비 개선율
}

for item in test_items:
    # 역매칭 엔진으로 분류
    response = requests.post("http://localhost:3000/api/v1/classify", json={
        "productName": item["product_name"],
        "destinationCountry": "US"
    }, timeout=30)

    result = response.json()

    # 정답 비교
    predicted = result.get("hs6", "")
    actual = item.get("correct_hs6", "")

    if predicted[:6] == actual[:6]:
        results["correct_6digit"] += 1
    else:
        results["wrong"] += 1
        results["wrong_details"].append({
            "product": item["product_name"],
            "predicted": predicted,
            "actual": actual,
            "method": result.get("method"),
            "confidence": result.get("confidence"),
            "decisionPath": result.get("decisionPath")
        })

    # 챕터별 집계
    chapter = actual[:2]
    if chapter not in results["by_chapter"]:
        results["by_chapter"][chapter] = {"total": 0, "correct": 0}
    results["by_chapter"][chapter]["total"] += 1
    if predicted[:6] == actual[:6]:
        results["by_chapter"][chapter]["correct"] += 1

    results["total"] += 1
    time.sleep(0.1)  # rate limiting

# 결과 저장
with open("/Volumes/soulmaten/POTAL/benchmark/REVERSE_MATCH_TEST_1000.json", "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

# 요약 출력
print(f"=== REVERSE MATCHING ENGINE TEST RESULTS ===")
print(f"Total: {results['total']}")
print(f"6-digit correct: {results['correct_6digit']} ({results['correct_6digit']/results['total']*100:.1f}%)")
print(f"Wrong: {results['wrong']} ({results['wrong']/results['total']*100:.1f}%)")
print(f"\n=== BY CHAPTER ===")
for ch, data in sorted(results["by_chapter"].items()):
    acc = data["correct"]/data["total"]*100 if data["total"] > 0 else 0
    print(f"Ch.{ch}: {acc:.0f}% ({data['correct']}/{data['total']})")
print(f"\n=== WRONG DETAILS (first 20) ===")
for w in results["wrong_details"][:20]:
    print(f"  {w['product']}: predicted={w['predicted']} actual={w['actual']} method={w['method']}")

PYEOF
```

### 4-4. 결과 분석 및 리포트

테스트 완료 후 아래 리포트 생성:

1. **REVERSE_MATCH_TEST_REPORT.md**
   - 전체 정확도 (6자리/10자리)
   - 챕터별 정확도 히트맵
   - 기존 방식(15.6%) 대비 개선율
   - 경쟁사 비교 (Tarifflo 89%, Avalara 80%, Zonos 44%)
   - 틀린 문제 원인 분류 (키워드 부족/동의어 누락/조건 분기 실패/설명 모호)

2. **REVERSE_MATCH_IMPROVEMENTS.md**
   - 테스트에서 발견된 문제점
   - 키워드 사전 추가 필요 항목
   - 동의어 사전 보완 항목
   - 조건 분기 규칙 추가 항목
   - 2차 테스트 계획

3. **기존 방식 vs 역매칭 비교표**
   - 같은 1000건에 대해 기존 ai-classifier 결과도 병행 실행
   - 역매칭 정확도 vs 기존 정확도 직접 비교
   - 어떤 챕터에서 역매칭이 더 나은지/못한지

## 출력 파일 목록

모든 출력 파일은 /Volumes/soulmaten/POTAL/benchmark/formulas/ 에 저장:

1. KEYWORD_ANALYSIS.md — 95,213개 설명 키워드 분석
2. SYNONYM_DICTIONARY.json — 동의어 사전
3. reverse-matcher.ts — 역매칭 엔진 코드 (app/lib/ai-classifier/에 배치)
4. REVERSE_MATCH_TEST_1000.json — 1000건 테스트 결과 raw data
5. REVERSE_MATCH_TEST_REPORT.md — 테스트 결과 분석 리포트
6. REVERSE_MATCH_IMPROVEMENTS.md — 개선 사항

## 참고 데이터

- gov_tariff_schedules: 89,842행 (US 28,718 + EU 17,278 + UK 17,289 + KR/CA/AU/JP ~6,600 each)
- product_hs_mappings: ~1.36M행 (검증 대상)
- benchmark_test_data.json: 100건 (CBP 정답 포함)
- CBP rulings: 220K건 (/Volumes/soulmaten/POTAL/regulations/us_cbp/)
- EBTI: 231K건 (/Volumes/soulmaten/POTAL/regulations/eu_ebti/)
- WDC 상품명: 외장하드 (/Volumes/soulmaten/POTAL/wdc-products/)

## Supabase 연결

```bash
PGPASSWORD='potalqwepoi2@' /opt/homebrew/Cellar/libpq/18.3/bin/psql \
  -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
```

## 주의사항

1. 터미널 3에서 product_hs_mappings \copy 업로드 중 — 같은 테이블에 INSERT 하지 말 것
2. gov_tariff_schedules는 READ ONLY — 수정 금지, 조회만
3. 새 코드는 app/lib/ai-classifier/reverse-matcher.ts에 작성
4. 기존 ai-classifier.ts는 수정하지 말고, classify/route.ts에서 우선순위만 변경
5. 테스트는 로컬 dev 서버(localhost:3000) 또는 직접 함수 호출로 실행
6. 한 번에 하나의 Phase씩 진행 — Phase 1 끝나면 보고, Phase 2 끝나면 보고...
7. 추정 금지 — 95,213개 공식 설명만 사용
```
