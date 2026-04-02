# Claude Code 명령어 (터미널 1): Amazon 300건+ 수집 + 9-field 추출 + v3 전체 파이프라인 벤치마크

> **날짜**: 2026-03-21 KST
> **목표**: Amazon RapidAPI에서 다양한 카테고리 상품 300건+ 수집 → 9-field 추출 → v3 파이프라인 Step 0~6 전체 벤치마크 실행
> **기존**: Amazon 50건 (CW18, Step 3까지만 테스트). 이번에 추가 수집 + Step 6까지 전체 벤치마크.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## API 정보

```
Amazon RapidAPI:
  Key: 862297c953msh18d0e20a472b36bp1e3751jsn9810b160cdbe
  Host: real-time-amazon-data.p.rapidapi.com

엔드포인트:
  1. 검색: GET /search?query={query}&country=US&page=1  → 48개 ASIN 반환
  2. 상세: GET /product-details?asin={asin}&country=US   → 전체 필드 반환

상세 응답 필드 (9-field 추출용):
  - product_title → product_name
  - product_information → material, weight (Item Weight, Product Dimensions)
  - product_details → material (Material), category (Department 등)
  - about_product → description, composition, processing
  - product_price → price
  - product_information.Country of Origin → origin_country (있을 때)
```

---

## Phase 1: 카테고리별 상품 수집

### 1-1. 수집 카테고리 (30개 — HS Section 1~21 전체 커버)

```python
CATEGORIES = [
    # Section I-IV: 동물, 식물, 식품
    "organic coffee beans",
    "frozen shrimp seafood",
    "dried fruit snack",
    "olive oil extra virgin",
    "honey raw organic",

    # Section V-VII: 광물, 화학, 플라스틱
    "essential oil aromatherapy",
    "plastic food container set",
    "rubber yoga mat",
    "candle soy wax scented",
    "cleaning spray disinfectant",

    # Section VIII-X: 가죽, 목재, 종이
    "leather wallet mens",
    "bamboo cutting board",
    "notebook journal hardcover",
    "cardboard shipping box",

    # Section XI: 섬유
    "cotton t-shirt mens",
    "silk scarf women",
    "polyester jacket windbreaker",
    "wool sweater knitted",
    "linen tablecloth",

    # Section XII-XIV: 신발, 유리, 보석
    "running shoes mens",
    "ceramic coffee mug",
    "glass vase decorative",
    "silver necklace pendant",

    # Section XV-XVI: 금속, 기계
    "stainless steel water bottle",
    "cast iron skillet",
    "cordless drill power tool",
    "blender kitchen appliance",

    # Section XVII-XVIII: 차량, 정밀기기
    "bicycle helmet adult",
    "digital watch sport",

    # Section XX-XXI: 완구, 기타
    "board game family",
    "yoga block foam",
]
```

### 1-2. 수집 스크립트

```python
import requests
import json
import time

API_KEY = '862297c953msh18d0e20a472b36bp1e3751jsn9810b160cdbe'
HEADERS = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
}

def search_products(query: str, page: int = 1) -> list:
    """검색 → ASIN 목록"""
    resp = requests.get(
        'https://real-time-amazon-data.p.rapidapi.com/search',
        headers=HEADERS,
        params={'query': query, 'country': 'US', 'page': str(page)},
        timeout=15
    )
    data = resp.json()
    return data.get('data', {}).get('products', [])

def get_product_details(asin: str) -> dict:
    """ASIN → 상품 상세"""
    resp = requests.get(
        'https://real-time-amazon-data.p.rapidapi.com/product-details',
        headers=HEADERS,
        params={'asin': asin, 'country': 'US'},
        timeout=15
    )
    return resp.json().get('data', {})

def extract_9field(detail: dict) -> dict:
    """상품 상세 → 9-field 추출"""
    info = detail.get('product_information', {}) or {}
    details = detail.get('product_details', {}) or {}
    about = detail.get('about_product', []) or []
    about_text = ' '.join(about) if isinstance(about, list) else str(about)

    return {
        'product_name': detail.get('product_title', ''),
        'material': details.get('Material', '') or details.get('Fabric Type', '') or info.get('Material', ''),
        'origin_country': info.get('Country of Origin', '') or 'CN',
        'category': details.get('Department', '') or details.get('Category', '') or '',
        'description': about_text[:500],
        'processing': '',  # Amazon에 직접 필드 없음 — description에서 추출
        'composition': details.get('Fabric Type', '') or details.get('Material Composition', '') or '',
        'weight_spec': info.get('Item Weight', '') or info.get('Product Dimensions', '') or '',
        'price': float(str(detail.get('product_price', '0')).replace(',', '').replace('$', '')) if detail.get('product_price') else None,
        'source_asin': detail.get('asin', ''),
        'search_query': '',  # 나중에 채움
    }
```

### 1-3. 수집 흐름

```
30개 카테고리 × 검색 → 각 카테고리에서 상위 10개 ASIN 선택
= 300개 ASIN

각 ASIN → product-details API 호출 → 9-field 추출

API rate limit: 호출 간 1초 sleep
총 예상: 30 search + 300 details = 330 API 호출 × 1초 = ~6분
```

### 1-4. 기존 50건 합치기

```python
# 기존 데이터 로드
existing = json.load(open('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_50_products.json'))

# 중복 제거 (ASIN 기준)
existing_asins = {p.get('source_asin') for p in existing}
new_products = [p for p in collected if p.get('source_asin') not in existing_asins]

# 합치기
all_products = existing + new_products
# 저장
json.dump(all_products, open('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_all_products.json', 'w'), indent=2, ensure_ascii=False)
```

---

## Phase 2: 9-field 품질 확인

수집 후 각 필드의 채워진 비율 확인:

```python
fields = ['product_name', 'material', 'origin_country', 'category',
          'description', 'processing', 'composition', 'weight_spec', 'price']

for f in fields:
    filled = sum(1 for p in all_products if p.get(f))
    print(f'{f}: {filled}/{len(all_products)} ({filled*100//len(all_products)}%)')
```

**material, category, description이 핵심.** 이 3개가 비어있는 상품은 벤치마크에서 제외하거나 별도 표시.

---

## Phase 3: v3 전체 파이프라인 벤치마크

### 3-1. 벤치마크 스크립트

기존 `bench-amazon.ts`를 확장하여 Step 6(세율)까지 포함:

```typescript
import { classifyV3 } from './pipeline-v3';

// destination_country 랜덤 배분 (7개국 + 비지원국)
const DEST_COUNTRIES = ['US', 'US', 'US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA', 'BR', 'TH', 'DE'];

async function benchmark(products: any[]) {
    const results = [];

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const dest = DEST_COUNTRIES[i % DEST_COUNTRIES.length];

        const r = await classifyV3({
            product_name: p.product_name,
            material: p.material,
            origin_country: p.origin_country || 'CN',
            destination_country: dest,
            category: p.category,
            description: p.description,
            processing: p.processing || '',
            composition: p.composition || '',
            weight_spec: p.weight_spec || '',
            price: p.price || undefined,
        });

        results.push({
            idx: i + 1,
            product_name: p.product_name?.substring(0, 60),
            material: p.material,
            category: p.category?.substring(0, 40),
            destination: dest,
            // Step 0-3 결과
            section: r.confirmed_section,
            chapter: r.confirmed_chapter,
            heading: r.confirmed_heading,
            hs6: r.confirmed_hs6,
            // Step 4-6 결과
            final_code: r.final_hs_code,
            precision: r.hs_code_precision,
            duty_rate: r.country_specific?.duty_rate,
            price_break: r.price_break_applied,
            // 품질
            confidence: r.confidence,
            ai_calls: r.ai_call_count,
            time_ms: r.processing_time_ms,
            // decision path 요약
            steps: r.decision_path?.map(d => `${d.step}: ${d.output_summary?.substring(0, 50)}`),
        });
    }
    return results;
}
```

### 3-2. 결과 분석

```
벤치마크 후 분석 항목:

1. Step 0-3 (HS6 분류 정확도)
   - Section 정확도: X/300
   - Chapter 정확도: X/300
   - Heading 정확도: X/300
   - HS6 정확도: X/300
   ⚠️ ground truth가 없으므로 "합리적인 분류인지" 수동 샘플 검토 필요
      → 카테고리별 상위 3건씩 출력하여 Section/Chapter가 맞는지 확인

2. Step 4 (Country Router)
   - 7개국 도착: HS8/HS10 확장 비율
   - 비지원국 도착: HS6 유지 비율
   - 확장 실패 (null) 비율

3. Step 5 (Price Break)
   - 적용된 건수 (18건 규칙 중 매칭)

4. Step 6 (세율)
   - duty_rate가 null이 아닌 비율
   - 세율 범위 (min/max/avg)
   - 국가별 세율 분포

5. 성능
   - 평균 처리시간 (ms/건)
   - AI 호출 수 (0이어야 함)
   - 에러 건수
```

### 3-3. 엑셀 결과 저장

벤치마크 결과를 `POTAL_V3_Benchmark_300.xlsx`에 저장:

**Sheet 1: Summary**
- 전체 건수, 카테고리 수, 평균 시간, 에러 수
- Step별 성공률

**Sheet 2: All Results**
- 전 건 상세 (product_name, material, category, section, chapter, heading, hs6, final_code, duty_rate, confidence, time_ms)

**Sheet 3: Category Analysis**
- 카테고리별 Section/Chapter 분포

**Sheet 4: Country Analysis**
- 도착국별 확장 비율, 세율 분포

**Sheet 5: Errors**
- 에러 발생 건 상세

---

## Phase 4: 기존 50건 Step 6까지 재테스트

기존 `amazon_50_products.json` 50건을 **destination_country 포함**하여 다시 돌려서 Step 6(세율)까지 결과 확인.

```
기존 50건은 CW18에서 Step 3까지만 테스트 (Section/Chapter/Heading/HS6 100%).
이번에 Step 4~6(Country Router + Price Break + 세율)까지 포함하여 재검증.
```

---

## 실행 순서

```
□ 1. Amazon RapidAPI search — 30개 카테고리 × 10개 = 300 ASIN 수집
□ 2. Amazon RapidAPI product-details — 300개 ASIN 상세 수집 → 9-field 추출
□ 3. 기존 50건 로드 + 중복 제거 + 합치기
□ 4. 9-field 품질 확인 (필드별 채워진 비율)
□ 5. v3 파이프라인 벤치마크 — 전체 상품 × 7개국+ destination
□ 6. 기존 50건 Step 6 재테스트
□ 7. 결과 분석 + 엑셀 저장
□ 8. 엑셀 로그 마감
```

---

## ⚠️ 절대 규칙

1. **Step 0~3 코드 절대 수정 금지** — 벤치마크만 실행
2. **API rate limit** — 호출 간 1초 sleep
3. **기존 50건 데이터 수정 금지** — 합칠 때 기존 데이터는 그대로, 신규만 추가
4. **RapidAPI 무료 할당량 확인** — 초과 시 429 에러 나면 중단하고 수집된 것만으로 벤치마크
5. **Supabase 환경변수 필수** — v3 파이프라인이 DB를 조회하므로 export NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 세팅
6. **엑셀 2개 생성**: POTAL_V3_Benchmark_300.xlsx (결과) + POTAL_Claude_Code_Work_Log.xlsx (로그)
7. **psql**: `PGPASSWORD='potalqwepoi2@' psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres`

---

## 환경변수 (테스트 실행 시)

```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
