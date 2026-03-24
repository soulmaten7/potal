# Claude Code 명령어: 632건 전체 Category→WCO Chapter 매핑 + 오답 전수 분석

> **날짜**: 2026-03-22 KST
> **목표**: HSCodeComp 632건 전체를 GPT-4o-mini로 Category→WCO 97 Chapter 매핑 테스트. 오답 건의 상품정보를 전부 키워드화해서, 정답 단서가 어디에 있는지(product_name/attributes/category/기타) 분석. 결과를 엑셀에 상세 기재.
> **핵심 질문**: 셀러 category가 WCO Chapter와 다를 때, 정답을 맞출 수 있는 단서가 데이터 어디에 있는가?

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다. 시트명 = YYMMDDHHMM.

---

## Phase 1: 632건 전체 Category→Chapter 매핑

### 1-1. 데이터 준비

HSCodeComp 632건 로드. 각 상품에서:
- product_name
- cate_lv1 ~ cate_lv5 (AliExpress 5단계 category)
- product_attributes (JSON 전체 파싱)
- price, currency_code
- verified_hs_full → 앞 2자리 = 정답 Chapter

### 1-2. WCO 97 Chapter 목록

`app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts`에서 97개 전체 추출.

### 1-3. GPT-4o-mini 632건 호출

각 건마다:
```
프롬프트:
아래는 WCO가 정한 97개 상품 분류 Chapter다 (국제 규칙):
{97개 Chapter 전체}

아래 상품의 카테고리 정보를 보고, 위 97개 Chapter 중 가장 맞는 Chapter 번호를 선택해라.

상품 카테고리: {cate_lv1} > {cate_lv2} > {cate_lv3} > {cate_lv4} > {cate_lv5}
상품명: {product_name}

Chapter 번호만 답해라 (예: 71)
```

temperature=0, 632건 전체 실행. 결과 저장.

### 1-4. 정답 대조

각 건: LLM 답 Chapter vs verified_hs_full 앞 2자리 → 일치/불일치 판정

---

## Phase 2: 오답 전수 키워드화 + 정답 단서 분석

### 2-1. 오답 건 전체 추출

LLM 답 ≠ 정답 Chapter인 건 전부 추출.

### 2-2. 각 오답 건의 상품정보 키워드화

오답 건 각각에 대해 모든 필드를 키워드로 분해:

```python
for item in wrong_items:
    keywords = {
        "product_name_keywords": item['product_name']의 모든 단어,
        "attributes": item['product_attributes'] JSON 파싱한 전체 키-값,
        "category_path": [cate_lv1, cate_lv2, cate_lv3, cate_lv4, cate_lv5],
        "price": item['price'],
        "correct_chapter": verified_hs_full 앞 2자리,
        "correct_chapter_desc": CHAPTER_DESCRIPTIONS[정답 Chapter],
        "llm_chapter": LLM이 답한 Chapter,
        "llm_chapter_desc": CHAPTER_DESCRIPTIONS[LLM Chapter],
    }
```

### 2-3. 정답 단서 위치 분석

각 오답 건에 대해 정답 Chapter를 맞추려면 어떤 정보가 필요했는지 판단:

```
단서 위치 분류:
A: product_name에 정답 단서 있음 (예: "brooch"→Ch.71 imitation jewellery)
B: attributes에 정답 단서 있음 (예: DIY Supplies=Electrical→Ch.85)
C: category 하위 레벨(lv2~lv5)에 정답 단서 있음
D: product_name + attributes 조합으로 정답 유추 가능
E: 데이터 어디에도 정답 단서 없음 (외부 지식 필요)

충돌 여부:
CONFLICT: 셀러 category가 정답과 다른 방향으로 유도
NO_CONFLICT: 셀러 category가 정답과 같은 방향
```

이 판단을 LLM(GPT-4o-mini)에게 시킬 것:

```
프롬프트 (각 오답 건마다):

상품 데이터:
- product_name: {전체}
- attributes: {JSON 전체}
- category: {lv1 > lv2 > lv3 > lv4 > lv5}
- price: {가격}

LLM이 답한 Chapter: Ch.{XX} ({description})
정답 Chapter: Ch.{YY} ({description})

질문:
1. product_name에 정답 Ch.{YY}를 알려주는 단서가 있나? 있으면 어떤 키워드?
2. attributes에 정답 단서가 있나? 있으면 어떤 키-값?
3. category 하위 레벨(lv2~lv5)에 정답 단서가 있나?
4. 셀러 category가 정답과 충돌하나? (CONFLICT / NO_CONFLICT)
5. 단서 위치: A(product_name) / B(attributes) / C(category하위) / D(조합) / E(없음)
6. 정답을 맞추려면 무엇이 필요했는지 한 줄 요약

JSON으로만 답해라.
```

---

## Phase 3: 엑셀 생성

### 엑셀: `POTAL_Layer2_632_Category_Analysis.xlsx`

**Sheet 1: Dashboard**
```
총 632건
정답: X건 (X%)
오답: X건 (X%)

오답 단서 위치 분포:
A (product_name): X건 (X%)
B (attributes): X건 (X%)
C (category 하위): X건 (X%)
D (조합): X건 (X%)
E (없음): X건 (X%)

충돌 분포:
CONFLICT: X건 (X%) — 셀러 category가 오답 유도
NO_CONFLICT: X건 (X%) — category 무관하게 오답

cate_lv1별 정답률:
| cate_lv1 | 건수 | 정답 | 오답 | 정답률 |
```

**Sheet 2: 전 건 상세 (632건)**
```
| # | product_name | cate_lv1 | cate_lv2 | cate_lv3 | LLM Ch | 정답 Ch | 일치 |
```

**Sheet 3: 오답 전체 상세**
```
| # | product_name | category 전체 | attributes 전체 | LLM Ch | LLM Ch 설명 | 정답 Ch | 정답 Ch 설명 | 단서 위치 | 충돌 여부 | 단서 키워드 | 필요 정보 요약 |
```

**Sheet 4: 오답 패턴 분류**
```
오답을 패턴별로 그룹화:
- 패턴 1: 셀러 category가 정답과 충돌 + product_name에 단서 있음 (Case C+A)
- 패턴 2: 셀러 category가 정답과 충돌 + attributes에 단서 있음 (Case C+B)
- 패턴 3: 셀러 category가 정답과 충돌 + 단서 없음 (Case C+E)
- 패턴 4: category 무관 + 단서 있는데 LLM이 못 찾음
- 패턴 5: category 무관 + 단서 없음
각 패턴별 건수 + 대표 사례 5건씩
```

**Sheet 5: cate_lv1 → Chapter 실제 분포**
```
| cate_lv1 | 정답 Chapter 분포 (최빈값 + 비율) | 1:1 매핑 가능 여부 |
예: Jewelry & Accessories → Ch.71(72.6%), Ch.39(6.6%), Ch.83(4.7%)...
```

**Sheet 6: 해결 방향 제안**
```
각 오답 패턴별 해결 방법:
- 패턴 1 해결: product_name 키워드→Chapter 직접 매핑 사전 추가
- 패턴 2 해결: attributes 키-값→Chapter 힌트 매핑
- 패턴 3 해결: LLM 외부 지식 필요 (Enterprise Custom)
- 등등
```

시트 마감: `=== 작업 종료 === 632건 중 정답 X건(X%) 오답 X건(X%) | 단서 있음 X% | 단서 없음 X% | 충돌 X%`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 수정 금지**
2. **632건 전체 실행** — 샘플링 X
3. **오답 건 전부 키워드화** — 빠짐없이
4. **각 오답의 단서 위치를 반드시 판정** (A/B/C/D/E + CONFLICT/NO_CONFLICT)
5. **엑셀에 전부 기록** — 6개 시트
6. **GPT-4o-mini 사용** (이전 실험과 동일 모델)
7. **엑셀 워크로그도 필수** (CLAUDE.md 절대 규칙 11번)

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### 비용 예상:
- Phase 1: 632건 × GPT-4o-mini = ~$0.03
- Phase 2: 오답 건(예상 ~380건) × GPT-4o-mini = ~$0.02
- 총: ~$0.05
