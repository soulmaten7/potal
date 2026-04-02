# Claude Code 명령어: Layer 2 v6 — product_name(문장 이해) + 상품정보(키워드) + WCO 원본(문장 그대로) → category/material 추출 테스트

> **날짜**: 2026-03-22 KST
> **목표**: LLM에게 코드화된 키워드 목록이 아니라, WCO 원본 텍스트(문장 그대로)를 주고 product_name을 읽고 이해해서 category(WCO Chapter)와 material을 판단하게 한다. 632건 전체 테스트.
> **핵심 차이**:
>   - v2~v5: 코드화된 키워드 목록에서 "골라라" → LLM을 선택기로 사용
>   - v6: product_name은 원문 그대로 LLM이 이해 + 상품정보는 키워드화 + WCO 원본 텍스트를 읽고 이해한 후 WCO 텍스트 안의 키워드와 상품정보 키워드를 매칭
> **Layer 1 코드 절대 수정 금지**

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## Phase 0: 데이터 준비

### 0-1. WCO 97 Chapter 원본 텍스트

`app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts`에서 97개 **원문 그대로** 추출.
코드화/키워드화 하지 않는다. 문장 그대로.

```
Ch.1: Animals; live
Ch.2: Meat and edible meat offal
...
Ch.67: Feathers and down, prepared; and articles made of feather or of down; artificial flowers; articles of human hair
...
Ch.71: Natural, cultured pearls; precious, semi-precious stones; precious metals, metals clad with precious metal, and articles thereof; imitation jewellery; coin
...
Ch.85: Electrical machinery and equipment and parts thereof; sound recorders and reproducers; television image and sound recorders and reproducers, parts and accessories of such articles
...
Ch.97: Works of art; collectors' pieces and antiques
```

### 0-2. WCO 21 Section 원본 텍스트 (material 판단용)

Section Notes 원본에서 21개 Section 설명 추출. 코드화하지 않고 문장 그대로.

```
Section I: Live animals; animal products (Ch.1-5)
Section II: Vegetable products (Ch.6-14)
...
Section XIV: Natural or cultured pearls, precious or semi-precious stones, precious metals... (Ch.71)
Section XV: Base metals and articles of base metal (Ch.72-83)
...
Section XXI: Works of art, collectors' pieces and antiques (Ch.97)
```

### 0-3. HSCodeComp 632건 로드

각 상품에서 모든 정보 추출:
- product_name (전체 원문)
- product_attributes (JSON 파싱 → 키-값 전부)
- cate_lv1 ~ cate_lv5
- price, currency_code
- verified_hs_full → 앞 2자리 = 정답 Chapter

---

## Phase 1: 상품정보 키워드화 (코드로)

```python
def prepare_product_info(item):
    """상품의 모든 정보를 키워드로 정리 (product_name 제외 — 이건 원문 그대로 줌)"""
    keywords = {}

    # attributes에서 키워드 추출
    attrs = parse_json(item.get('product_attributes', '{}'))
    if attrs:
        keywords['attributes'] = attrs  # Material, Origin, Gender 등

    # category 5단계
    cats = []
    for i in range(1, 6):
        cat = item.get(f'cate_lv{i}_desc', '')
        if cat:
            cats.append(cat)
    if cats:
        keywords['seller_category'] = ' > '.join(cats)

    # price
    if item.get('price'):
        keywords['price'] = f"{item['price']} {item.get('currency_code', '')}"

    return keywords
```

---

## Phase 2: LLM 프롬프트 (v6)

### 시스템 프롬프트:

```
너는 국제 관세 분류 전문가다.

아래에 WCO(세계관세기구)가 정한 상품 분류 체계가 있다.
이것은 국제법으로 정해진 규칙이다. 모든 국가가 이 기준을 따른다.

## WCO 97 Chapter (상품 분류 규칙)
{97개 Chapter 원본 텍스트 전체 — 코드화 없이 문장 그대로}

## WCO 21 Section (소재 분류 규칙)
{21개 Section 원본 텍스트 전체 — 코드화 없이 문장 그대로}

---

너의 역할:

Step 1: 상품명(product_name) 원문을 읽고 이 상품이 무엇인지 이해해라.

Step 2: 상품 정보(키워드)를 확인해라 — Material, Origin, Category 등.

Step 3: 위 WCO 97 Chapter 텍스트를 읽고 이해해라. 각 Chapter가 어떤 상품을 다루는지 파악해라.
  그 다음, 상품 정보의 키워드가 WCO Chapter 텍스트의 어떤 키워드와 매칭되는지 찾아라.
  예: 상품 키워드 "Hair Extensions" ↔ Ch.67 "articles of human hair" → 매칭
  예: 상품 키워드 "Carbon Brush" + "Electrical" ↔ Ch.85 "Electrical machinery and equipment" → 매칭
  매칭되는 Chapter 번호를 category로 선택해라.

Step 4: 위 WCO 21 Section 텍스트를 읽고 이해해라. 각 Section이 어떤 소재를 다루는지 파악해라.
  그 다음, 상품 정보의 키워드가 WCO Section 텍스트의 어떤 키워드와 매칭되는지 찾아라.
  예: 상품 키워드 "Alloy" ↔ Section XV "Base metals and articles of base metal" → 매칭
  매칭되는 material을 선택해라.

⚠️ 셀러가 등록한 카테고리(seller_category)는 판매 목적으로 정한 것이라 WCO 기준과 다를 수 있다.
   seller_category는 참고만 하고, WCO 텍스트의 키워드 매칭을 기준으로 판단해라.

출력: JSON만 (설명 없이)
{
  "product_name": "핵심 상품명만 (수식어 제외)",
  "category": "Ch.XX",
  "material": "주요 소재 (소문자)"
}
```

### 유저 프롬프트 (각 건마다):

```
상품명: {product_name 원문 전체}

상품 정보:
{키워드화된 attributes, seller_category, price 등}
```

---

## Phase 3: 632건 전체 실행

```python
for item in all_632:
    product_info = prepare_product_info(item)
    result = llm_map_v6(item['product_name'], product_info)
    # result: { product_name, category: "Ch.XX", material: "xxx" }
```

- GPT-4o-mini, temperature=0
- 632건 전체
- 결과 JSON 저장

---

## Phase 4: 정답 대조

### 4-1. category 정확도
LLM이 답한 "Ch.XX" vs verified_hs_full 앞 2자리 → Chapter 일치율

### 4-2. material 유효성
LLM이 답한 material이 MATERIAL_KEYWORDS 79그룹 안에 있는지 확인

### 4-3. Layer 1 벤치마크
LLM v6 출력(product_name + category + material)을 Layer 1 pipeline에 넣고:
- Section / Chapter / Heading / HS6 정확도

### 4-4. 이전 결과와 비교

```
| 시나리오 | Section | Chapter | Heading | HS6 | category 방식 |
|---------|---------|---------|---------|-----|-------------|
| B (simple map) | 56% | 43% | 19% | 8% | 원본 그대로 |
| D (LLM v2) | 57% | 46% | 19% | 8% | 자유 ← 현재 최적 |
| F (LLM v4) | 52% | 37% | 12% | 6% | POTAL 128개 키워드에서 선택 |
| G (LLM v5) | 56% | 42% | 14% | 6% | WCO 97개 키워드에서 선택 |
| H (LLM v6) | ?% | ?% | ?% | ?% | WCO 원본 텍스트 읽고 이해 |
```

---

## Phase 5: 오답 분석

v6에서 틀린 건:
- category(Chapter) 틀린 건수 + 패턴
- material 틀린 건수 + 패턴
- 이전 v5(54% 정답)와 비교: v6에서 새로 맞힌 건 vs 새로 틀린 건

특히 이전에 실패한 2건 확인:
- #3 Enamel Pin: v6에서 Ch.71 맞혔나? (WCO 원문 "articles of human hair... imitation jewellery" 읽고 이해했나?)
- #4 Carbon Brush: v6에서 Ch.85 맞혔나? (WCO 원문 "Electrical machinery and equipment" 읽고 이해했나?)

---

## Phase 6: 결과물

### 엑셀: `POTAL_Layer2_V6_RawText.xlsx`

**Sheet 1: Dashboard**
```
| 시나리오 | Section | Chapter | Heading | HS6 |
| v2 (현재 최적) | 57% | 46% | 19% | 8% |
| v6 (이번) | ?% | ?% | ?% | ?% |

Category 정확도: X/632 (X%) — 이전 v5: 343/632 (54%)
Material 유효성: X/632 (X%)
```

**Sheet 2: 632건 전체 상세**
```
| # | product_name | seller_category | attributes | v6 category | v6 material | 정답 Ch | Ch 일치 | HS6 일치 |
```

**Sheet 3: 오답 분석**

**Sheet 4: v6 vs v2 vs v5 비교**

시트 마감: `=== 작업 종료 === v6 Chapter X% (v5=54%, v2=46%) | HS6 X% (v2=8%) | material valid X%`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 수정 금지**
2. **WCO 원본 텍스트를 코드화/키워드화 하지 않는다** — 문장 그대로 프롬프트에 넣는다
3. **product_name도 원문 그대로** — 코드화 하지 않는다
4. **셀러 category는 "참고"로만 제공** — WCO 규칙이 기준
5. **material은 출력 후 MATERIAL_KEYWORDS 79그룹 유효성 확인** — 유효하지 않으면 fuzzy 교정
6. **632건 전체 실행**
7. **엑셀 로깅 필수** (절대 규칙 11번)
8. **벤치마크 하락 시 Ablation 대조** (절대 규칙 12번)

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
