# Claude Code 명령어: 169건 US destination 10자리 벤치마크 + description 대조 검증

> **날짜**: 2026-03-21 KST
> **목표**: 유효한 169건(Blend/other 4건 제외)을 전부 destination_country='US'로 v3 파이프라인 실행 → 나온 10자리 코드의 gov_tariff_schedules description과 실제 상품명을 대조하여 10자리 정확도 검증
> **원리**: Amazon US 상품 = 미국 내 판매 상품. US HTS 10자리가 나와야 하고, 그 10자리 코드의 description이 상품과 일치해야 정확한 분류.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## Phase 1: 유효 데이터 필터

### 1-1. 기존 173건에서 무효값 제거

```python
# amazon_all_products.json 또는 amazon_9field_complete.json에서 로드
# material이 "Blend", "other", "Metal", "" 같은 무효값인 것 제외
INVALID_MATERIALS = {'blend', 'other', 'unknown', 'various', 'mixed', 'n/a', 'na', 'none', ''}

valid = [p for p in products if p.get('material','').strip().lower() not in INVALID_MATERIALS]
print(f'유효: {len(valid)}건')
```

### 1-2. 저장

```python
json.dump(valid, open('amazon_valid_169.json', 'w'), indent=2, ensure_ascii=False)
```

---

## Phase 2: 전부 destination_country='US'로 벤치마크

### 2-1. 환경변수

```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### 2-2. 벤치마크 실행

모든 상품에 destination_country = 'US' 고정:

```typescript
const r = await classifyV3({
  product_name: p.product_name,
  material: p.material,
  origin_country: p.origin_country || 'CN',
  destination_country: 'US',  // ← 전부 US
  category: p.category,
  description: p.description,
  processing: p.processing || '',
  composition: p.composition || '',
  weight_spec: p.weight_spec || '',
  price: p.price || undefined,
});
```

### 2-3. 결과 수집

각 상품마다:
- product_name
- material
- category
- confirmed_hs6 (6자리)
- final_hs_code (Step 4 이후 — 8~10자리)
- hs_code_precision (HS6 / HS8 / HS10)
- duty_rate
- confidence
- decision_path

---

## Phase 3: 10자리 코드 description 대조 (핵심)

### 3-1. gov_tariff_schedules에서 description 조회

나온 final_hs_code를 gov_tariff_schedules에서 찾아서 description을 가져온다:

```sql
SELECT hs_code, description FROM gov_tariff_schedules
WHERE country = 'US' AND hs_code = '{final_hs_code}';
```

### 3-2. 상품명 vs HTS description 대조

각 상품에 대해:

```
상품: "Hanes Men's Cotton T-Shirt"
material: Cotton
파이프라인 결과: 6109100012 (HS10)
HTS description: "Other T-shirts, knitted or crocheted, of cotton"
→ 일치? ✅ (cotton t-shirt = cotton knitted t-shirt)
```

```
상품: "Lodge Seasoned Cast Iron Skillet"
material: Cast Iron
파이프라인 결과: 7323100000 (HS10)
HTS description: "Table, kitchen or other household articles, of iron or steel, of cast iron"
→ 일치? ✅ (cast iron skillet = household article of cast iron)
```

```
상품: "Owala FreeSip Stainless Steel Water Bottle"
material: Stainless Steel
파이프라인 결과: 7323100000 (HS10)
HTS description: "Table, kitchen or other household articles, of stainless steel"
→ 일치? ✅
```

### 3-3. 판정 기준

각 상품의 10자리 코드에 대해 3가지로 판정:

**MATCH** — HTS description이 상품과 명확히 일치
**PARTIAL** — HTS description이 상품 카테고리는 맞지만 세부가 다름 (예: "other articles" 같은 포괄 코드)
**MISMATCH** — HTS description이 상품과 완전히 다름 (예: 커피가 차량으로 분류)
**NO_EXPANSION** — 10자리 확장 실패 (HS6 그대로)

### 3-4. 판정은 자동 + 수동 확인

1차 자동 판정: product_name/material의 키워드가 HTS description에 포함되는지
```python
def auto_judge(product_name, material, hts_description):
    name_lower = product_name.lower()
    desc_lower = hts_description.lower()
    mat_lower = material.lower()

    # material이 description에 있으면 MATCH 가능성 높음
    if mat_lower in desc_lower:
        return 'MATCH'
    # 상품 핵심 키워드가 description에 있으면 MATCH
    keywords = name_lower.split()[:3]  # 상품명 앞 3단어
    if any(kw in desc_lower for kw in keywords if len(kw) > 3):
        return 'MATCH'
    return 'REVIEW'  # 수동 확인 필요
```

2차: REVIEW 판정 건은 엑셀에 상품명 + HTS description을 나란히 적어서 수동 확인 가능하게

---

## Phase 4: 결과 분석

### 4-1. 10자리 확장률

```
전체: 169건
HS10 확장: X건 (X%)
HS8 확장: X건 (X%)
HS6 유지: X건 (X%) — gov_tariff_schedules에 해당 코드 없음
```

### 4-2. 10자리 정확도

```
MATCH: X건 (X%) — HTS description과 일치
PARTIAL: X건 (X%) — 카테고리 맞지만 포괄 코드
MISMATCH: X건 (X%) — 완전 불일치
NO_EXPANSION: X건 (X%) — 확장 안 됨
```

### 4-3. MISMATCH 건 상세 분석

MISMATCH가 있으면 각 건마다:
- 상품명, material, category
- 파이프라인이 준 HS6, final_hs_code
- HTS description
- 왜 틀렸는지 원인 분석

---

## 결과물

### 엑셀: `POTAL_V3_US_HS10_Verification.xlsx`

**Sheet 1: Summary**
- 전체 건수, 확장률, 정확도 (MATCH/PARTIAL/MISMATCH/NO_EXPANSION)

**Sheet 2: All Results**
- 전 건: product_name | material | category | hs6 | final_hs_code | precision | HTS description | 판정 | duty_rate

**Sheet 3: MISMATCH Details**
- 불일치 건 상세 분석

**Sheet 4: NO_EXPANSION Details**
- 확장 안 된 건 — gov_tariff_schedules에 해당 HS6가 없는 이유

시트 마감: `=== 작업 종료 === | 총 X건 | 확장률 X% | MATCH X% | MISMATCH X% | NO_EXPANSION X%`

---

## ⚠️ 절대 규칙

1. **전부 destination_country = 'US'** — 다른 나라 섞지 않는다
2. **무효 material (Blend/other) 제외** — 유효 데이터만
3. **HTS description은 gov_tariff_schedules에서 직접 조회** — 추측 금지
4. **MISMATCH는 반드시 원인 분석** — 파이프라인 버그인지 데이터 문제인지 구분
5. **엑셀에 상품명 + HTS description 나란히 기록** — 나중에 수동 검토 가능하게
