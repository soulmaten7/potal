# Claude Code 명령어: Layer 2 v7 — 코드 교집합 + LLM 선택 방식 + 632건 벤치마크

> **날짜**: 2026-03-22 KST
> **목표**: LLM한테 97개 Chapter 전체를 읽고 판단하라고 시키는 대신, 코드가 먼저 상품 키워드와 코드화 키워드의 교집합으로 후보를 좁히고, LLM은 product_name을 이해해서 후보 중 선택만 한다.
> **핵심 변화**:
>   - v1~v6: LLM이 무거운 일(97개 Chapter 읽기 + 판단) 전부 담당
>   - v7: 코드가 잘하는 것(키워드 교집합) + LLM이 잘하는 것(문맥 이해로 선택) 분리
> **Layer 1 코드 절대 수정 금지**

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## Phase 0: 코드화 키워드 파일 로드

Layer 1에 이미 있는 코드화 파일들:

```
1. CATEGORY 코드화 키워드:
   - CATEGORY_TO_SECTION (step2-1-section-candidate.ts) — 128개 키워드 → Section
   - CHAPTER_DESCRIPTIONS (chapter-descriptions.ts) — 97개 Chapter 한 줄 설명
   - codified-headings.ts — 1,233개 Heading keywords
   → 이 파일들에서 Chapter/Section별 키워드 세트 추출

2. MATERIAL 코드화 키워드:
   - MATERIAL_KEYWORDS (step0-input.ts) — 79그룹, 571개 용어
   - MATERIAL_TO_SECTION (step2-1-section-candidate.ts) — 116개 키워드 → Section
   → 이 파일들에서 material별 키워드 세트 추출

전체 추출 형태:
category_keywords = {
    "Ch.71": ["pearl", "precious", "stone", "gold", "silver", "jewelry", "jewellery", "imitation", "coin", ...],
    "Ch.85": ["electrical", "machinery", "equipment", "sound", "recorder", "television", ...],
    "Ch.67": ["feather", "down", "artificial flower", "human hair", "wig", ...],
    ...97개 Chapter
}

material_keywords = {
    "cotton": ["cotton", "cotton fiber", "pure cotton", ...],
    "steel": ["steel", "stainless steel", "carbon steel", ...],
    "leather": ["leather", "cowhide", "calfskin", ...],
    ...79그룹
}
```

---

## Phase 1: 632건 상품정보 키워드화

각 상품의 모든 필드에서 키워드 추출:

```python
def keywordize_product(item):
    """상품의 모든 정보를 키워드 세트로 변환"""
    keywords = set()

    # product_name에서 단어 추출 (소문자, 특수문자 제거)
    name_words = clean_and_split(item['product_name'])
    keywords.update(name_words)

    # product_attributes에서 키-값 추출
    attrs = parse_json(item.get('product_attributes', '{}'))
    for key, value in attrs.items():
        keywords.update(clean_and_split(str(key)))
        keywords.update(clean_and_split(str(value)))

    # category 5단계에서 단어 추출
    for i in range(1, 6):
        cat = item.get(f'cate_lv{i}_desc', '')
        if cat:
            keywords.update(clean_and_split(cat))

    return keywords
```

---

## Phase 2: 코드 교집합 — category 후보 찾기

```python
def find_category_candidates(product_keywords, category_keywords):
    """상품 키워드와 category 코드화 키워드의 교집합 계산"""
    candidates = []
    for chapter, ch_keywords in category_keywords.items():
        intersection = product_keywords & set(ch_keywords)
        if intersection:
            candidates.append({
                'chapter': chapter,
                'matched_keywords': intersection,
                'match_count': len(intersection)
            })
    # 교집합 많은 순으로 정렬
    candidates.sort(key=lambda x: x['match_count'], reverse=True)
    return candidates  # 상위 N개 반환
```

---

## Phase 3: 코드 교집합 — material 후보 찾기

```python
def find_material_candidates(product_keywords, material_keywords):
    """상품 키워드와 material 코드화 키워드의 교집합 계산"""
    candidates = []
    for material, mat_keywords in material_keywords.items():
        intersection = product_keywords & set(mat_keywords)
        if intersection:
            candidates.append({
                'material': material,
                'matched_keywords': intersection,
                'match_count': len(intersection)
            })
    candidates.sort(key=lambda x: x['match_count'], reverse=True)
    return candidates
```

---

## Phase 4: LLM 선택 — product_name 이해 후 후보 중 선택

LLM에게 주는 정보:
- product_name 원문 (그대로)
- category 후보 목록 (코드 교집합 결과, 상위 5~10개)
- material 후보 목록 (코드 교집합 결과, 상위 5~10개)

```
프롬프트:

아래 상품의 이름을 읽고 이 상품이 무엇인지 이해해라.
그 다음 후보 목록에서 가장 맞는 category와 material을 선택해라.

상품명: {product_name 원문}

category 후보 (교집합 키워드 수 순):
1. Ch.71 (매칭 키워드: jewelry, necklace, pendant) — 3개 매칭
2. Ch.96 (매칭 키워드: accessory) — 1개 매칭
3. Ch.83 (매칭 키워드: metal) — 1개 매칭

material 후보 (교집합 키워드 수 순):
1. alloy (매칭 키워드: alloy) — 1개 매칭
2. steel (매칭 키워드: metal) — 1개 매칭

선택해라. 후보 중에 맞는 게 없으면 "none"으로 답해라.

출력: JSON만
{
  "category": "Ch.XX",
  "material": "xxx"
}
```

---

## Phase 5: description 매칭 (선택적)

category와 material 선택 후, 남은 상품 키워드에서 description 매칭 시도.

```python
def find_description(product_keywords, selected_category, selected_material):
    """category/material로 사용된 키워드 제외 후, 남은 키워드에서 description 매칭"""
    used_keywords = set()
    used_keywords.update(category_matched_keywords)
    used_keywords.update(material_matched_keywords)

    remaining = product_keywords - used_keywords

    # WCO Heading descriptions에서 기능/용도 키워드와 매칭 시도
    # 매칭되는 게 있으면 description에 넣기
    # 매칭되는 게 없으면 빈칸 — 억지로 넣지 않는다
    description_match = match_heading_descriptions(remaining)

    return description_match if description_match else ""
```

⚠️ **description은 억지로 넣지 않는다.** 매칭되는 게 있으면 넣고, 없으면 빈칸. +2%를 위해 억지로 넣어서 오히려 틀리면 의미 없음.

---

## Phase 6: Layer 1 벤치마크

v7 출력(product_name + category + material + description)을 Layer 1 pipeline에 넣고:

```
| 시나리오 | Section | Chapter | Heading | HS6 | 방식 |
|---------|---------|---------|---------|-----|------|
| B (simple map) | 56% | 43% | 19% | 8% | 코드 매핑 |
| D (LLM v2) | 57% | 46% | 19% | 8% | material 규칙 ← HS6 최적 |
| H (LLM v6) | 65% | 43% | 16% | 6% | WCO 원본 텍스트 ← Section 최고 |
| I (v7 교집합) | ?% | ?% | ?% | ?% | 코드 교집합 + LLM 선택 |
```

---

## Phase 7: 결과 분석

### 7-1. 교집합 결과 분석
```
- 632건 중 category 후보가 1개 이상 나온 건수
- 632건 중 material 후보가 1개 이상 나온 건수
- 후보가 0개인 건수 (교집합 없음) → LLM이 "none" 답한 건
- 평균 후보 수 (category / material 각각)
```

### 7-2. LLM 선택 정확도
```
- LLM이 후보 중 정답 category를 선택한 건수
- LLM이 후보 중 정답 material을 선택한 건수
- 정답이 후보에 포함되어 있었는데 LLM이 못 고른 건수
- 정답이 후보에 아예 없었던 건수 (코드 교집합 한계)
```

### 7-3. description 매칭 결과
```
- description 매칭 성공 건수
- description 빈칸 건수
- description이 정확도에 기여한 건수 (+2% 효과 확인)
```

---

## Phase 8: 결과물

### 엑셀: `POTAL_Layer2_V7_Intersection.xlsx`

**Sheet 1: Dashboard**
```
전체 비교 표 (B/D/H/I 시나리오)
교집합 통계 (후보 수, 매칭률)
LLM 선택 정확도
description 매칭 결과
```

**Sheet 2: 632건 전체 상세**
```
| # | product_name | 상품 키워드 수 | category 후보 수 | category 후보 목록 | LLM 선택 | 정답 Ch | 일치 | material 후보 수 | material 후보 | LLM 선택 | 정답 mat | description |
```

**Sheet 3: 후보에 정답이 없었던 건 분석**
```
코드 교집합에서 정답 Chapter/material이 후보에 안 나온 건들
→ 왜 교집합이 안 됐는지 (키워드 차이 분석)
```

**Sheet 4: LLM이 후보 중 정답을 못 고른 건 분석**
```
정답이 후보에 있었는데 LLM이 다른 걸 고른 건들
→ LLM이 왜 틀렸는지
```

시트 마감: `=== 작업 종료 === v7 HS6 X% (v2=8%) | category 후보 적중 X% | material 후보 적중 X% | description 매칭 X건`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 수정 금지**
2. **코드화 키워드 파일은 Layer 1에 있는 것 그대로 사용** — 새로 만들지 않는다
3. **LLM은 후보 중 선택만** — 97개 전체에서 고르라고 하지 않는다
4. **description은 억지로 넣지 않는다** — 매칭 없으면 빈칸
5. **632건 전체 실행**
6. **GPT-4o-mini 사용** (이전 실험과 동일)
7. **엑셀 로깅 필수** (절대 규칙 11번)
8. **벤치마크 하락 시 Ablation 대조** (절대 규칙 12번)

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
