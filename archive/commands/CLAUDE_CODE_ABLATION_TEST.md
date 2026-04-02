# Amazon 50건 — 9-Field Ablation (필드 빼기) 테스트

아래를 전부 실행해라. 중간에 멈추지 마라.

## 목적

9개 필드를 1개씩, 2개씩 빼면서 동일한 Amazon 50개 상품으로 v3 파이프라인을 돌린다.
"몇 개 필드를 넣으면 몇 % 정확도인지" 정확한 수치를 구한다.

이 결과는 셀러에게 보여줄 데이터:
- "9개 다 넣으면 100%"
- "material 빼면 XX%로 떨어집니다"
- "이 필드를 추가하면 +XX% 올라갑니다"

## 테스트 설계

### 9개 필드
필수 3개: product_name, material, origin_country
선택 6개: category, description, processing, composition, weight_spec, price

### 테스트 조합

**Round 1 — 1개씩 빼기 (9개 테스트):**
- 기준: 9/9 전부 (baseline)
- product_name 제외 (나머지 8개) — 이건 필수라 빈 문자열로
- material 제외 (나머지 8개)
- origin_country 제외 (나머지 8개)
- category 제외 (나머지 8개)
- description 제외 (나머지 8개)
- processing 제외 (나머지 8개)
- composition 제외 (나머지 8개)
- weight_spec 제외 (나머지 8개)
- price 제외 (나머지 8개)

**Round 2 — 필수만 (최소 조합):**
- product_name만
- product_name + material
- product_name + category
- product_name + material + origin_country (필수 3개만)
- product_name + material + category
- product_name + material + category + origin_country

**Round 3 — 2개씩 빼기 (주요 조합):**
- material + category 둘 다 제외
- material + description 둘 다 제외
- category + description 둘 다 제외
- processing + composition 둘 다 제외
- weight_spec + price 둘 다 제외

## 실행

amazon_50_products.json (또는 벤치마크에서 사용한 50건 데이터)을 읽어서
각 조합마다 50건 전체를 v3 파이프라인으로 돌려라.

각 조합별로 기록:
- Section 정확도 (%)
- Chapter 정확도 (%)
- Heading 정확도 (%)
- HS6 정확도 (%)

"제외"는 해당 필드를 빈 문자열("")로 전달하는 것.
product_name 제외 시에는 product_name="" 으로 보내되, 에러나면 "unknown product"로.

## 결과 저장

### JSON
`/Volumes/soulmaten/POTAL/7field_benchmark/ablation_results.json`

### 엑셀
`/Volumes/soulmaten/POTAL/7field_benchmark/Amazon_Ablation_Test.xlsx`

**Sheet 1: 요약**
- 전체 결과 테이블: 조합명 | 필드 수 | Section% | Chapter% | Heading% | HS6%
- 핵심 발견 요약
- 필드별 영향도 랭킹 (가장 중요한 필드 → 가장 덜 중요한 필드)

**Sheet 2: Round 1 — 1개씩 빼기**
- 10행 (baseline + 9개 제외) × 5열 (조합, Section, Chapter, Heading, HS6)
- baseline 대비 변화량 (delta) 열 추가
- 정확도 하락이 큰 순으로 정렬

**Sheet 3: Round 2 — 최소 조합**
- 6행 × 5열
- "최소 몇 개로 몇 % 달성 가능한지" 명확히

**Sheet 4: Round 3 — 2개씩 빼기**
- 5행 × 5열

**Sheet 5: 필드 영향도 분석**
- 각 필드별: 제거 시 Section/Chapter/Heading/HS6 변화량
- CRITICAL / HIGH / MEDIUM / LOW / NONE 등급
- 어떤 Step에서 영향을 미치는지 (Step 0/2-1/2-3/3/4)
- 셀러에게 보여줄 메시지 예시: "material을 추가하면 정확도 +XX%"

엑셀을 portal 폴더에도 복사:
```bash
cp /Volumes/soulmaten/POTAL/7field_benchmark/Amazon_Ablation_Test.xlsx /Users/maegbug/potal/Amazon_Ablation_Test.xlsx 2>/dev/null || true
```

전체를 한번에 실행하고 끝까지 완료해라.
