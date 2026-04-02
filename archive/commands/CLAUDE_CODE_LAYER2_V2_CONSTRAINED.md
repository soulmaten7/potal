# Claude Code 명령어: Layer 2 v2 — MATERIAL_KEYWORDS 79그룹 기준 강제 매핑 + HSCodeComp 632건 벤치마크

> **날짜**: 2026-03-22 KST
> **목표**: LLM 프롬프트에 MATERIAL_KEYWORDS 79그룹 전체 목록을 넣고, "이 목록 안에 있는 값으로만 material을 매핑해라"고 강제. Ablation에서 product_name + material + category + description = 100%이므로, material만 정확히 매핑하면 정확도가 크게 올라야 함.
> **핵심 원리**: material은 21 Section 기준으로 법적으로 정해진 값. 이 밖의 값은 material이 아님. LLM이 "Alloy"를 뱉으면 안 되고, "alloy → base metal(Section XV)"처럼 우리 기준에 맞는 값으로 변환해야 함.
> **Layer 1 코드 절대 수정 금지.**

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

---

## Phase 1: MATERIAL_KEYWORDS 79그룹 전체 목록 추출

### 1-1. step0-input.ts에서 MATERIAL_KEYWORDS 추출

```python
# step0-input.ts를 읽고 MATERIAL_KEYWORDS 전체를 추출
# 79그룹, 각 그룹에 속한 키워드 + 매핑되는 Section

# 결과 형식:
# {
#   "cotton": {"section": 11, "keywords": ["cotton", "cotton fiber", "pure cotton"]},
#   "steel": {"section": 15, "keywords": ["steel", "stainless steel", "carbon steel"]},
#   ...
# }
```

### 1-2. MATERIAL_TO_SECTION 116개도 추출

```python
# step2-1-section-candidate.ts에서 MATERIAL_TO_SECTION 전체 추출
# material 키워드 → Section 번호 매핑 전체
```

### 1-3. 프롬프트용 material 목록 생성

79그룹을 21 Section별로 정리하여 LLM 프롬프트에 넣을 텍스트 생성:

```
Section I (동물): fish, shrimp, seafood, meat, poultry, dairy, ...
Section II (식물): coffee, tea, rice, wheat, plant, vegetable, ...
Section III (유지): fat, oil, wax, tallow, lard, ...
Section IV (가공식품): sugar, chocolate, beverage, tobacco, ...
Section V (광물): mineral, cement, salt, sand, coal, petroleum, ...
Section VI (화학): chemical, pharmaceutical, soap, perfume, ...
Section VII (플라스틱/고무): plastic, rubber, silicone, foam, resin, PVC, ...
Section VIII (가죽): leather, fur, skin, hide, ...
Section IX (목재): wood, bamboo, cork, timber, ...
Section X (종이): paper, cardboard, pulp, ...
Section XI (섬유): cotton, polyester, silk, wool, nylon, linen, fabric, ...
Section XII (신발): footwear, shoe, hat, ...
Section XIII (유리/세라믹): glass, ceramic, porcelain, stone, marble, ...
Section XIV (보석): gold, silver, platinum, pearl, diamond, jewelry, ...
Section XV (비금속): steel, iron, aluminum, copper, zinc, brass, alloy, ...
Section XVI (기계): machinery, motor, engine, electric, electronic, ...
Section XVII (차량): vehicle, bicycle, aircraft, ship, ...
Section XVIII (정밀기기): optical, watch, clock, camera, medical, ...
Section XIX (무기): weapon, ammunition, firearm, ...
Section XX (잡화): furniture, toy, game, mattress, brush, ...
Section XXI (예술): painting, sculpture, antique, artwork, ...
```

---

## Phase 2: LLM 프롬프트 v2 — MATERIAL 강제 매핑

### 시스템 프롬프트 (핵심 — 이 프롬프트를 그대로 사용):

```
너는 HS Code 관세 분류 전문가야. 상품 데이터에서 9개 필드를 추출해야 해.

## ⚠️ 대소문자 규칙: 모든 매핑은 대소문자를 구분하지 않는다
상품 데이터에 "Alloy", "ALLOY", "alloy" 어떤 형태로 들어와도 동일하게 취급해라.
목록에서 키워드를 찾을 때도 대소문자 무시하고 매칭해라.
출력할 때는 소문자로 통일해라.

## ⚠️ 가장 중요한 규칙: material 필드

material은 반드시 아래 21개 Section 목록에서 골라야 해. 이 목록에 없는 값은 material이 아니야.
상품의 소재가 "Alloy"면 → 이 목록에서 가장 가까운 값을 골라: "alloy" = Section XV (비금속).
상품의 소재가 "Mixed Material"이면 → 주요 소재를 판단해서 목록에서 골라.
상품의 소재를 모르겠으면 → product_name과 category에서 추론해서 목록에서 골라.

### material 허용 값 목록 (21 Section):
{여기에 Phase 1에서 추출한 79그룹 전체 목록 삽입}

material 필드에는 반드시 위 목록에 있는 단어를 넣어야 해. 목록에 없는 단어(예: "high-quality", "new", "retro")는 절대 material에 넣지 마.

## 9개 필드 정의:

1. product_name: 상품의 핵심 이름만. 수식어/형용사 제외.
   "pendant necklace" ✅ / "gorgeous exquisite pendant necklace" ❌

2. material: 위 21 Section 목록에서만 선택. 가장 구체적인 값 사용.
   "stainless steel" ✅ (Section XV) / "Alloy" ❌ → "alloy" 또는 "brass" 등으로 구체화
   "Soy Wax" → "wax" ✅ (Section III)
   "Foam" → "foam" ✅ (Section VII, plastic 계열)
   "Resin" → "resin" ✅ (Section VII)

3. origin_country: ISO 2자리. "Mainland China" → "CN"

4. category: 상품 카테고리. AliExpress/Amazon 카테고리 그대로 사용 가능.
   "Jewelry & Accessories > Pendants" ✅

5. description: 상품 특징/기능. product_name과 material에 안 들어간 것.
   "waterproof", "insulated", "vintage", "handmade" 등

6. processing: 가공 방식.
   "knitted", "woven", "roasted", "forged", "plated", "molded" 등

7. composition: 소재 구성비.
   "95% cotton 5% elastane", "18K gold plated brass", "100% polyester"

8. weight_spec: 무게/크기/규격.
   "200g", "27.9cm", "12oz"

9. price: USD 가격 (숫자만). CNY면 /7.2로 변환.

## 매핑 규칙:

1. 상품의 모든 정보(product_name, attributes, category)에서 키워드를 추출하여 가장 적합한 필드에 배치
2. 하나의 필드에 여러 정보가 섞여있으면 분리하여 각각 맞는 필드에 배치
   예: product_name이 "18K Gold Plated Brass Dragon Pendant Necklace"면
   → product_name: "pendant necklace"
   → material: "brass" (Section XV)
   → composition: "18K gold plated brass"
   → description: "dragon"
3. material은 반드시 21 Section 목록에서 선택. 이것이 가장 중요한 규칙
4. 확실하지 않은 필드는 빈 문자열로 남기기

## 출력: JSON만 (설명 없이)
```

---

## Phase 3: 632건 LLM 매핑 실행

### 3-1. 키워드 추출 (코드, LLM 불필요)

```python
def extract_all_info(item):
    """상품의 모든 필드를 하나의 텍스트로 합침"""
    parts = []
    parts.append(f"product_name: {item.get('product_name', '')}")

    attrs = parse_json(item.get('product_attributes', '{}'))
    for k, v in attrs.items():
        parts.append(f"{k}: {v}")

    for i in range(1, 6):
        cat = item.get(f'cate_lv{i}_desc', '')
        if cat:
            parts.append(f"category_lv{i}: {cat}")

    if item.get('price'):
        parts.append(f"price: {item['price']} {item.get('currency_code', '')}")

    return '\n'.join(parts)
```

### 3-2. LLM 호출 (GPT-4o-mini)

```python
def llm_map_v2(product_info: str) -> dict:
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_V2},  # Phase 2의 프롬프트
            {"role": "user", "content": f"아래 상품을 9-field로 매핑:\n\n{product_info}"}
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

### 3-3. 632건 실행 + 저장

---

## Phase 4: 매핑된 material 검증

### 4-1. LLM이 뱉은 material이 MATERIAL_KEYWORDS 79그룹 안에 있는지 전수 확인

```python
# MATERIAL_KEYWORDS에 있는 모든 키워드 set
valid_materials = set()  # 79그룹의 모든 키워드

for item in mapped_results:
    mat = item.get('material', '').lower()
    if mat and mat not in valid_materials:
        print(f'INVALID: {mat} — 79그룹에 없음')
```

### 4-2. INVALID material → 가장 가까운 유효 material로 교정

LLM이 여전히 목록 밖 값을 뱉으면, 코드로 강제 교정:
```python
# fuzzy matching으로 가장 가까운 MATERIAL_KEYWORDS 키워드 찾기
from difflib import get_close_matches
corrected = get_close_matches(mat, valid_materials, n=1, cutoff=0.6)
```

---

## Phase 5: Layer 1 벤치마크

### 5-1. 4가지 시나리오

```
A: product_name만 (비교 기준 — 이전 1~4%)
B: 이전 단순 매핑 (비교 — 이전 8%)
C: LLM v1 매핑 (이전 결과 — 8%)
D: LLM v2 매핑 (이번 — material 강제) ← 핵심
```

### 5-2. 정확도 산출

```
ground truth: verified_hs6, verified_hs_full
각 시나리오별: Section / Chapter / Heading / HS6
```

### 5-3. material별 정확도 분석

```
LLM v2에서 material이 유효한 건 vs 여전히 무효인 건
→ 유효 material 건의 Section 정확도 = Ablation 결과처럼 높아야 함
→ 무효 material 건의 Section 정확도 = material 없는 것과 같을 것
```

---

## Phase 6: 오류 분석

틀린 건을 분류:
```
LLM_MATERIAL_STILL_INVALID — LLM이 여전히 79그룹 밖 값 출력
LLM_MATERIAL_WRONG_SECTION — 유효하지만 잘못된 Section 매핑
HEADING_KEYWORD_GAP — material/Section 맞는데 Heading 키워드 부족
HS6_SUBHEADING_GAP — Heading 맞는데 Subheading 키워드 부족
```

---

## 결과물

### 엑셀: `POTAL_Layer2_V2_Constrained.xlsx`

**Sheet 1: 4시나리오 비교**
| 시나리오 | Section | Chapter | Heading | HS6 | 비용 |

**Sheet 2: material 유효성**
- 632건 중 유효 material X건, 무효 X건
- 유효 건의 Section 정확도 vs 무효 건

**Sheet 3: 오류 분석**

**Sheet 4: 전 건 상세**

시트 마감: `=== 작업 종료 === | 시나리오D HS6 X% (이전C 8%) | 유효 material X% | 비용 $X`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 절대 수정 금지**
2. **MATERIAL_KEYWORDS 79그룹 전체를 프롬프트에 포함** — 줄이지 않는다
3. **LLM 출력의 material이 79그룹에 없으면 코드로 강제 교정**
4. **4가지 시나리오 전부 실행**
5. **ground truth 대조 필수**
6. **엑셀에 전부 기록**

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
