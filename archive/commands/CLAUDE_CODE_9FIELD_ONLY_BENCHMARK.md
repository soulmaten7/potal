# Claude Code 명령어: 9-field 완전한 상품만 필터 → v3 전체 파이프라인 벤치마크

> **날짜**: 2026-03-21 KST
> **목표**: 이미 수집된 350건 중 9-field가 전부 채워진 상품만 필터해서 Step 0~6 벤치마크 실행
> **제약**: 데이터를 임의로 채우거나 수정하지 않는다. 있는 데이터 중 완전한 것만 골라서 테스트한다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## Phase 1: 기존 350건에서 9-field 완전한 상품 필터

### 1-1. 데이터 로드

```python
import json
products = json.load(open('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_all_products.json'))
print(f'전체: {len(products)}건')
```

### 1-2. 필터 조건

9-field 전부 비어있지 않은 상품만:

```python
REQUIRED_FIELDS = ['product_name', 'material', 'origin_country', 'category',
                   'description', 'processing', 'composition', 'weight_spec', 'price']

complete = []
for p in products:
    all_filled = True
    for f in REQUIRED_FIELDS:
        val = p.get(f)
        if val is None or val == '' or val == 0:
            all_filled = False
            break
    if all_filled:
        complete.append(p)

print(f'9-field 완전: {len(complete)}건 / {len(products)}건')
```

### 1-3. 필터된 상품 저장

```python
json.dump(complete, open('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_9field_complete.json', 'w'), indent=2, ensure_ascii=False)
```

### 1-4. 필드별 채워진 비율 기록 (엑셀에)

```python
for f in REQUIRED_FIELDS:
    filled = sum(1 for p in products if p.get(f) and p.get(f) != '' and p.get(f) != 0)
    print(f'{f}: {filled}/{len(products)}')
```

---

## Phase 2: 벤치마크 실행

9-field 완전한 상품만으로 v3 파이프라인 Step 0~6 실행.

destination_country를 7개 지원국 + 비지원국으로 배분:

```python
DEST_COUNTRIES = ['US', 'US', 'US', 'EU', 'GB', 'KR', 'JP', 'AU', 'CA', 'BR', 'TH', 'DE']
```

각 상품마다:
1. classifyV3() 호출 (9-field 전부 전달)
2. 결과 기록: section, chapter, heading, hs6, final_hs_code, hs_code_precision, duty_rate, confidence, time_ms

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

---

## Phase 3: 결과 기록

### 엑셀에 기록할 항목:

1. 필터 결과: 350건 중 9-field 완전한 건수
2. 벤치마크 결과:
   - 전체 건수 / 에러 건수 / AI 호출 수
   - Section 0 (미분류) 건수 — **0이어야 정상**
   - HS6 확정 비율
   - HS 확장 (>6자리) 비율 — 국가별
   - Duty rate 조회 성공 비율
   - 평균 처리시간
3. 전 건 상세: product_name, material, category, section, chapter, heading, hs6, final_code, precision, duty_rate

### 엑셀 파일:
결과를 `POTAL_V3_Benchmark_9field_Complete.xlsx`에 저장 (Summary + All Results)

시트 마감: `=== 작업 종료 === | 9-field 완전 X건 / 350건 | 테스트 결과 | 빌드 결과`
