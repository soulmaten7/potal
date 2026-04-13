# DEV.to Blog Posts — 2026-W16
> 생성일: 2026-04-12 (sunday-content-prep 자동 생성)
> 형식: front matter 포함 / published: false (수동 발행) / 한글 번역 포함

---

## Day 1 (Mon 04-13) — API Tutorial

```markdown
---
title: "POTAL API in 3 Minutes: HS Classification + Landed Cost in One Call"
published: false
tags: [api, tradeCompliance, javascript, tutorial]
canonical_url: https://potal.app/blog/api-tutorial-hs-classification
cover_image: 09_api-docs.png
---
```

You're building a checkout flow. A customer in Germany selects a $150 Korean-made battery pack. You need the HS code, the import duty rate, and the total landed cost — before they hit "Pay."

Here's the POTAL API call that does it.

### REST API

```bash
curl -X POST https://potal.app/api/calculate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Lithium-ion Battery Pack",
    "material": "lithium",
    "productCategory": "electronics",
    "origin": "KR",
    "destinationCountry": "DE",
    "price": 150
  }'
```

Response:

```json
{
  "hsCode": "8507.60",
  "hsDescription": "Lithium-ion accumulators",
  "importDuty": 0,
  "importDutyRate": "0% (de minimis exempt)",
  "vat": 28.50,
  "vatRate": "19.0%",
  "insurance": 2.25,
  "totalLandedCost": 180.75,
  "currency": "USD",
  "complianceNotes": ["HAZMAT: Lithium Batteries — IATA DGR Section II applies"]
}
```

One endpoint. HS classification + duty calculation + tax + insurance in a single response.

### MCP Server (for AI agents)

If you're using Claude, GPT-4, or another LLM agent, install the MCP server:

```bash
npm install -g potal-mcp-server
```

Then configure your agent to use these tools:

- `classify_product` — returns HS code + confidence score
- `calculate_landed_cost` — returns full cost breakdown
- `check_restrictions` — returns HAZMAT/sanction/regulatory flags
- `lookup_fta` — returns applicable free trade agreements
- `screen_denied_party` — checks entity against 8 sanction lists

Your agent can now query real tariff data at runtime. Not cached lookups. Not static tables. Live data from 874,000+ tariff rows across 240 countries.

### Use case: multi-country pricing

```javascript
const countries = ['US', 'DE', 'JP', 'GB', 'AU'];

const costs = await Promise.all(
  countries.map(dest =>
    potal.calculateLandedCost({
      productName: 'Lithium-ion Battery Pack',
      material: 'lithium',
      productCategory: 'electronics',
      origin: 'KR',
      destinationCountry: dest,
      price: 150
    })
  )
);

// Returns real landed cost for each country
// Each with duty rate, VAT, insurance, FTA status
```

Five countries. Five calls (or one batched call). Complete pricing matrix.

### API key

Get one at potal.app/dashboard. Free. No credit card. No rate limit (20 req/sec sustained). Usage dashboard shows daily call volume.

Forever Free. $0/month.

---

### DEV.to 한글 번역

**제목**: POTAL API 3분 가이드: HS 분류 + Landed Cost를 한 번에

독일 고객이 $150짜리 한국산 배터리팩을 선택합니다. 결제 전에 HS Code, 수입관세율, 총 착지가격이 필요합니다.

이걸 처리하는 POTAL API 호출 하나를 소개합니다.

(코드 블록은 영문 그대로 사용 — 개발자 대상)

하나의 엔드포인트. HS 분류 + 관세 계산 + 세금 + 보험이 단일 응답으로.

AI 에이전트(Claude, GPT-4 등) 사용 시 MCP 서버 설치:

```bash
npm install -g potal-mcp-server
```

에이전트에 classify_product, calculate_landed_cost, check_restrictions 도구를 노출하면 실시간 관세 데이터를 직접 조회할 수 있습니다.

240개국, 874,000개 이상 관세 행. 영구 무료. potal.app/dashboard에서 API 키 발급.

---

## Day 2 (Tue 04-14) — Case Study

```markdown
---
title: "Li-ion Battery Pack, Korea to Germany: Real Landed Cost Breakdown — $180.75"
published: false
tags: [customs, logistics, tradeData, ecommerce]
canonical_url: https://potal.app/blog/liion-kr-de-landed-cost
cover_image: 04_result.png
---
```

HS 8507.60. That's the code for lithium-ion accumulators.

Ship one from South Korea to Germany and here's what the numbers look like — calculated live via POTAL API:

| Line item | Amount |
|-----------|--------|
| Product price | $150.00 |
| Import duty | $0.00 |
| German VAT (19%) | $28.50 |
| Insurance (1.5% CIF) | $2.25 |
| **Total landed cost** | **$180.75** |

### Why $0 import duty?

The product value ($150) falls below the EU's current de minimis threshold (~$160 USD equivalent). Packages under this value are currently exempt from import duties — though not from VAT.

**This changes on July 1, 2026.** The EU is eliminating the de minimis threshold. After that date, this exact shipment will incur import duties. If you're planning KR→EU logistics past that date, budget accordingly.

### Why does HAZMAT matter here?

HS 8507.60 triggers IATA DGR (Dangerous Goods Regulations) Section II requirements for lithium-ion batteries. This means:

- Air freight requires specific packaging and labeling
- Watt-hour rating must be stated on the outer package
- Some airlines prohibit li-ion batteries in cargo holds above certain Wh thresholds
- The HS code on your commercial invoice needs to match the DGR declaration

POTAL returns compliance notes alongside cost data. You get the full picture in one call.

### The calculation

```bash
curl -X POST https://potal.app/api/calculate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "productName": "Lithium-ion Battery Pack",
    "material": "lithium",
    "productCategory": "electronics",
    "origin": "KR",
    "destinationCountry": "DE",
    "price": 150
  }'
```

240 countries supported. Forever Free at potal.app.

---

### DEV.to 한글 번역

**제목**: 리튬이온 배터리팩, 한국→독일: 실제 착지가격 분해 — $180.75

HS 8507.60. 리튬이온 축전지 코드입니다.

POTAL API로 실시간 계산한 한국→독일 비용 내역:

| 항목 | 금액 |
|------|------|
| 제품 가격 | $150.00 |
| 수입관세 | $0.00 (de minimis 면제) |
| 독일 부가세 (19%) | $28.50 |
| 보험 (CIF의 1.5%) | $2.25 |
| **총 착지가격** | **$180.75** |

관세 $0인 이유: 현재 EU de minimis 기준($160 USD 상당) 이하. 하지만 2026년 7월 1일 기준 폐지 예정.

HAZMAT 중요한 이유: HS 8507.60은 IATA DGR Section II 적용. 항공화물 시 특정 포장·라벨 요구사항 발생.

POTAL은 비용 데이터와 함께 컴플라이언스 노트를 반환합니다. 한 번의 호출로 전체 그림이 나옵니다.

240개국 지원. potal.app에서 영구 무료.

---

## Day 3 (Wed 04-15) — Industry News

```markdown
---
title: "EU De Minimis Ends July 1, 2026: What Changes in Your Logistics Stack"
published: false
tags: [ecommerce, customs, eu, regulations]
canonical_url: https://potal.app/blog/eu-de-minimis-2026
cover_image: rec_14_scenario-cosmetics-eu.mov
---
```

On July 1, 2026, the European Union removes the €150 customs exemption for packages from outside the EU.

This is 77 days away as of today (April 15, 2026).

### What the current rule is

Packages valued under €150 entering the EU are currently exempt from import duties (not VAT — VAT always applied via IOSS). This threshold was designed for low-value goods, but it effectively created a massive subsidy for high-volume direct-to-consumer shippers, particularly from China and Southeast Asia.

### What changes July 1

The €150 threshold is eliminated. Instead:

- All packages from outside the EU require customs processing
- Packages under €150 pay a **€3 flat-rate customs duty**
- Full VAT continues to apply (country-specific rates: DE 19%, FR 20%, NL 21%, etc.)
- Carriers must file customs data for every parcel, not just those over €150

### Cost impact example (KR→DE, cosmetics)

Before July 1 (current):
```
Moisturizing Cream, 50ml, $35.00
HS: 3304.99
Import duty: $0.00 (de minimis exempt)
DE VAT (19%): $6.65
Total landed cost: ~$42.18
```

After July 1 (projected):
```
Moisturizing Cream, 50ml, $35.00
HS: 3304.99
Import duty: ~$2.70 (€3 flat-rate converted)
DE VAT (19%): $6.65 (on duty-inclusive value)
Processing fee: varies by carrier
Total landed cost: ~$45+ depending on carrier fees
```

### What you need to do now

1. Calculate current vs. July 1 costs for your EU product mix
2. Identify which SKUs are under €150 — those see the biggest change
3. Update checkout pricing to reflect post-July 1 costs
4. Ensure your HS codes are accurate — flat-rate duty applies to the wrong code just as easily as the right one

POTAL supports all EU member states. You can run DE, FR, NL, IT, ES scenarios now. The post-July-1 rates can be calculated by running the calculation with import duty included.

Forever Free. potal.app.

---

### DEV.to 한글 번역

**제목**: EU De Minimis 2026년 7월 1일 종료: 물류 스택에서 바뀌는 것들

2026년 7월 1일, EU가 역외 패키지의 €150 관세 면제를 폐지합니다.

오늘(2026년 4월 15일) 기준으로 77일 남았습니다.

현재 규정: €150 미만 패키지는 수입관세 면제 (부가세는 항상 적용).

7월 1일 변경 사항:
- 모든 역외 패키지 통관 처리 필수
- €150 미만 패키지: €3 고정 관세
- 부가세 계속 적용
- 모든 소포에 통관 데이터 제출 의무

비용 영향 예시 (KR→DE, 화장품):
- 현재: $35 크림 → 총 ~$42.18
- 7월 1일 이후: $35 크림 → 총 ~$45+ (€3 관세 + 처리비)

POTAL은 EU 전 회원국 지원. 지금 바로 DE, FR, NL 시나리오 계산 가능. potal.app에서 영구 무료.

---

## Day 4 (Thu 04-16) — Comparison

```markdown
---
title: "HS Code Accuracy by Field Count: The Ablation Data from 23,300 Tests"
published: false
tags: [machinelearning, customs, api, classification]
canonical_url: https://potal.app/blog/hs-accuracy-ablation
cover_image: rec_05_accuracy-meter.mov
---
```

We ran 23,300 classification tests across 50 products. Each test used a different combination of the 10 input fields. Here's what the accuracy curve looks like.

### The data

| Fields used | Accuracy | Fields filled |
|-------------|----------|---------------|
| Product Name only | ~18% | 1/10 |
| + Material | ~63% | 2/10 |
| + Category | ~96% | 3/10 |
| + Description | ~100% | 4/10 |
| All 10 fields | ~100% | 10/10 |

466 combinations × 50 products = 23,300 tests. These are absolute values, not relative improvements.

### Why Material has the biggest impact (+45 points)

The HS Schedule is organized by physical substance at the Chapter level. Chapter 52 is cotton. Chapter 72 is iron and steel. Chapter 39 is plastics. Chapter 44 is wood.

When you don't provide material, the classifier has to infer it from the product name — and product names are inconsistent. "T-shirt" could be cotton, polyester, or a blend. "Bag" could be leather (Chapter 42), canvas (Chapter 63), or plastic (Chapter 39).

Material maps directly to 21 HS sections covering 187 material variants. Without it, the classifier has a 55% accuracy penalty on Section and Chapter selection.

### Why Category adds 33 more points

Category resolves the function-vs-material ambiguity that material alone can't fix.

Example: "Leather bag" with Material=leather narrows to Chapter 42 or 63. Category=accessories pushes it definitively to 42.xx. Category=clothing pushes to 61/62.

The HS system uses "essential character" rules from Section Notes to decide between competing chapters. Category is the field that maps most directly to those rules.

### Why Description adds only 4 more points

At this point you're already at 96% with 3 fields. Description extends the keyword pool for edge cases: "casual wear" triggers clothing chapter notes, "waterproof" triggers specific subheading rules, "organic" matters for food classifications.

The last 4% is real — it matters for the 10-digit subheading where duty rates can differ by 5-10 percentage points. But the big accuracy gains happen in the first three fields.

### Practical implication

If you're classifying products programmatically, the field priority is:
1. Material (biggest impact, required)
2. Category (second biggest, required)
3. Description (fills edge cases, optional)
4. All other fields (subheading precision, optional)

POTAL accepts all 10 fields and shows you the classification confidence score in real time. You can watch the accuracy bar move as you fill fields.

Try it at potal.app. Forever Free, $0/month.

---

### DEV.to 한글 번역

**제목**: 필드 수별 HS Code 정확도: 23,300회 Ablation 테스트 데이터

23,300회 분류 테스트 결과:

| 사용 필드 | 정확도 |
|----------|--------|
| Product Name만 | ~18% |
| + Material | ~63% |
| + Category | ~96% |
| + Description | ~100% |

Material이 가장 큰 영향을 주는 이유: HS Schedule 자체가 물리적 소재를 기준으로 챕터가 구성되어 있기 때문. Material 없이는 분류기가 챕터 수준에서 추측을 해야 함 → 정확도 -55%.

Category가 두 번째인 이유: 기능 vs 소재 모호성을 해결. "Leather bag" → accessories vs clothing 구분이 챕터 42 vs 챕터 63을 결정.

실용적 우선순위: Material → Category → Description → 나머지 필드 순으로 채우세요.

POTAL에서 실시간 정확도 바로 확인 가능. potal.app 영구 무료.

---

## Day 5 (Fri 04-17) — Behind the Scenes

```markdown
---
title: "CW33 Build Log: Replacing 154,264 Rows of Fake Data with Real Trade Data"
published: false
tags: [buildinpublic, database, supabase, solofounder]
canonical_url: https://potal.app/blog/cw33-build-log
cover_image: 10_dashboard.png
---
```

Two months ago, I found 65 hardcoded entries in POTAL's codebase.

Fixed HS code overrides. Static sanction lists. Hardcoded FTA eligibility rules. Numbers that were correct when I wrote them, but were never going to update themselves.

The product worked. But it was working on fake data dressed as real data.

CW33 was the sprint series that changed that.

### What "No Fake, All Real" meant in practice

The decision was simple to state: every hardcoded value that represents real-world trade data gets replaced with a database row.

The execution took six sprints.

**Sprint 1 — Foundation** (3,260 rows seeded)
- Migrated `062_cw33_foundation.sql`
- FTA agreements: 12 → 65 (added UK-KR, KCFTA)
- FTA members: 109 → 559
- FTA product rules: 2,209 rules seeded (USMCA, RCEP, CPTPP, EU-UK-TCA, KORUS)
- HS classification overrides: 6 rows replacing CW32's regex-based `deterministicOverride()` function

**Sprint 2 — US/EU Tax Tables** (937 rows)
- US state sales tax rates by ZIP code
- EU country VAT rates (all 27 member states)
- Replaced hardcoded rate arrays in the tax calculation engine

**Sprint 3 — Classifier, HS, Brand Data** (77,709 rows)
- Product-to-HS mapping table extended
- Brand recognition database populated
- `mergeWithHardcoded()` function deleted from `fta-db.ts`

**Sprint 4 — Sanctions** (47,926 entities)
- OFAC SDN 123MB XML parsed and loaded
- `sanctioned_entities` table populated
- 5 call sites converted from in-memory arrays to async DB queries

**Sprint 5 — Currency, Anti-dumping** (24,484 rows)
- Live exchange rates connected
- AD/CVD (anti-dumping and countervailing duty) table populated

**Sprint 6 — Scaffold, Verify, Ship** (71 rows)
- P1 feature scaffolding
- verify-cw32: 28/28 green (pre-migration baseline held)
- verify-cw33: 23/23 green (all new functionality passing)

### Why this matters beyond accuracy

Hardcoded data fails silently. A rate that was correct in 2024 is wrong today and the system has no way to know. A static sanction list doesn't get the OFAC updates from last Tuesday. A hardcoded FTA table misses the new KCFTA accession.

When data lives in a database with source timestamps, you can know when it was last updated. You can diff it against the source. You can run a sync and see what changed.

The 154,264-row database isn't a bigger version of the same thing. It's a fundamentally different kind of data infrastructure.

POTAL now runs on real trade data. That's the only version worth building.

potal.app — Forever Free, $0/month.

---

### DEV.to 한글 번역

**제목**: CW33 빌드 로그: 가짜 데이터 154,264행을 실무역 데이터로 교체한 과정

두 달 전, 코드베이스에서 65개 하드코딩 항목을 발견했습니다. 고정된 HS 오버라이드. 정적 제재 리스트. 하드코딩된 FTA 규칙들.

작동은 했습니다. 하지만 실데이터인 척하는 가짜 데이터 위에서 돌아가고 있었습니다.

CW33은 이를 바꾼 6개 스프린트 시리즈입니다.

6개 스프린트 요약:
- S1: 기반 구축 — FTA 65개, 2,209개 규칙 (3,260행)
- S2: 세율표 — 937행
- S3: 분류기·HS·브랜드 — 77,709행
- S4: 제재 목록 — OFAC SDN 47,926개 단체
- S5: 환율·반덤핑 — 24,484행
- S6: 검증 완료 — 28/28 + 23/23 green

총계: 154,264행. 23개 테이블. 검증 완료.

하드코딩 데이터는 조용히 실패합니다. 2024년에 맞았던 세율이 오늘은 틀렸어도 시스템이 알 방법이 없습니다. DB에 소스 타임스탬프와 함께 저장된 데이터는 언제 업데이트됐는지 알 수 있습니다.

POTAL은 이제 실무역 데이터 위에서 돌아갑니다. potal.app 영구 무료.

---

## Day 6 (Sat 04-18) — Community/Tips

```markdown
---
title: "Quick Win: The One Field That Improves HS Code Accuracy by 45 Points"
published: false
tags: [customs, hscode, tutorial, quicktip]
canonical_url: https://potal.app/blog/material-field-accuracy
cover_image: 02_demo-empty.png
---
```

Five-minute read. One actionable change.

If you're classifying products for customs — using POTAL, another API, or a manual process — here's the single most impactful thing you can do to improve accuracy.

**Fill in the material field.**

Not the description. Not the weight. Not the price. The material.

Here's why, with data:

### The accuracy breakdown

| What you provide | HS accuracy |
|-----------------|-------------|
| Product name only | ~18% |
| + Material | ~63% |
| + Category | ~96% |
| + Description | ~100% |

Source: 23,300 ablation tests across 50 product types.

### The structural reason

The HS Schedule — the international system that all customs codes are based on — is organized by physical substance at its top level.

Section XI: Textile and textile articles (cotton, wool, silk, synthetics)
Section XIII: Stone, plaster, ceramics, glass
Section XIV: Precious metals, pearls
Section XV: Base metals (iron, steel, copper, aluminum)

The material is not a detail. It's the primary organizing principle.

When you type "T-shirt" into a classification system without providing material, the system has to guess between:
- 6109.10 (cotton)
- 6109.20 (man-made fibers)
- 6109.90 (other)

Those three codes have different duty rates. The right one depends entirely on the material.

### How to use this right now

On POTAL (potal.app):
1. Open the demo form
2. Type your product name
3. Select the material from the dropdown (cotton, leather, steel, rubber, plastic, etc.)
4. Watch the accuracy bar jump from ~18% to ~63%
5. Add category → 96%
6. Add description → ~100%

The accuracy bar is real-time. You see the score update as you fill fields.

No account required to try it. potal.app — Forever Free, $0/month.

---

### DEV.to 한글 번역

**제목**: 5분 팁: HS Code 정확도를 45포인트 올리는 필드 하나

HS Code를 분류할 때 가장 큰 차이를 만드는 한 가지: Material(소재) 필드를 채우세요.

데이터:
- Product Name만: ~18%
- + Material: ~63% (+45포인트)
- + Category: ~96%
- + Description: ~100%

이유: HS Schedule 자체가 물리적 소재를 기준으로 구성. Material은 세부 정보가 아니라 기본 조직 원칙입니다.

"T-shirt"만 입력 시: 6109.10(면), 6109.20(합성섬유), 6109.90(기타) 중 추측 필요. "cotton" 소재 추가 시: 즉시 정확한 챕터로.

POTAL에서 바로 확인: potal.app 데모 폼에서 Material 선택 → 정확도 바가 즉시 오르는 것을 확인하세요. 영구 무료.
