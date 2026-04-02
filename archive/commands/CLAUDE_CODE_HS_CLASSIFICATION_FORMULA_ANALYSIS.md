# HS Code 분류 공식 전체 파악 명령어
# Claude Code 터미널 2에 복사-붙여넣기
# 목적: 97개 챕터 전체의 분류 공식을 파악하고, POTAL 코드에 반영

## 핵심 원칙
> "공식이 맞으면 데이터 대입 = 100% 정답"
> 데이터가 부족한 건 나중에 채우면 되지만, 공식 자체가 없으면 데이터가 있어도 틀린다.
> 27건 오답은 전체의 일부일 뿐 — 97개 챕터 전체 공식을 파악해야 한다.

---

## 실행 명령어 (Claude Code에 복사-붙여넣기)

```
너는 POTAL의 HS Code 분류 시스템 아키텍트다.
지금부터 세계관세기구(WCO) HS 분류 체계의 "공식(분류 규칙)" 전체를 파악한다.

## 왜 이 작업이 필요한가

POTAL은 HS Code 분류를 데이터 매칭(product_hs_mappings)으로 하고 있다.
하지만 CBP 벤치마크 32건 중 27건이 틀렸다.
매핑이 있는데도 틀린 12건(WRONG_MAPPING)은 "분류 공식" 자체가 코드에 없기 때문이다.

데이터를 아무리 넣어도 공식이 없으면 틀린다.
공식을 먼저 파악하고 → 코드에 구현하고 → 데이터를 대입하면 → 100%.

## Phase 1: WCO HS 분류 규칙 체계 전체 파악

### 1-1. GIR (General Interpretive Rules) 6개 — 모든 분류의 최상위 규칙

아래 6개 GIR을 코드 로직으로 변환하라. 각 GIR이 어떤 상황에서 적용되는지,
코드에서 어떤 if/else 분기로 표현되는지 정의하라.

- GIR 1: 섹션/챕터 주(Notes) + 호(Heading) 용어 최우선
- GIR 2(a): 미완성/미조립 → 완성품으로 분류
- GIR 2(b): 혼합/복합 물질 → 본질적 특성(essential character)
- GIR 3(a): 가장 구체적인 호 우선
- GIR 3(b): 본질적 특성 (세트, 소매 포장)
- GIR 3(c): 숫자 가장 뒤인 호 (최후의 수단)
- GIR 4: 가장 유사한 물품
- GIR 5: 용기/포장재 규칙
- GIR 6: 소호도 같은 원칙 적용

### 1-2. 97개 챕터 × Section Notes × Chapter Notes

HS 2022 기준 21개 Section + 97개 Chapter의 Notes를 전부 파악하라.
각 챕터의 핵심 분류 기준을 아래 카테고리로 분류:

**분류 결정 요인 (Decision Factors):**
- MATERIAL: 소재/원재료 (cotton, polyester, nickel, steel, plastic, wood 등)
- COMPOSITION: 성분 비율 (50%+ cotton = Ch.52, 50%+ synthetic = Ch.54)
- FUNCTION: 용도/기능 (가정용 vs 산업용, 식용 vs 비식용)
- FORM: 형태 (분말, 액체, 고체, 시트, 와이어, 튜브)
- PROCESSING: 가공 정도 (원료 vs 반가공 vs 완제품)
- VALUE: 가격/가치 ("valued over $X")
- WEIGHT: 무게 ("weighing more than X kg")
- SIZE: 크기/치수 ("width exceeding X cm")
- CAPACITY: 용량/배기량 ("cylinder capacity exceeding 1,500 cc")
- GENDER: 성별 (men's/boys' vs women's/girls')
- AGE: 연령 (adult vs children)
- POWER: 동력 (electric vs manual, wattage)
- ORIGIN: 동물/식물/광물 origin
- PURITY: 순도 ("chemically defined")
- CONSTRUCTION: 제조 방식 (knitted vs woven, forged vs cast)
- SET: 세트 여부 (GIR 3(b) 적용)

### 1-3. 97개 챕터별 분류 결정 트리 작성

각 챕터에 대해 아래 포맷으로 분류 결정 트리를 작성하라:

```
## Chapter [XX]: [챕터명]

### 핵심 분류 요인:
- Primary: [가장 중요한 요인]
- Secondary: [보조 요인들]

### 필요한 데이터 필드:
- [필드명]: [데이터 타입] — [예시]

### 결정 트리:
if (조건1):
    → Heading XX.01
    if (세부조건A):
        → Subheading XXXX.10
    elif (세부조건B):
        → Subheading XXXX.20
elif (조건2):
    → Heading XX.02
    ...

### Chapter Notes 요약:
- Note 1: [내용]
- Note 2: [내용]
...

### 자주 혼동되는 분류:
- [상품A] vs [상품B]: [구분 기준]
```

**우선순위 챕터 (교역량 기준 상위 30개):**

Tier 1 — 소비재 (이커머스 핵심):
Ch.61 편직의류, Ch.62 직조의류, Ch.64 신발, Ch.42 가죽제품, Ch.65 모자,
Ch.71 보석, Ch.95 완구, Ch.85 전자기기, Ch.84 기계, Ch.94 가구

Tier 2 — 식품/화장품:
Ch.04 유제품, Ch.08 과일, Ch.09 커피/차, Ch.15 유지, Ch.17 설탕,
Ch.18 코코아, Ch.19 곡물조제품, Ch.20 과일/채소조제품, Ch.21 조제식료품,
Ch.22 음료, Ch.33 화장품

Tier 3 — 산업재:
Ch.28 무기화학, Ch.29 유기화학, Ch.39 플라스틱, Ch.48 종이, Ch.72 철강,
Ch.73 철강제품, Ch.76 알루미늄, Ch.87 차량, Ch.90 정밀기기

나머지 챕터도 전부 포함하되, Tier 1→2→3 순서로 작성.

## Phase 2: 실제 판결문 기반 공식 검증

### 2-1. CBP Rulings 활용 (외장하드에 220K건 있음)
경로: /Volumes/soulmaten/POTAL/regulations/us_cbp/cbp_rulings_bulk/

CBP Ruling 문서 구조:
- 상품 설명 (DESCRIPTION)
- 적용된 법률/규칙 (HOLDING)
- 분류 근거 (ANALYSIS) ← 이것이 "공식의 실제 적용 사례"

각 챕터별 대표 ruling 5-10개를 읽고, Phase 1에서 파악한 공식이 실제로 어떻게 적용되는지 검증.

### 2-2. EBTI 활용 (터미널 1에서 231K건 수집 완료)
경로: /Volumes/soulmaten/POTAL/regulations/eu_ebti/

EU의 분류 결정문도 같은 방식으로 검증.
EU와 US의 분류 차이가 있는 경우 → COUNTRY_SPECIFIC 규칙으로 기록.

### 2-3. CBLE 기출 활용 (458문제)
경로: /Volumes/soulmaten/POTAL/regulations/us_cble/

CBLE(미국 관세사 시험) 기출문제는 실무 분류 시나리오.
각 문제가 테스트하는 분류 공식을 매핑.

## Phase 3: POTAL 현재 코드 분석 + GAP 도출

### 3-1. 현재 분류 파이프라인 코드 읽기
- app/lib/ai-classifier/ai-classifier.ts — 메인 분류 로직
- app/lib/ai-classifier/heading-subdivider.ts — HS4→HS6 세분화
- app/lib/cost-engine/hs-validator.ts — HS 코드 검증
- app/lib/cost-engine/price-break-engine.ts — 가격 분기 규칙

### 3-2. GAP 분석
Phase 1-2에서 파악한 공식 vs 현재 코드를 대조:

| 분류 공식 | 현재 구현 여부 | GAP | 수정 방법 |
|----------|-------------|-----|----------|
| MATERIAL 기반 분류 | ❌/⚠️/✅ | [설명] | [방법] |
| COMPOSITION 비율 | ❌/⚠️/✅ | [설명] | [방법] |
| FUNCTION 구분 | ❌/⚠️/✅ | [설명] | [방법] |
| ... | ... | ... | ... |

### 3-3. 벤치마크 27건 검증
Phase 1의 공식을 27건 틀린 문제에 적용:
- 공식대로 했으면 맞았을 문제 → 코드에 공식 추가만 하면 해결
- 공식대로 해도 데이터가 없어서 못 맞추는 문제 → 데이터 확보 필요
- 공식 자체가 애매한 문제 → GIR 3(c) 적용 or 전문가 판단 영역

## Phase 4: 수정 계획

### 4-1. classifier 코드 수정 설계
파악된 공식을 코드에 반영하는 구체적 설계:

```typescript
// 예시: Chapter 62 분류 공식
interface ClassificationInput {
  productName: string;
  description?: string;
  material?: string;        // cotton, polyester, wool, silk...
  materialComposition?: Record<string, number>; // { cotton: 60, polyester: 40 }
  gender?: 'men' | 'women' | 'boys' | 'girls' | 'unisex';
  garmentType?: string;     // jacket, shirt, trousers...
  construction?: 'knitted' | 'woven';
  price?: number;
  weight?: number;
  // ... 챕터별 추가 필드
}
```

### 4-2. 데이터 필드 확장
현재 product_hs_mappings 테이블:
- product_name, category, hs6, confidence, source, metadata

추가 필요한 필드 (공식 기반):
- material, composition, function, form, weight, size, ...
- 또는 metadata JSONB에 구조화해서 저장

### 4-3. 분류 규칙 엔진 설계
단순 매핑 룩업이 아닌, 규칙 기반 분류 엔진:
- 상품명에서 키워드 추출 → 분류 요인(material/function/form 등) 파악
- 해당 챕터의 결정 트리 실행
- 결과가 매핑 테이블과 일치하면 높은 confidence
- 불일치하면 규칙 엔진 결과 우선 (매핑이 틀린 것일 수 있음)

## 출력 파일 (4개)

1. **HS_CLASSIFICATION_FORMULAS.md**
   - GIR 6개 코드화
   - 97개 챕터별 분류 결정 트리
   - 필요한 데이터 필드 전체 목록
   - 챕터별 자주 혼동되는 분류 + 구분 기준

2. **HS_FORMULA_VALIDATION.md**
   - CBP/EBTI/CBLE 실제 사례로 공식 검증 결과
   - US vs EU 분류 차이 목록
   - 공식으로 해결 불가한 "전문가 판단" 영역 목록

3. **POTAL_CLASSIFIER_GAP_ANALYSIS.md**
   - 현재 코드 분석 결과
   - 공식 vs 코드 GAP 전체 목록
   - 벤치마크 27건 역추적 검증
   - 수정 우선순위 (가장 많은 문제 해결하는 것부터)

4. **CLASSIFICATION_ENGINE_DESIGN.md**
   - 규칙 기반 분류 엔진 설계서
   - TypeScript 인터페이스/타입 정의
   - 데이터 필드 확장 계획
   - 구현 명령어 (Claude Code용)

## 참고 파일
- 벤치마크 결과: /Volumes/soulmaten/POTAL/benchmark/results/BENCHMARK_ANALYSIS_REPORT.md
- 벤치마크 원본: /Volumes/soulmaten/POTAL/benchmark_test_data.json
- CBP Rulings: /Volumes/soulmaten/POTAL/regulations/us_cbp/cbp_rulings_bulk/
- EBTI: /Volumes/soulmaten/POTAL/regulations/eu_ebti/
- CBLE: /Volumes/soulmaten/POTAL/regulations/us_cble/
- 현재 분류 코드: app/lib/ai-classifier/
- HS 매핑: product_hs_mappings 테이블
- 가격 분기: hs_price_break_rules 테이블
- 정부 스케줄: gov_tariff_schedules 테이블

## 주의사항
- WCO 공식 규칙만 사용 (추정 금지)
- Chapter Notes는 HTSUS/EUR-Lex/UK Trade Tariff 공식 소스에서 확인
- 97개 챕터 전부 — 빠짐없이
- 코드 수정은 이 분석 완료 후 별도 명령어로 실행
- 한 번에 하나의 파일씩 작성 (메모리 관리)
- 각 파일 작성 완료 후 /Volumes/soulmaten/POTAL/benchmark/formulas/ 에 저장
```

## 이 분석의 의미

이 작업이 끝나면:
- 97개 챕터의 분류 공식이 전부 코드화됨
- "상품 정보 → 공식 적용 → 정답 HS Code"가 수학적으로 보장되는 구조
- 데이터가 있으면 → 대입해서 100%
- 데이터가 없으면 → 어떤 데이터가 필요한지 정확히 알 수 있음
- 경쟁사가 "인간 전문가"로 하는 것을 "공식 엔진"으로 대체

## 예상 소요
- Phase 1 (97개 챕터): ~2-3시간
- Phase 2 (판결문 검증): ~1-2시간
- Phase 3 (GAP 분석): ~1시간
- Phase 4 (설계): ~1시간
- 총: ~5-7시간 (하루 안에 완료 가능)
