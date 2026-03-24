# Claude Code 명령어: Layer 2 — HSCodeComp 632건 9-field 매핑 분석 + 벤치마크

> **날짜**: 2026-03-21 KST
> **목표**: HSCodeComp 632건의 실제 상품 데이터를 분석하여 (1) 어떤 필드가 있는지 (2) POTAL 9-field로 어떻게 매핑되는지 (3) 매핑 후 Layer 1에 넣으면 정확도가 어떻게 나오는지 확인
> **배경**: Layer 1 = 9-field 완벽 → 7개국 100%. Layer 2 = 불완전 입력을 9-field로 자동 보정. HSCodeComp 632건은 Layer 2 테스트에 최적 (AliExpress 실데이터 + US HTS 10자리 정답).
> **원칙**: Layer 1 코드 절대 수정 금지. Layer 2는 Layer 1 위에 덧씌우는 전처리 레이어.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

---

## Phase 1: HSCodeComp 632건 원본 데이터 전수 분석

### 1-1. HuggingFace에서 데이터 다운로드 (이미 있으면 로드)

```bash
# 이미 있는지 확인
ls /Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_raw.json

# 없으면 다운로드
pip install datasets --break-system-packages
python3 -c "
from datasets import load_dataset
ds = load_dataset('AIDC-AI/HSCodeComp', split='test')
import json
json.dump([dict(row) for row in ds], open('/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_raw.json','w'), ensure_ascii=False, indent=2)
print(f'Downloaded {len(ds)} items')
"
```

### 1-2. 632건 전체 필드 분석

각 상품이 가지고 있는 필드를 전수 분석:

```python
import json

data = json.load(open('/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_raw.json'))
print(f'총 {len(data)}건')
print(f'필드: {list(data[0].keys())}')

# 각 필드별 채워진 비율
for key in data[0].keys():
    filled = sum(1 for d in data if d.get(key) and str(d.get(key)).strip())
    print(f'  {key}: {filled}/{len(data)} ({filled*100//len(data)}%)')
```

### 1-3. product_attributes JSON 파싱 — 어떤 attribute가 있는지

```python
from collections import Counter

attr_keys = Counter()
for d in data:
    attrs = parse_json(d.get('product_attributes', '{}'))
    for k in attrs.keys():
        attr_keys[k] += 1

# 상위 30개 attribute 출력
for k, cnt in attr_keys.most_common(30):
    print(f'  {k}: {cnt}/{len(data)} ({cnt*100//len(data)}%)')
```

### 1-4. 카테고리 5단계 분석

```python
# cate_lv1~lv5 조합 분석
cat_combos = Counter()
for d in data:
    parts = [d.get(f'cate_lv{i}_desc','') for i in range(1,6)]
    cat = ' > '.join(p for p in parts if p)
    cat_combos[cat] += 1

# 상위 20개 카테고리
for cat, cnt in cat_combos.most_common(20):
    print(f'  {cat}: {cnt}건')
```

### 1-5. 엑셀에 전수 분석 기록

---

## Phase 2: POTAL 9-field로 매핑

### 2-1. 매핑 규칙 정의

HSCodeComp 필드 → POTAL 9-field:

```python
def map_to_9field(item):
    attrs = parse_json(item.get('product_attributes', '{}'))

    # 1. product_name ← product_name (그대로)
    product_name = item.get('product_name', '')

    # 2. material ← product_attributes의 Material 또는 유사 키
    material = (attrs.get('Material') or attrs.get('material') or
                attrs.get('Fabric Type') or attrs.get('Main Material') or
                attrs.get('Metal Type') or '')

    # 3. origin_country ← product_attributes의 Origin
    origin_raw = attrs.get('Origin') or attrs.get('origin') or ''
    origin_country = parse_origin(origin_raw)  # "Mainland China" → "CN"

    # 4. category ← cate_lv1 > lv2 > lv3 > lv4 > lv5
    cat_parts = [item.get(f'cate_lv{i}_desc','') for i in range(1,6)]
    category = ' > '.join(p for p in cat_parts if p and p.strip())

    # 5. description ← product_name (HSCodeComp에 별도 description 없음)
    description = ''

    # 6. processing ← product_attributes에서 추출 (있으면)
    processing = (attrs.get('Processing') or attrs.get('processing') or
                  attrs.get('Technique') or attrs.get('Type') or '')

    # 7. composition ← product_attributes에서 추출 (있으면)
    composition = (attrs.get('Composition') or attrs.get('composition') or
                   attrs.get('Fabric Content') or '')

    # 8. weight_spec ← product_attributes의 Weight/Size
    weight = (attrs.get('Weight') or attrs.get('Package weight') or
              attrs.get('Size') or '')

    # 9. price ← price + currency_code
    price = None
    if item.get('price'):
        if item.get('currency_code') == 'USD':
            price = float(item['price'])
        elif item.get('currency_code') == 'CNY':
            price = float(item['price']) / 7.2

    return {
        'product_name': product_name,
        'material': material,
        'origin_country': origin_country or 'CN',  # AliExpress 대부분 중국
        'category': category,
        'description': description,
        'processing': processing,
        'composition': composition,
        'weight_spec': weight,
        'price': price,
        # ground truth
        'verified_hs_full': str(item.get('hs_code','')).zfill(10),
        'verified_hs6': str(item.get('hs_code','')).zfill(10)[:6],
    }
```

### 2-2. 632건 전부 매핑 실행

```python
mapped = [map_to_9field(d) for d in data]

# 매핑 후 각 필드 채워진 비율
for field in ['product_name','material','origin_country','category',
              'description','processing','composition','weight_spec','price']:
    filled = sum(1 for m in mapped if m.get(field) and str(m[field]).strip() and m[field] != 0)
    print(f'{field}: {filled}/{len(mapped)} ({filled*100//len(mapped)}%)')
```

### 2-3. 매핑 결과 저장

```python
json.dump(mapped, open('/Volumes/soulmaten/POTAL/7field_benchmark/hscodecomp_9field_mapped.json','w'), ensure_ascii=False, indent=2)
```

---

## Phase 3: 매핑된 9-field로 Layer 1 파이프라인 벤치마크

### 3-1. 632건 전부 classifyV3 실행

destination_country = 'US' (HSCodeComp의 ground truth가 US HTS 10자리)

```typescript
const r = await classifyV3({
    product_name: m.product_name,
    material: m.material,
    origin_country: m.origin_country,
    destination_country: 'US',
    category: m.category,
    description: m.description,
    processing: m.processing,
    composition: m.composition,
    weight_spec: m.weight_spec,
    price: m.price,
});
```

### 3-2. 정답 대조 (ground truth)

각 상품에 `verified_hs6`와 `verified_hs_full` (US HTS 10자리)이 있으므로:

```
파이프라인 결과:
  confirmed_hs6 vs verified_hs6 → HS6 정확도
  final_hs_code vs verified_hs_full → HS10 정확도
  confirmed_section vs 정답 Section → Section 정확도
  confirmed_chapter vs 정답 Chapter → Chapter 정확도
```

### 3-3. 정확도 산출

```
3가지 시나리오별 정확도:
A. product_name만 넣은 경우 (이전 6.3%) — 비교 기준
B. 매핑한 9-field 전부 넣은 경우 — Layer 2 효과 측정
C. 9-field 중 채워진 것만 넣은 경우 — 현실적 시나리오

각 시나리오별: Section / Chapter / Heading / HS6 / HS10 정확도
```

---

## Phase 4: 오류 분석 — Layer 2가 해결해야 할 패턴 도출

### 4-1. 틀린 건 원인 분류

```
오류 유형:
  MATERIAL_WRONG — material 매핑이 잘못됨 (예: "Alloy" → 어떤 Section?)
  MATERIAL_MISSING — material이 비어있음
  CATEGORY_MISMATCH — AliExpress 카테고리가 HS 카테고리와 안 맞음
  KEYWORD_GAP — product_name 키워드가 사전에 없음 (AliExpress 특유 어휘)
  PRICE_MISSING — price가 없어서 가격분기 실패
  MULTIPLE_SECTION — material이 여러 Section에 걸림
```

### 4-2. 필드별 기여도 분석

```
material이 있을 때 vs 없을 때 정확도 차이
category가 있을 때 vs 없을 때 정확도 차이
price가 있을 때 vs 없을 때 정확도 차이
→ 어떤 필드를 채우는 게 가장 효과적인지
```

### 4-3. Layer 2가 해야 할 작업 목록 도출

```
1. AliExpress material 값 → POTAL material 매핑 테이블 필요한지
2. AliExpress 카테고리 → POTAL category 매핑 필요한지
3. product_name에서 material/category 자동 추출이 필요한지
4. 어떤 attribute를 추가로 파싱해야 하는지
```

---

## 결과물

### 엑셀: `POTAL_Layer2_HSCodeComp_Analysis.xlsx`

**Sheet 1: 원본 데이터 분석**
- 632건 필드별 채워진 비율
- product_attributes 상위 30개 키
- 카테고리 5단계 분포

**Sheet 2: 9-field 매핑 결과**
- 매핑 전/후 필드별 채워진 비율
- 매핑 규칙별 성공률

**Sheet 3: 벤치마크 결과**
- 시나리오 A/B/C별 Section/Chapter/Heading/HS6/HS10 정확도
- 이전 결과(6.3%)와 비교

**Sheet 4: 오류 분석**
- 오류 유형별 건수
- 필드별 기여도
- Layer 2가 해야 할 작업 목록

**Sheet 5: 전 건 상세 (632건)**
- product_name, 매핑된 9-field, 파이프라인 결과, ground truth, 판정

시트 마감: `=== 작업 종료 === | 매핑 성공 X/9 필드 | 시나리오B HS6 X% (이전 6.3%) | 오류 유형 X종 | Layer 2 작업 X개`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 절대 수정 금지** — classifyV3 파이프라인 그대로 사용
2. **HSCodeComp 원본 데이터 수정 금지** — 매핑만, 원본은 그대로
3. **ground truth (hs_code)와 반드시 대조** — 정확도 산출 필수
4. **3가지 시나리오 전부 실행** — A(name만), B(전체 매핑), C(채워진 것만)
5. **오류 분석 필수** — 틀린 건의 원인을 분류해야 Layer 2 설계 가능
6. **엑셀에 전부 기록**

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
