# Claude Code 명령어: Layer 2 v5 — WCO 97 Chapter 법적 기준 category 강제 + HSCodeComp 632건 벤치마크

> **날짜**: 2026-03-22 KST
> **목표**: v4에서 POTAL 임의 128개 키워드로 category 강제 → 실패. 이번엔 WCO 97 Chapter 법적 정의(`chapter-descriptions.ts`)로 category 강제. material 성공 공식(법적 기준 강제)을 category에도 동일 적용.
> **핵심 변경**: category 강제 소스를 `CATEGORY_TO_SECTION 128개` → `CHAPTER_DESCRIPTIONS 97개 (WCO 법적 정의)`로 교체
> **원칙**:
> - material 성공 = WCO 21 Section 법적 기준 79그룹 → 프롬프트에 넣고 강제
> - category도 동일 = WCO 97 Chapter 법적 정의 → 프롬프트에 넣고 강제
> - Layer 1 코드 **절대 수정 금지**

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다. 시트명 = YYMMDDHHMM.

---

## Phase 0: Layer 1 파일에서 프롬프트용 데이터 추출

### 0-1. CHAPTER_DESCRIPTIONS 97개 추출 (WCO 법적 정의)

```
파일: app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts

97개 Chapter의 WCO 공식 법적 정의를 추출해서 프롬프트용 텍스트로 변환.

형식:
Ch.1: Animals; live
Ch.2: Meat and edible meat offal
Ch.3: Fish and crustaceans, molluscs and other aquatic invertebrates
...
Ch.71: Natural, cultured pearls; precious, semi-precious stones; precious metals...
Ch.82: Tools, implements, cutlery, spoons and forks, of base metal...
Ch.85: Electrical machinery and equipment and parts thereof...
Ch.95: Toys, games and sports requisites; parts and accessories thereof
...
Ch.97: Works of art; collectors' pieces and antiques

이것이 category의 법적 기준. POTAL 임의 키워드가 아니라 WCO가 정한 국제 법적 분류.
```

### 0-2. MATERIAL_KEYWORDS 79그룹 추출 (이전과 동일)

```
파일: app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts

79그룹, 571개 유효 material 용어, 21 Section별 정리.
이전 v2에서 검증 완료 — 그대로 사용.
```

---

## Phase 1: v5 프롬프트 설계

### 1-1. v4와의 핵심 차이

```
v4 (실패): CATEGORY_TO_SECTION 128개 (POTAL 임의 키워드) → LLM이 "jewelry" 같은 단어에서 선택
v5 (이번): CHAPTER_DESCRIPTIONS 97개 (WCO 법적 정의) → LLM이 "Ch.71: Natural, cultured pearls; precious, semi-precious stones..." 같은 법적 정의에서 선택

차이: v4는 "jewelry"라는 단어 하나 → 모호. v5는 WCO 법적 설명 전체 → 명확.
LLM이 "Dragon Pendant Necklace"를 읽고 → 97개 Chapter 설명을 보고 → "Ch.71: Natural, cultured pearls; precious, semi-precious stones; precious metals, metals clad with precious metal, and articles thereof; imitation jewellery; coin" 이게 맞다고 판단.
```

### 1-2. 시스템 프롬프트 (v5):

```
너는 이커머스 상품 데이터를 관세 분류용 9개 필드로 재배치하는 전문가야.

셀러들은 상품명에 스타일/색상/소재/유형/지역을 뒤죽박죽 몰아넣는다.
너의 역할은 이 데이터를 읽고 이해해서, 각 정보를 올바른 필드에 배치하는 것이다.

## 매핑 순서 (이 순서대로 결정해라):

### Step 1: product_name 이해
상품의 모든 정보를 읽고 "이 상품이 무엇인지" 파악해라.
"European and American New Retro High-quality Gorgeous Exquisite Versatile Dynamic Green Cute Dragon Pendant Necklace"
→ 이것은 "드래곤 모양 펜던트 목걸이"다.

### Step 2: category 선택 (⚠️ 아래 WCO 97 Chapter 목록에서)
상품이 무엇인지 이해한 후, 아래 WCO Chapter 목록에서 가장 맞는 Chapter 번호를 선택해라.
이것은 세계관세기구(WCO)가 정한 국제 법적 상품 분류 체계다.

{여기에 Phase 0에서 추출한 CHAPTER_DESCRIPTIONS 97개 전체 삽입}

category 필드에는 "Ch.XX" 형식으로 Chapter 번호를 넣어라.
예: "Ch.71" (보석/귀금속), "Ch.85" (전기기계), "Ch.95" (완구/스포츠)

### Step 3: material 선택 (⚠️ 반드시 아래 목록에서만)
product_name + category(Chapter)를 조합해서 소재를 판단해라.
상품 데이터에 material/소재 정보가 있으면 참고하되, 반드시 아래 목록에 있는 값으로만 출력해라.

예시:
- 데이터에 "Alloy" → 목록에서 "alloy" (Section XV 비금속)
- 데이터에 "Mixed Material" → 주요 소재를 판단해서 목록에서 선택
- 데이터에 소재 없음 → product_name + category에서 추론해서 목록에서 선택

{여기에 Phase 0에서 추출한 MATERIAL_KEYWORDS 79그룹 전체 목록 삽입}

⚠️ material 필드에는 위 목록에 있는 단어만 넣어라. 목록에 없는 단어는 절대 넣지 마라.

### Step 4: 나머지 필드 (자유)
- product_name: 핵심 상품명만. 수식어/형용사 제외. "pendant necklace" ✅ / "gorgeous pendant necklace" ❌. 상품 유형 핵심 키워드는 유지. "yoga mat" ✅ / "mat" ❌
- description: 상품의 기능/용도/특징. product_name과 material에 안 들어간 정보.
- processing: 가공 방식 (knitted, woven, roasted, forged, plated, molded 등)
- composition: 소재 구성비 (95% cotton 5% elastane, 100% polyester 등)
- weight_spec: 무게/크기/규격 (200g, 27.9cm, 12oz 등)
- origin_country: ISO 2자리 국가코드 (Mainland China → CN)
- price: USD 숫자만 (CNY면 /7.2로 변환)

## 대소문자: 모든 출력은 소문자로 통일 (category의 "Ch.XX"만 예외)

## 출력: JSON만 (설명 없이)
{
  "product_name": "...",
  "category": "Ch.XX",
  "material": "...",
  "description": "...",
  "processing": "...",
  "composition": "...",
  "weight_spec": "...",
  "origin_country": "...",
  "price": "..."
}
```

### 1-3. category "Ch.XX" → Layer 1 연결

LLM이 "Ch.71"을 출력하면, Layer 1에 넣을 때:
- category 필드에 Chapter 번호에 해당하는 키워드 매핑 필요
- Ch.71 → "jewelry", Ch.85 → "electronics", Ch.95 → "toys" 등
- 또는 Layer 1 pipeline에 Chapter 번호를 직접 전달하는 방식 검토
- ⚠️ Layer 1 코드 수정 금지이므로, LLM 출력을 Layer 1이 이해하는 형태로 변환하는 코드를 Layer 2에서 처리

```python
# Ch.XX → Layer 1 호환 category 변환 (Layer 2 전처리)
CHAPTER_TO_CATEGORY = {
    71: "jewelry",
    82: "tools",
    85: "electronics",
    95: "toys",
    # ... 97개 전부 매핑
    # 이 매핑은 CATEGORY_TO_SECTION 128개에서 역매핑으로 생성
}
```

---

## Phase 2: HSCodeComp 632건 실행

### 2-1. 상품정보 키워드화 (이전과 동일)

```python
def prepare_product_info(item):
    parts = []
    parts.append(f"product_name: {item.get('product_name', '')}")
    attrs = parse_json(item.get('product_attributes', '{}'))
    for k, v in attrs.items():
        parts.append(f"{k}: {v}")
    cats = []
    for i in range(1, 6):
        cat = item.get(f'cate_lv{i}_desc', '')
        if cat:
            cats.append(cat)
    if cats:
        parts.append(f"category: {' > '.join(cats)}")
    if item.get('price'):
        parts.append(f"price: {item['price']} {item.get('currency_code', '')}")
    return '\n'.join(parts)
```

### 2-2. LLM 호출 (GPT-4o-mini, v5 프롬프트)

```python
def llm_map_v5(product_info: str) -> dict:
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_V5},
            {"role": "user", "content": f"아래 상품을 9-field로 매핑:\n\n{product_info}"}
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

### 2-3. LLM 출력 → Layer 1 호환 변환

```python
def convert_chapter_to_layer1(llm_output: dict) -> dict:
    """LLM v5 출력의 Ch.XX category를 Layer 1이 이해하는 category로 변환"""
    category = llm_output.get('category', '')

    # Ch.XX 파싱
    ch_num = int(category.replace('Ch.', '').strip()) if 'Ch.' in category else None

    if ch_num and ch_num in CHAPTER_TO_CATEGORY:
        llm_output['category'] = CHAPTER_TO_CATEGORY[ch_num]

    return llm_output
```

### 2-4. 632건 전체 실행 + 저장

---

## Phase 3: 검증

### 3-1. category 유효성

```python
# LLM이 출력한 category가 Ch.1~Ch.97 범위 안인지 확인
# 유효율: X/632
# CHAPTER_DESCRIPTIONS에 실제 존재하는 Chapter 번호인지 확인
```

### 3-2. material 유효성 (이전과 동일)

```python
# MATERIAL_KEYWORDS 79그룹 안에 있는지 확인
# 유효율: X/632
```

---

## Phase 4: Layer 1 벤치마크 (6가지 시나리오)

### 4-1. 시나리오 정의

```
A: product_name만 (기준선 — ~1%)
B: 코드 단순 매핑 (이전 8%)
D: LLM v2 (material 강제, category 자유) — 이전 최고 S57%/Ch46%/H19%/HS6=8%
F: LLM v4 (POTAL 128개 category 강제) — 이전 S52%/Ch37%/H12%/HS6=6%
G: LLM v5 (WCO 97 Chapter category 강제) ← 이번 핵심
```

### 4-2. 정확도 비교

```
G (v5) vs D (v2) 비교:
- Section: X% vs 57% (±X%p)
- Chapter: X% vs 46% (±X%p)
- Heading: X% vs 19% (±X%p)
- HS6: X% vs 8% (±X%p)

G (v5) vs F (v4) 비교:
- v4(POTAL 128개) vs v5(WCO 97개) — 같은 "category 강제"인데 소스만 다름
- 이 비교가 "법적 기준 vs 임의 키워드"의 차이를 증명
```

---

## Phase 5: 오류 분석

### 5-1. 오류 분류

```
CHAPTER_INVALID — LLM이 Ch.1~97 범위 밖 출력
CHAPTER_WRONG — Chapter 유효하지만 상품과 불일치
MATERIAL_INVALID — material이 79그룹 밖
HEADING_KEYWORD_GAP — Section/Chapter 맞는데 Heading 키워드 부족
```

### 5-2. v5 vs v2 vs v4 비교 분석

```
v5가 v2보다 좋아졌으면: WCO 법적 정의가 category 강제에 효과적 → category + material 둘 다 법적 기준 강제 가능
v5가 v2와 같으면: category 강제 자체가 효과 없음 → material만 강제가 최적
v5가 v2보다 나빠졌으면: category 강제는 어떤 형태든 역효과 → material만 강제 확정
v5가 v4보다 좋아졌으면: 법적 기준 > 임의 키워드 (같은 강제라도 소스가 중요)
```

---

## Phase 6: 결과물

### 엑셀: `POTAL_Layer2_V5_Chapter97.xlsx`

**Sheet 1: Dashboard**
| 시나리오 | Section | Chapter | Heading | HS6 | 비용 |
|---------|---------|---------|---------|-----|------|
| A (name only) | 12% | 9% | 2% | 1% | $0 |
| B (simple map) | 56% | 43% | 19% | 8% | $0 |
| D (LLM v2) | 57% | 46% | 19% | 8% | ~$0.03 |
| F (LLM v4 POTAL 128) | 52% | 37% | 12% | 6% | ~$0.03 |
| **G (LLM v5 WCO 97)** | **?** | **?** | **?** | **?** | |

**Sheet 2: v5 vs v2 vs v4 상세 비교**

**Sheet 3: category 유효성 (Ch.XX 분포)**

**Sheet 4: material 유효성**

**Sheet 5: 오류 분석**

**Sheet 6: 전 건 상세**

시트 마감: `=== 작업 종료 === v5 HS6 X% (v2=8%, v4=6%) | category valid X% | material valid X% | 비용 $X`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 절대 수정 금지**
2. **CHAPTER_DESCRIPTIONS 97개 전체를 프롬프트에 포함** — WCO 법적 정의 원문 그대로
3. **MATERIAL_KEYWORDS 79그룹 전체를 프롬프트에 포함** — 이전과 동일
4. **category = WCO 97 Chapter, material = WCO 21 Section** — 둘 다 법적 기준
5. **나머지 field(description, processing, composition 등)는 자유** — v2 원칙 유지
6. **LLM 출력의 Ch.XX → Layer 1 호환 category로 변환** (Layer 2 전처리)
7. **6가지 시나리오 전부 실행 + ground truth 대조**
8. **벤치마크 정확도 하락 시 POTAL_Ablation_V2.xlsx 대조** (절대 규칙 12번)
9. **엑셀에 전부 기록** (절대 규칙 11번)

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
