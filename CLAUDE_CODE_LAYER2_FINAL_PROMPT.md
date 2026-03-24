# Claude Code 명령어: Layer 2 최종 프롬프트 설계 + HSCodeComp 632건 벤치마크

> **날짜**: 2026-03-22 KST
> **목표**: Layer 2 프롬프트를 v2 기반으로 최종 설계. 매핑 순서(category→material→description)를 반영하고, 미해결 6가지를 해결한 후 HSCodeComp 632건 재벤치마크.
> **핵심 원칙**:
> - **처음부터 LLM이 product_name을 이해해서 법적 기준 목록에서 선택** (코드 키워드 매칭 먼저 X)
> - **material만 79그룹에서 강제**, 나머지는 LLM 자유 (v2가 최적인 이유)
> - Layer 1 코드 **절대 수정 금지**
> - 경쟁사: AI가 답을 "추측" / POTAL: AI가 질문을 "정리"하고 코드가 답을 "확정"

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다. 시트명 = YYMMDDHHMM.

---

## Phase 0: 미해결 6가지 조사 + Layer 1 파일 추출

### 0-1. Layer 1 파일에서 프롬프트용 데이터 추출

아래 4개 파일을 읽고 프롬프트에 넣을 데이터를 추출:

```
파일 1: app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts
  → MATERIAL_KEYWORDS 79그룹 전체 추출 (primary → variants[] 형태)
  → 21 Section별로 정리

파일 2: app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts
  → CATEGORY_TO_SECTION 128개 전체 추출 (키워드 → Section 번호)
  → MATERIAL_TO_SECTION 116개 전체 추출

파일 3: app/lib/cost-engine/gri-classifier/data/codified-subheadings.ts
  → 5,621개 subheading의 composition 조건 추출
  → 예: "of cotton", "of synthetic fibers", "containing 85% or more by weight"
  → composition 필드 매핑에 사용할 유효 값 목록 생성

파일 4: app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts
  → 1,233개 heading의 WCO 공식 설명 텍스트
  → description 필드 매핑 시 참조 (기능/용도 키워드 추출)
```

### 0-2. 미해결 6가지 조사

각 미해결 항목을 조사하고 결과를 엑셀에 기록:

```
[미해결 1] composition ↔ codified_subheadings 연결
  → codified-subheadings.ts에서 composition 관련 조건 패턴 추출
  → 예: "of cotton", "containing 85% or more", "of wool or fine animal hair"
  → 이 패턴들을 composition 유효값 목록으로 정리
  → BUT v2 기준: composition은 LLM 자유 (강제 X). 참고용으로만 정리

[미해결 2] weight_spec 국제 기준 파일 확인
  → codified-subheadings.ts에서 weight/size 관련 조건 추출
  → 예: "not over 27.9 cm", "weighing more than 200 g/m²"
  → 세관 신고서 기준 단위 확인 (kg, g, cm, m², pieces 등)
  → BUT v2 기준: weight_spec도 LLM 자유. 7~10자리용이니 참고만

[미해결 3] description 기능/용도 법적 기준
  → heading-descriptions.ts 1,233개에서 기능/용도 관련 단어 추출
  → 예: "for sewing", "for industrial use", "for retail sale", "for outdoor use"
  → description은 v2에서 자유이므로 강제 X. Heading 매칭 시 참조용

[미해결 4] category 매핑 로직
  → CATEGORY_TO_SECTION 128개 키 목록 추출
  → 셀러 원본 category가 128개에 포함되면 → 그대로 사용
  → 포함 안 되면 → LLM이 product_name 이해 후 128개 중에서 선택
  → ⚠️ "코드로 매칭 시도 → 안 되면 LLM"이 아님!
  → ⚠️ "처음부터 LLM이 product_name을 이해해서 128개에서 선택"

[미해결 5] price 빈 값 불가
  → 상품인데 가격이 없을 수 없음
  → HSCodeComp 632건에서 price 존재율 확인 (이전: 91%)
  → 없는 경우 → 빈 문자열로 두되, 7~10자리 분류에서 price_break 규칙 적용 불가 고지

[미해결 6] HSCodeComp 632건 재벤치마크
  → Phase 3~5에서 실행
```

---

## Phase 1: Layer 2 최종 프롬프트 설계

### 1-1. LLM 프롬프트 구조

v2 기반 (material만 강제). 이전 v2와의 차이:
- **매핑 순서 명시**: category → material → description (이 순서가 핵심)
- **category 선택 로직 추가**: CATEGORY_TO_SECTION 128개 목록 포함
- **LLM이 문장을 이해해서 선택**하도록 지시 (키워드 매칭이 아님)

### 1-2. 시스템 프롬프트 (최종 v4):

```
너는 이커머스 상품 데이터를 관세 분류용 9개 필드로 재배치하는 전문가야.

셀러들은 상품명에 스타일/색상/소재/유형/지역을 뒤죽박죽 몰아넣는다.
너의 역할은 이 데이터를 읽고 이해해서, 각 정보를 올바른 필드에 배치하는 것이다.

## 매핑 순서 (이 순서대로 결정해라):

### Step 1: product_name 이해
상품의 모든 정보를 읽고 "이 상품이 무엇인지" 파악해라.
"European and American New Retro High-quality Gorgeous Exquisite Versatile Dynamic Green Cute Dragon Pendant Necklace"
→ 이것은 "드래곤 모양 펜던트 목걸이"다.

### Step 2: category 선택 (아래 목록에서)
상품이 무엇인지 이해한 후, 아래 카테고리 목록에서 가장 맞는 것을 선택해라.
상품 데이터에 카테고리 정보가 있으면 참고하되, 아래 목록에 맞는 값으로 선택해라.

{CATEGORY_TO_SECTION 128개 키 목록 — Phase 0에서 추출}

### Step 3: material 선택 (⚠️ 반드시 아래 목록에서만)
product_name + category를 조합해서 소재를 판단해라.
상품 데이터에 material/소재 정보가 있으면 참고하되, **반드시 아래 목록에 있는 값으로만** 출력해라.

예시:
- 데이터에 "Alloy" → 목록에서 "alloy" (Section XV 비금속)
- 데이터에 "Mixed Material" → 주요 소재를 판단해서 목록에서 선택
- 데이터에 소재 없음 → product_name + category에서 추론해서 목록에서 선택

{MATERIAL_KEYWORDS 79그룹 전체 목록 — Phase 0에서 추출, 21 Section별 정리}

⚠️ material 필드에는 위 목록에 있는 단어만 넣어라. 목록에 없는 단어는 절대 넣지 마라.

### Step 4: 나머지 필드 (자유)
- description: 상품의 기능/용도/특징. product_name과 material에 안 들어간 정보.
- processing: 가공 방식 (knitted, woven, roasted, forged, plated, molded 등)
- composition: 소재 구성비 (95% cotton 5% elastane, 100% polyester 등)
- weight_spec: 무게/크기/규격 (200g, 27.9cm, 12oz 등)
- origin_country: ISO 2자리 국가코드 (Mainland China → CN)
- price: USD 숫자만 (CNY면 /7.2로 변환)

## product_name 출력 규칙:
핵심 상품명만. 수식어/형용사/마케팅 문구 제외.
"pendant necklace" ✅ / "gorgeous exquisite dragon pendant necklace" ❌
하지만 상품 유형을 알 수 있는 핵심 키워드는 유지해라.
"yoga mat" ✅ / "mat" ❌ (yoga가 빠지면 상품 유형 불명확)

## 대소문자: 모든 출력은 소문자로 통일

## 출력: JSON만 (설명 없이)
{
  "product_name": "...",
  "category": "...",
  "material": "...",
  "description": "...",
  "processing": "...",
  "composition": "...",
  "weight_spec": "...",
  "origin_country": "...",
  "price": "..."
}
```

### 1-3. 이전 v2와의 핵심 차이

```
v2: material만 강제, 나머지 자유. 매핑 순서 명시 없음.
v4: material만 강제, 나머지 자유. + category→material→description 매핑 순서 명시.
     + CATEGORY_TO_SECTION 128개 목록 추가.
     + "문장을 이해해서 선택" 지시 강화.
     + product_name 출력 규칙 개선 (핵심 키워드 유지).
```

---

## Phase 2: 프롬프트에 넣을 데이터 최종 생성

### 2-1. CATEGORY_TO_SECTION 128개 키 목록 생성

step2-1-section-candidate.ts에서 추출한 128개 키를 Section별로 그룹화:

```
Section I (동물): fish, shrimp, meat, ...
Section II (식물): coffee, tea, rice, ...
...
Section XX (잡화): furniture, toy, ...
Section XXI (예술): painting, sculpture, ...
```

### 2-2. MATERIAL_KEYWORDS 79그룹 → 프롬프트 텍스트

이전 v2와 동일 형식 (571개 유효 용어, 21 Section별 정리). v2에서 이미 검증됨.

### 2-3. 프롬프트 토큰 수 확인

128개 category + 571개 material + 시스템 프롬프트 = 예상 ~2,000 토큰.
GPT-4o-mini 컨텍스트 128K이므로 문제 없음.

---

## Phase 3: HSCodeComp 632건 실행

### 3-1. 데이터 로드

```python
# HSCodeComp 632건 — 이전 벤치마크와 동일 데이터
# 위치: 이전 벤치마크에서 사용한 JSON/CSV
# 필드: product_name, product_attributes, cate_lv1~5_desc, price, currency_code, verified_hs6, verified_hs_full
```

### 3-2. 상품정보 키워드화 (코드, LLM 불필요)

```python
def prepare_product_info(item):
    """상품의 모든 필드를 LLM에 전달할 텍스트로 변환"""
    parts = []
    parts.append(f"product_name: {item.get('product_name', '')}")

    # attributes 파싱
    attrs = parse_json(item.get('product_attributes', '{}'))
    for k, v in attrs.items():
        parts.append(f"{k}: {v}")

    # category 계층
    cats = []
    for i in range(1, 6):
        cat = item.get(f'cate_lv{i}_desc', '')
        if cat:
            cats.append(cat)
    if cats:
        parts.append(f"category: {' > '.join(cats)}")

    # price
    if item.get('price'):
        parts.append(f"price: {item['price']} {item.get('currency_code', '')}")

    return '\n'.join(parts)
```

### 3-3. LLM 호출 (GPT-4o-mini, v4 프롬프트)

```python
def llm_map_v4(product_info: str) -> dict:
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_V4},
            {"role": "user", "content": f"아래 상품을 9-field로 매핑:\n\n{product_info}"}
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

### 3-4. 632건 전체 실행 + 중간 저장

에러 시 빈 값 fallback. 결과 JSON 저장.

---

## Phase 4: material 유효성 검증

### 4-1. LLM 출력 material이 MATERIAL_KEYWORDS 79그룹 안에 있는지 전수 확인

```python
valid_materials = set()  # 79그룹의 모든 키워드 (571개)

for item in mapped_results:
    mat = item.get('material', '').lower()
    if mat and mat not in valid_materials:
        print(f'INVALID: {mat}')

# 유효율: X/632
```

### 4-2. INVALID material → fuzzy 교정

```python
from difflib import get_close_matches
# 유효하지 않은 material → 가장 가까운 유효 material로 교정
```

### 4-3. category 분포 확인

```python
# LLM이 선택한 category가 CATEGORY_TO_SECTION 128개 안에 있는지 확인
# 유효율: X/632
```

---

## Phase 5: Layer 1 벤치마크 (5가지 시나리오)

### 5-1. 시나리오 정의

```
A: product_name만 (기준선 — 이전 ~1~4%)
B: 이전 단순 매핑 9-field (이전 8%)
C: LLM v1 매핑 (이전 8% — material 자유)
D: LLM v2 매핑 (이전 8% — material 79그룹 강제, 매핑 순서 없음)
E: LLM v4 매핑 (이번 — material 강제 + category→material 순서 + 128개 목록) ← 핵심
```

### 5-2. Layer 1 파이프라인 실행

각 시나리오의 9-field를 Layer 1 pipeline-v3에 넣고 결과 비교:
```
각 시나리오별: Section / Chapter / Heading / HS6 정확도 산출
ground truth: verified_hs6
```

### 5-3. 정확도 비교 + E vs D 차이 분석

```
E (v4) vs D (v2) 비교:
- Section: X% vs 57% (±X%p)
- Chapter: X% vs 46% (±X%p)
- Heading: X% vs 19% (±X%p)
- HS6: X% vs 8% (±X%p)

E에서 개선된 건: category 매핑 순서가 material 정확도를 올렸는지?
E에서 하락한 건: 프롬프트 변경으로 인한 부작용?
```

---

## Phase 6: 오류 분석

### 6-1. 오류 분류

```
MATERIAL_INVALID — material이 79그룹 밖 (LLM 미준수)
MATERIAL_WRONG — material 유효하지만 잘못된 Section 매핑
CATEGORY_WRONG — category 선택이 틀림 → Section 오류
HEADING_KEYWORD_GAP — Section/Chapter 맞는데 Heading 키워드 부족 (Layer 1 사전 한계)
SUBHEADING_GAP — Heading 맞는데 Subheading 매칭 실패
```

### 6-2. 오류별 건수 + 대표 사례 5건씩

### 6-3. Ablation 대조 (절대 규칙 12번)

```
Section 떨어지면 → material 또는 category 문제 확인
Chapter 떨어지면 → material 세부/processing 확인
Heading 떨어지면 → KEYWORD_TO_HEADINGS 13,849개 사전 대조
HS6 떨어지면 → Subheading 조건 확인
```

---

## Phase 7: 결과물

### 엑셀: `POTAL_Layer2_V4_Final.xlsx`

**Sheet 1: Dashboard**
| 시나리오 | Section | Chapter | Heading | HS6 | 비용 |
|---------|---------|---------|---------|-----|------|
| A (name only) | | | | | $0 |
| B (simple map) | | | | | $0 |
| C (LLM v1) | | | | | |
| D (LLM v2) | 57% | 46% | 19% | 8% | ~$0.03 |
| **E (LLM v4)** | **?** | **?** | **?** | **?** | |

**Sheet 2: E vs D 상세 비교**
- 개선된 건 목록 + 원인
- 하락한 건 목록 + 원인

**Sheet 3: material 유효성**
- 632건 중 유효 X건, 무효 X건
- v4에서 category 목록 추가로 material 정확도 변화?

**Sheet 4: category 분포**
- LLM 선택 category 분포
- CATEGORY_TO_SECTION 128개 내 유효율

**Sheet 5: 오류 분석**
- 오류 유형별 건수 + 대표 사례

**Sheet 6: 미해결 조사 결과**
- composition 패턴 목록
- weight_spec 단위 목록
- description 기능/용도 키워드
- 결론: 이 데이터를 프롬프트에 넣을지 여부 판단

**Sheet 7: 전 건 상세**
- 632건 × 필드: product_info, LLM output, Layer 1 result, ground truth, 정오

시트 마감: `=== 작업 종료 === | E시나리오 HS6 X% (이전D 8%) | material 유효 X% | category 유효 X% | 비용 $X`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 절대 수정 금지** — step0~step7, pipeline-v3, country-agents, data/ 전부
2. **MATERIAL_KEYWORDS 79그룹 전체를 프롬프트에 포함** — 줄이지 않는다
3. **CATEGORY_TO_SECTION 128개 전체를 프롬프트에 포함** — 새로 추가
4. **material만 강제, 나머지 자유** — v2 원칙 유지 (v3처럼 전체 강제 X)
5. **LLM 출력의 material이 79그룹에 없으면 코드로 강제 교정**
6. **5가지 시나리오(A~E) 전부 실행 + ground truth 대조**
7. **벤치마크 정확도 하락 시 POTAL_Ablation_V2.xlsx 대조** (절대 규칙 12번)
8. **엑셀에 전부 기록** (절대 규칙 11번)
9. **코드 키워드 매칭 먼저 시도 → LLM 폴백 구조 금지** — 처음부터 LLM이 판단

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

### OpenAI API Key (GPT-4o-mini):
```bash
# 이전 벤치마크에서 사용한 키 동일 사용
# 비용 예상: 632건 × ~$0.00005 = ~$0.03
```
