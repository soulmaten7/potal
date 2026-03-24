# Claude Code 명령어: Layer 2 v3 — 파일 기반 법적 기준 강제 매핑 + HSCodeComp 632건 벤치마크

> **날짜**: 2026-03-22 KST
> **목표**: Layer 1의 코드화 파일을 직접 읽어서 LLM 프롬프트에 넣고, 상품명을 앵커로 나머지 8-field를 법적 기준 안에서만 선택하게 함
> **핵심 원리**:
>   1. product_name = 고정 (셀러가 정한 상품명)
>   2. 나머지 8-field = LLM이 법적 기준 파일을 보고 선택
>   3. 각 field 선택 시 해당 Layer 1 파일의 내용을 프롬프트에 포함
>   4. 대소문자 구분 없이 매핑, 출력은 소문자 통일

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

---

## Phase 1: Layer 1 파일에서 법적 기준 목록 추출

### 1-1. 각 field별 읽어야 할 Layer 1 파일 + 추출할 내용

```python
# ═══ field별 법적 기준 파일 매핑 ═══

FIELD_SOURCES = {
    'material': {
        'file': 'app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts',
        'extract': 'MATERIAL_KEYWORDS',  # 79그룹, 21 Section 기준
        'description': 'WCO HS 21 Section 기준 소재 목록. 이 목록에 없는 값은 material이 아님',
    },
    'origin_country': {
        'file': None,  # ISO 3166 — 코드에 하드코딩 가능
        'extract': 'ISO_3166_CODES',  # 240개국 2자리 코드
        'description': 'ISO 3166-1 alpha-2 국가 코드. CN, US, KR 등',
    },
    'composition': {
        'file': 'app/lib/cost-engine/gri-classifier/data/codified-subheadings.ts',
        'extract': 'COMPOSITION_CONDITIONS',  # "85% 이상 cotton" 같은 조건들
        'description': 'HS Subheading 세분화 기준 성분비. "containing 85 percent or more by weight of cotton" 등',
    },
    'processing': {
        'file': 'app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts',
        'extract': 'PROCESSING_KEYWORDS',  # 50개 가공 키워드
        'description': 'WCO 기준 가공 방식. knitted, woven, roasted, forged 등',
    },
    'price': {
        'file': None,  # 숫자 추출만 — USD 변환
        'extract': None,
        'description': 'WTO 관세평가협정 기준 거래가격. USD로 통일',
    },
    'weight_spec': {
        'file': None,  # 숫자+단위 추출
        'extract': None,
        'description': '무게(kg, g, pounds), 크기(cm, inch), 규격',
    },
    'category': {
        'file': 'app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts',
        'extract': 'CATEGORY_TO_SECTION',  # 128개 카테고리 매핑
        'description': '이커머스 카테고리 → HS Section 매핑. 가능하면 이 목록의 값 사용',
    },
    'description': {
        'file': None,  # 자유 텍스트 — 나머지 키워드
        'extract': None,
        'description': '상품의 기능, 용도, 특징. 다른 field에 안 들어간 키워드',
    },
}
```

### 1-2. 파일에서 실제 목록 추출하는 코드

```python
import re

def extract_material_keywords(filepath):
    """step0-input.ts에서 MATERIAL_KEYWORDS 79그룹 추출"""
    content = open(filepath).read()
    # MATERIAL_KEYWORDS 객체 파싱
    # 결과: {"cotton": ["cotton", "cotton fiber"], "steel": ["steel", "stainless steel"], ...}
    # + 각 그룹이 어떤 Section에 매핑되는지

def extract_processing_keywords(filepath):
    """step0-input.ts에서 PROCESSING_KEYWORDS 추출"""

def extract_category_to_section(filepath):
    """step2-1-section-candidate.ts에서 CATEGORY_TO_SECTION 추출"""

def extract_composition_conditions(filepath):
    """codified-subheadings.ts에서 composition 관련 조건 추출"""
```

### 1-3. 추출 결과를 프롬프트용 텍스트로 변환

```python
def build_material_prompt_text(material_keywords):
    """79그룹을 21 Section별로 정리한 프롬프트 텍스트 생성"""
    text = "## material 허용 목록 (21 Section 기준, 대소문자 구분 없음):\n\n"
    for section_num in range(1, 22):
        groups = [g for g in material_keywords if g['section'] == section_num]
        if groups:
            text += f"Section {section_num}: {', '.join(kw for g in groups for kw in g['keywords'])}\n"
    return text

def build_processing_prompt_text(processing_keywords):
    """가공 키워드 목록"""
    return "## processing 허용 목록:\n" + ', '.join(processing_keywords)

def build_category_prompt_text(category_to_section):
    """카테고리 매핑 목록"""
    return "## category 참조 목록:\n" + '\n'.join(f"- {cat} → Section {sec}" for cat, sec in category_to_section.items())
```

---

## Phase 2: LLM 프롬프트 v3 — 파일 기반 + product_name 앵커

### 시스템 프롬프트 (Layer 1 파일 내용이 동적으로 삽입됨):

```
너는 HS Code 국제 관세 분류 전문가야. 상품의 모든 정보를 분석해서 8개 필드를 채워야 해.

## ⚠️ 핵심 원칙

1. product_name은 이미 확정됨. 절대 수정하지 마.
2. product_name이 "이 상품이 무엇인지"를 알려주는 앵커야.
3. 나머지 8개 필드는 "이 상품명에 대한 관세 분류 정보"를 채우는 거야.
4. 각 필드에는 아래 법적 기준 목록에서만 선택해라. 목록에 없는 값은 넣지 마.
5. 대소문자를 구분하지 마. "Alloy", "ALLOY", "alloy" 전부 같은 거야. 출력은 소문자로 통일.
6. 상품 데이터의 모든 필드(상품명, attributes, 카테고리 등)에서 키워드를 추출하되, 각 키워드를 가장 적합한 field에 배치해라.
7. 하나의 원본 필드에 여러 정보가 섞여있으면 분리해서 각각 맞는 field에 넣어라.

## ⚠️ field별 법적 기준 (이 목록에서만 선택)

### 1. material (가장 중요 — HS Code Section을 결정)
{material_prompt_text}
⚠️ 위 목록에 없는 단어는 material이 아님. "high-quality", "new", "gorgeous"는 material이 아님.
⚠️ 상품 데이터에 "Alloy"가 있으면 → 위 목록에서 "alloy" (Section XV 비금속) 선택.
⚠️ 상품 데이터에 소재 정보가 없으면 → product_name과 category에서 추론해서 위 목록에서 가장 가까운 값 선택.

### 2. origin_country (ISO 3166-1 alpha-2)
2자리 국가코드만. "Mainland China" → "CN", "Korea" → "KR", "Japan" → "JP", "United States" → "US"
모르면 빈 문자열.

### 3. composition (HS Subheading 기준 성분비)
"95% cotton 5% elastane", "100% polyester", "18K gold plated brass" 형식.
소재+비율을 조합. 원본 데이터에 있으면 그대로, 없으면 빈 문자열.

### 4. processing (가공 방식)
{processing_prompt_text}
⚠️ 위 목록에 있는 값만. 없으면 빈 문자열.

### 5. price (USD 가격)
숫자만. CNY면 /7.2로 변환. 모르면 null.

### 6. weight_spec (무게/크기/규격)
"200g", "27.9cm", "12oz", "5x3x1 inch" 형식. 있으면 그대로, 없으면 빈 문자열.

### 7. category (상품 카테고리)
{category_prompt_text}
가장 구체적인 카테고리 사용. 원본 데이터의 카테고리 그대로 사용 가능.

### 8. description (나머지 키워드)
다른 7개 field에 안 들어간 설명적 키워드. 기능, 용도, 특징, 색상, 스타일 등.
"waterproof", "insulated", "vintage", "portable", "handmade" 등.

## ⚠️ 매핑 프로세스

1. 상품의 모든 데이터를 읽어라 (product_name, attributes, category 등)
2. 모든 정보에서 키워드를 추출해라
3. product_name을 앵커로: "이 상품이 {product_name}이면, 이 키워드들 중..."
4. 각 키워드를 위 8개 field 중 가장 적합한 곳에 배치
5. material은 반드시 법적 목록에서 선택
6. processing은 반드시 법적 목록에서 선택
7. 겹치는 키워드가 있으면 더 적합한 field에 넣기
8. 어디에도 안 맞는 키워드는 description에 넣기

## 출력 형식 (JSON만, 설명 없이):
{
  "material": "소문자 값",
  "origin_country": "2자리 코드",
  "category": "값",
  "description": "값",
  "processing": "소문자 값",
  "composition": "값",
  "weight_spec": "값",
  "price": 숫자 또는 null
}
```

### 유저 프롬프트:

```
상품명 (고정): {product_name}

상품 전체 데이터:
{모든 상품 정보 — product_name + product_attributes + category_lv1~5 + price}

위 상품명에 대해 8개 필드를 법적 기준에 맞게 매핑해줘.
```

---

## Phase 3: 632건 실행

### 3-1. 전체 흐름

```python
for item in hscodecomp_data:
    # 1. Layer 1 파일에서 법적 기준 목록 읽기 (최초 1회만, 캐싱)
    material_list = extract_material_keywords(...)
    processing_list = extract_processing_keywords(...)
    category_list = extract_category_to_section(...)

    # 2. 상품 데이터 전체를 텍스트로
    product_info = format_product_info(item)

    # 3. 시스템 프롬프트에 법적 기준 목록 삽입
    system_prompt = build_system_prompt(material_list, processing_list, category_list)

    # 4. LLM 호출
    mapped = call_llm(system_prompt, product_name=item['product_name'], product_info=product_info)

    # 5. 후처리: material이 목록에 있는지 코드로 재검증
    if mapped['material'] not in valid_material_set:
        mapped['material'] = fuzzy_match(mapped['material'], valid_material_set)

    # 6. product_name 고정
    mapped['product_name'] = item['product_name']

    results.append(mapped)
```

### 3-2. 후처리 — 코드 레벨 검증 (LLM 출력 재검증)

```python
def validate_mapped_fields(mapped, valid_materials, valid_processing):
    """LLM 출력을 코드로 재검증"""

    # material 검증
    mat = mapped.get('material', '').lower().strip()
    if mat and mat not in valid_materials:
        # fuzzy match
        from difflib import get_close_matches
        match = get_close_matches(mat, list(valid_materials), n=1, cutoff=0.5)
        mapped['material'] = match[0] if match else ''

    # processing 검증
    proc = mapped.get('processing', '').lower().strip()
    if proc and proc not in valid_processing:
        match = get_close_matches(proc, list(valid_processing), n=1, cutoff=0.5)
        mapped['processing'] = match[0] if match else ''

    # origin_country 검증 — 2자리 대문자
    origin = mapped.get('origin_country', '').upper().strip()
    if len(origin) != 2:
        mapped['origin_country'] = ''

    # price 검증 — 숫자
    price = mapped.get('price')
    if price is not None:
        try:
            mapped['price'] = float(price)
        except:
            mapped['price'] = None

    return mapped
```

---

## Phase 4: 벤치마크

### 4-1. 5가지 시나리오

```
A: product_name만 (기준선)
B: 단순 매핑 (이전)
C: LLM v1 자유 매핑 (이전)
D: LLM v2 material 강제 (이전)
E: LLM v3 파일 기반 전체 강제 (이번) ← 핵심
```

### 4-2. 모든 시나리오 dest=US, ground truth 대조

```
각 시나리오별: Section / Chapter / Heading / HS6 정확도
ground truth: verified_hs6 (HSCodeComp 원본)
```

---

## Phase 5: 오류 분석

### 5-1. 시나리오 E에서 틀린 건 분석

```
LLM_MATERIAL_INVALID — material이 여전히 79그룹 밖
LLM_MATERIAL_WRONG — 유효하지만 잘못된 Section
HEADING_GAP — Layer 1 KEYWORD_TO_HEADINGS에 상품 키워드 없음
SUBHEADING_GAP — Heading 맞지만 Subheading 매칭 실패
CATEGORY_MISMATCH — 카테고리 매핑 오류
```

### 5-2. 필드별 기여도 분석

E vs D 비교: 어떤 필드가 추가로 채워져서 정확도가 올랐는지/안 올랐는지

---

## 결과물

### 엑셀: `POTAL_Layer2_V3_FileDriven.xlsx`

**Sheet 1: 5시나리오 비교**
| 시나리오 | Section | Chapter | Heading | HS6 | 비용 |

**Sheet 2: 필드 채워진 비율 (A→E)**

**Sheet 3: material 유효성 (E)**
- valid / invalid / fuzzy-corrected 건수

**Sheet 4: 오류 분석 (E)**

**Sheet 5: 전 건 상세 (632건)**

시트 마감: `=== 작업 종료 === | 시나리오E HS6 X% (이전D 8%) | material valid X% | 비용 $X`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 절대 수정 금지** — Layer 1 파일은 읽기만
2. **product_name은 고정** — LLM이 수정하지 않는다
3. **material은 MATERIAL_KEYWORDS 79그룹에서만** — LLM 출력 후 코드로 재검증
4. **processing은 PROCESSING_KEYWORDS에서만** — LLM 출력 후 코드로 재검증
5. **Layer 1 파일을 직접 읽어서 프롬프트에 넣는다** — 하드코딩 금지
6. **5가지 시나리오 전부 실행**
7. **대소문자 구분 없이 매핑, 출력 소문자 통일**
8. **엑셀에 전부 기록**

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
