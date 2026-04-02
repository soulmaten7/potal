# Claude Code 명령어: Layer 2 — LLM 키워드→9-field 순차 매핑 + HSCodeComp 632건 벤치마크

> **날짜**: 2026-03-21 KST
> **목표**: 상품 정보의 모든 필드를 키워드로 쪼갠 후, LLM이 순차적으로 9-field에 매핑. 겹치면 LLM이 선택. 매핑된 9-field를 Layer 1에 넣어서 정확도 측정.
> **핵심**: 셀러들이 하나의 필드에 여러 정보를 몰아넣는 패턴이 많음. 키워드로 쪼개서 올바른 9-field 위치에 재배치하는 것이 Layer 2의 역할.
> **원칙**: Layer 1 코드 절대 수정 금지. Layer 2는 전처리 레이어 — Layer 1 앞에서 9-field를 만들어주는 역할만.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.

---

## Phase 1: 키워드 추출 (코드, LLM 불필요)

모든 상품 데이터의 모든 필드를 키워드로 쪼갠다.

### 1-1. HSCodeComp 632건 로드 + 모든 필드에서 키워드 추출

```python
def extract_all_keywords(item):
    """상품의 모든 필드에서 키워드를 소스별로 추출"""
    result = {}

    # 1. product_name → 단어 분리
    name = item.get('product_name', '')
    result['product_name'] = split_keywords(name)

    # 2. product_attributes → JSON 파싱 후 key-value 모두 키워드화
    attrs = parse_json(item.get('product_attributes', '{}'))
    for attr_key, attr_val in attrs.items():
        result[f'attr_{attr_key}'] = split_keywords(str(attr_val))

    # 3. category 5단계 → 각 레벨 키워드
    for i in range(1, 6):
        cat = item.get(f'cate_lv{i}_desc', '')
        if cat:
            result[f'category_lv{i}'] = split_keywords(cat)

    # 4. price
    if item.get('price'):
        result['price'] = [str(item['price'])]
        result['currency'] = [item.get('currency_code', '')]

    return result

def split_keywords(text):
    """텍스트를 키워드 리스트로 분리"""
    if not text:
        return []
    # 소문자화, 특수문자 제거, 단어 분리
    import re
    words = re.findall(r'[a-zA-Z0-9]+', text.lower())
    return [w for w in words if len(w) >= 2]
```

### 1-2. 추출 결과 예시

```
상품: "European and American New Retro High-quality Gorgeous Exquisite Versatile Dynamic Green Cute Dragon Pendant Necklace"
product_attributes: {"Origin":"Mainland China", "Material":"Alloy", "Gender":"Unisex"}
category: Jewelry & Accessories > Fashion Jewelry > Pendants

키워드 추출 결과:
{
  "product_name": ["european", "american", "new", "retro", "high", "quality", "gorgeous", "exquisite", "versatile", "dynamic", "green", "cute", "dragon", "pendant", "necklace"],
  "attr_Origin": ["mainland", "china"],
  "attr_Material": ["alloy"],
  "attr_Gender": ["unisex"],
  "category_lv1": ["jewelry", "accessories"],
  "category_lv2": ["fashion", "jewelry"],
  "category_lv3": ["pendants"],
  "price": ["141.0"],
  "currency": ["CNY"]
}
```

---

## Phase 2: LLM 순차 매핑 (핵심)

### 2-1. LLM 프롬프트 설계

**프롬프트가 가장 중요. 아래 프롬프트를 디테일하게 작성하여 사용.**

```
시스템 프롬프트:

너는 국제 관세 분류 전문가야. 상품의 키워드 목록을 받아서 HS Code 분류에 필요한 9개 필드에 정확히 매핑해야 해.

## 9개 필드 정의 (반드시 이 기준으로 매핑):

1. product_name: 상품의 핵심 이름. "무엇인가"를 나타내는 단어만. 브랜드명, 수식어, 형용사 제외.
   예: "pendant necklace", "t-shirt", "water bottle", "coffee beans"

2. material: 상품의 주요 소재. HS Code Section을 결정하는 핵심.
   21개 HS Section 기준:
   - 동물성: meat, fish, shrimp, dairy, leather, fur, silk, wool
   - 식물성: cotton, wood, bamboo, cork, coffee, tea, rice, wheat
   - 유지: oil, fat, wax, tallow, lard
   - 광물: mineral, cement, salt, sand, coal, petroleum
   - 화학: chemical, pharmaceutical, soap, perfume, fertilizer
   - 플라스틱/고무: plastic, rubber, silicone, foam, resin, PVC
   - 금속: steel, iron, aluminum, copper, zinc, brass, alloy, gold, silver
   - 섬유: polyester, nylon, linen, synthetic, fabric
   - 유리/세라믹: glass, ceramic, porcelain, stone, marble
   예: "alloy", "cotton", "stainless steel", "ceramic"

3. origin_country: 원산지 국가. ISO 2자리 코드로.
   예: "CN" (China), "US", "KR", "JP"

4. category: 상품 카테고리. 가장 구체적인 카테고리 사용.
   예: "jewelry > pendants", "clothing > t-shirts", "kitchen > mugs"

5. description: 상품의 기능, 용도, 특징. product_name과 material에 안 들어간 설명적 키워드.
   예: "waterproof", "insulated", "handmade", "vintage", "portable"

6. processing: 가공 방식.
   예: "knitted", "woven", "roasted", "forged", "molded", "plated"

7. composition: 소재 구성비.
   예: "95% cotton 5% elastane", "18K gold plated brass"

8. weight_spec: 무게, 크기, 규격.
   예: "200g", "27.9cm", "12oz", "5x3x1 inch"

9. price: 가격 (USD).
   예: "19.58"

## 매핑 규칙:

1. 각 키워드 소스를 순서대로 처리: product_name → attr_Material → attr_Origin → category → attr_기타 → price
2. 각 키워드를 가장 적합한 field에 배치
3. 이미 채워진 field에 새 키워드가 더 적합하면 교체하고 기존 키워드는 다른 field로 이동
4. 어떤 field에도 안 맞는 키워드는 description에 넣기 (수식어, 형용사 등)
5. field에 넣을 때는 키워드를 자연스러운 값으로 조합 (단어 나열이 아닌 의미 있는 값)
6. material은 반드시 위 21개 Section 기준의 소재 단어여야 함. "high-quality", "new" 같은 형용사는 material이 아님.
7. product_name은 상품 자체를 나타내는 명사만. "pendant necklace"는 OK, "gorgeous exquisite pendant necklace"는 X.

## 출력 형식 (JSON만):
{
  "product_name": "값",
  "material": "값",
  "origin_country": "값",
  "category": "값",
  "description": "값",
  "processing": "값",
  "composition": "값",
  "weight_spec": "값",
  "price": 숫자 또는 null
}
```

### 2-2. LLM 호출

```python
# GPT-4o-mini 사용 (비용 최소화)
import openai

def llm_map_to_9field(keywords_by_source: dict) -> dict:
    prompt = f"""아래 상품의 키워드를 9개 필드에 매핑해줘.

키워드 (소스별):
{json.dumps(keywords_by_source, ensure_ascii=False, indent=2)}

JSON으로만 응답:"""

    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},  # 위의 시스템 프롬프트
            {"role": "user", "content": prompt}
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

### 2-3. 632건 전부 매핑

```python
results = []
for i, item in enumerate(data):
    keywords = extract_all_keywords(item)
    mapped = llm_map_to_9field(keywords)
    mapped['verified_hs6'] = str(item['hs_code']).zfill(10)[:6]
    mapped['verified_hs_full'] = str(item['hs_code']).zfill(10)
    results.append(mapped)
    if (i+1) % 50 == 0:
        print(f'{i+1}/632 완료')
    time.sleep(0.5)  # rate limit

# 저장
json.dump(results, open('hscodecomp_layer2_mapped.json', 'w'), ensure_ascii=False, indent=2)
```

**예상 비용**: 632건 × ~200 토큰 = ~126K 토큰 → GPT-4o-mini: ~$0.02

---

## Phase 3: 매핑 결과 검증

### 3-1. 매핑 전/후 필드 채워진 비율 비교

```
이전 (단순 매핑):
  material 64%, category 100%, price 91%

Layer 2 (LLM 매핑) 후:
  material X%, category X%, price X%, description X%, processing X%
```

### 3-2. 매핑 품질 샘플 확인

랜덤 20건의 LLM 매핑 결과를 출력하여 9-field가 합리적인지 확인.

---

## Phase 4: Layer 1 벤치마크

### 4-1. 3가지 시나리오 재실행

```
A: product_name만 (비교 기준 — 이전 4%)
B: 이전 단순 매핑 (비교 — 이전 8%)
C: Layer 2 LLM 매핑 (이번 테스트)
```

모든 시나리오에서 destination_country = 'US' (ground truth가 US HTS 10자리).

### 4-2. 정확도 산출

```
각 시나리오별: Section / Chapter / Heading / HS6 / HS10 정확도
ground truth: verified_hs6, verified_hs_full
```

---

## Phase 5: 오류 분석 + Layer 2 설계 방향 도출

### 5-1. 시나리오 C에서 틀린 건 분석

```
오류 유형:
  LLM_WRONG_MATERIAL — LLM이 material을 잘못 매핑 (예: 형용사를 material로)
  LLM_WRONG_CATEGORY — LLM이 category를 잘못 매핑
  LLM_MISSED_FIELD — LLM이 채울 수 있었는데 빈칸으로 남김
  PIPELINE_KEYWORD_GAP — 매핑은 맞는데 Layer 1 키워드 사전에 없음
  PIPELINE_HEADING_GAP — HS6까지 맞는데 Heading에서 틀림
```

### 5-2. 프롬프트 개선점 도출

LLM 매핑 오류에서 프롬프트를 어떻게 개선해야 하는지 구체적 사례 수집.

---

## 결과물

### 엑셀: `POTAL_Layer2_LLM_Remap.xlsx`

**Sheet 1: 벤치마크 결과 비교**
| 시나리오 | Section | Chapter | Heading | HS6 | 비용 |
|---------|---------|---------|---------|-----|------|
| A: name only | X% | X% | X% | X% | $0 |
| B: 단순 매핑 | X% | X% | X% | X% | $0 |
| C: LLM 매핑 | X% | X% | X% | X% | ~$0.02 |

**Sheet 2: LLM 매핑 품질**
- 필드별 채워진 비율 (전/후)
- 20건 샘플 검토 결과

**Sheet 3: 오류 분석**
- 오류 유형별 건수
- 프롬프트 개선 포인트

**Sheet 4: 전 건 상세 (632건)**

시트 마감: `=== 작업 종료 === | 시나리오C HS6 X% (이전B 8%) | LLM 비용 $X | 오류 유형 X종`

---

## ⚠️ 절대 규칙

1. **Layer 1 코드 절대 수정 금지** — classifyV3 그대로 사용
2. **프롬프트를 디테일하게 작성** — 위 시스템 프롬프트 그대로 사용. 줄이지 않는다
3. **LLM 호출은 GPT-4o-mini** — 비용 최소화
4. **3가지 시나리오 전부 실행** — A/B/C 비교 필수
5. **ground truth 대조 필수** — verified_hs6, verified_hs_full
6. **오류 분석 필수** — 틀린 건의 원인 분류
7. **엑셀에 전부 기록**

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
export OPENAI_API_KEY='...'  # GPT-4o-mini 호출용
```
