# 2026-W16 주간 콘텐츠 세트 (2026-04-13 ~ 04-18)
> 생성일: 2026-04-12 (sunday-content-prep 자동 생성)
> 카테고리 순환: W15 마지막 Cat.1 → W16 Cat.2부터 시작

## 주간 요약
| 날짜 | 요일 | 카테고리 | 토픽 |
|------|------|---------|------|
| 04-13 | 월 | 2 — API Tutorial | POTAL API 3분 가이드 |
| 04-14 | 화 | 3 — Case Study | Li-ion KR→DE 실비용 $180.75 |
| 04-15 | 수 | 4 — Industry News | EU De Minimis D-77 |
| 04-16 | 목 | 5 — Comparison | HS 정확도: 18% vs 100% |
| 04-17 | 금 | 6 — Behind the Scenes | 154,264행 빌드 로그 CW33 |
| 04-18 | 토 | 7 — Community/Tips | Material 필드 +45포인트 팁 |

---

# Day 1: 월요일 — 2026-04-13
## Topic: POTAL API in 3 Minutes: HS Classification + Landed Cost in One Call
## Category: 2 — API Tutorial / Code Walkthrough

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_12_api-docs.mov | 영상 | 메인 첨부 영상. 개발자 페이지 스크롤 + 코드 블록 Copy 버튼 클릭하는 15초 클립 |
| 2 | 09_api-docs.png | 이미지 | 영상 없으면 대체 스크린샷. /developers 페이지 상단 |

### DEV.to
| 순서 | 에셋 파일명 | 유형 | 삽입 위치 |
|------|-----------|------|----------|
| 1 | 09_api-docs.png | 이미지 | cover_image (front matter에 파일명 입력) |
| 2 | rec_22_dashboard-10field.mov | 영상 (간접 관련) | 본문 "Dashboard에서 직접 분류" 섹션 근처 (선택) |

### Medium
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 09_api-docs.png | 히어로 이미지 | 에세이 상단 |

### 에셋 참고사항
- rec_12_api-docs.mov: LinkedIn 메인 영상으로 우선 사용
- rec_22_dashboard-10field.mov: 간접 관련 — 대시보드에서 HS 분류 맥락

---

## LinkedIn
Three lines of code. That's all it takes to get a fully classified HS code and landed cost for any product, to any country.

Here's the POTAL API call:

```
POST https://potal.app/api/classify
{
  "productName": "Lithium-ion Battery Pack",
  "material": "lithium",
  "productCategory": "electronics",
  "origin": "KR",
  "destinationCountry": "DE",
  "price": 150
}
```

Response: HS 8507.60. Import duty: $0. VAT: $28.50. Total landed cost: $180.75.

One call. Complete picture.

If you're using Claude or another AI agent, POTAL has an MCP server:

```
npm install -g potal-mcp-server
```

240 countries. 874,000+ tariff rows. Forever Free. $0/month.

Try it at potal.app — link in first comment.

해시태그: #CrossBorderCommerce #API #TradeCompliance #DeveloperTools #HSCode
첫 댓글용 링크: potal.app

### LinkedIn 한글 번역
코드 세 줄이면 됩니다. 어떤 제품이든, 어느 나라든 HS Code 분류와 총 착지가격을 한 번에.

(API 호출 코드 블록 — 영문 그대로)

응답: HS 8507.60. 관세 $0. 부가세 $28.50. 총 착지가격 $180.75. 한 번의 호출.

Claude 등 AI 에이전트 사용 시 MCP 서버: npm install -g potal-mcp-server

240개국, 874,000+ 관세 행. 영구 무료. $0/월. potal.app에서 바로 써보세요.

---

## DEV.to
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
  "importDuty": 0,
  "vat": 28.50,
  "insurance": 2.25,
  "totalLandedCost": 180.75,
  "complianceNotes": ["HAZMAT: Lithium Batteries — IATA DGR Section II applies"]
}
```

MCP Server for AI agents:
```bash
npm install -g potal-mcp-server
```

Tools: classify_product, calculate_landed_cost, check_restrictions, lookup_fta, screen_denied_party.

Multi-country pricing:
```javascript
const countries = ['US', 'DE', 'JP', 'GB', 'AU'];
const costs = await Promise.all(
  countries.map(dest =>
    potal.calculateLandedCost({ productName: 'Lithium-ion Battery Pack', origin: 'KR', destinationCountry: dest, price: 150 })
  )
);
```

API key at potal.app/dashboard. Forever Free. $0/month.

### DEV.to 한글 번역
**제목**: POTAL API 3분 가이드: HS 분류 + Landed Cost를 한 번에

독일 고객, $150 배터리팩, 결제 전에 HS Code + 착지가격 필요.

POTAL API 한 번의 호출로: HS 8507.60, 관세 $0, 부가세 $28.50, 총 $180.75.

MCP 서버: npm install -g potal-mcp-server → classify_product + calculate_landed_cost를 AI 에이전트에 노출.

240개국. 영구 무료. potal.app/dashboard에서 API 키.

---

## Medium
**Title**: The Hidden Cost Your Checkout Doesn't Show — And the API Call That Fixes It

The hardest part of cross-border e-commerce isn't the shipping. It's the number your customer sees at customs.

They paid $150 at checkout. They expected a package. What they got was a customs bill: $28.50 VAT, $2.25 insurance, a carrier processing fee. The parcel sits at customs. The customer contacts support. The return request follows.

One API call to POTAL returns the HS code, the import duty rate, VAT, insurance, and compliance flags. For a $150 li-ion battery pack from Korea to Germany: $0 duty, $28.50 VAT, $2.25 insurance, $180.75 total. Plus a HAZMAT note for lithium batteries in air freight.

Show that number to your customer before they pay and you've eliminated the surprise.

240 countries. 874,000+ tariff rows. Updated continuously. Forever Free. $0/month.

potal.app

### Medium 한글 번역
**제목**: 체크아웃이 보여주지 않는 숨겨진 비용 — 그리고 이를 해결하는 API 호출

체크아웃에서 $150. 세관에서 청구서 $30.75. 소포 보류. 고객 응대. 반품.

POTAL API 한 번: HS Code + 관세 + 부가세 + 보험 + 컴플라이언스. 결제 전에 실제 숫자를 고객에게.

240개국. 영구 무료. potal.app

---

---

# Day 2: 화요일 — 2026-04-14
## Topic: Li-ion 배터리팩, 한국→독일 실비용: $180.75
## Category: 3 — Case Study / Use Case

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 04_result.png | 이미지 | HS 분류 결과 + Breakdown 전체 보이는 스크린샷 |
| 2 | rec_06_hs-code-result.mov | 영상 | HS Code 분류 결과 상세 클립 (15초) — 첫 번째로 올리면 자동 재생 |

### DEV.to
| 순서 | 에셋 파일명 | 유형 | 삽입 위치 |
|------|-----------|------|----------|
| 1 | 04_result.png | 이미지 | cover_image |
| 2 | 04_result.png | 이미지 | 본문 "The calculation" 코드 블록 이후 |

### Medium
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 04_result.png | 히어로 이미지 | 에세이 상단 |

### 에셋 참고사항
- rec_06_hs-code-result.mov: W15에서 미사용, 첫 사용
- 04_result.png: W15 04-08, 04-09에서 사용 — 이번 주 재사용은 다른 맥락(Li-ion KR→DE)

---

## LinkedIn
We shipped a $150 lithium-ion battery pack from South Korea to Germany.

POTAL calculated the real cost: $180.75.

Every line:

Product: $150.00
Import duty: $0.00 — de minimis exempt (≤ $160 USD)
German VAT (19%): $28.50
Insurance (1.5% CIF): $2.25

Total: $180.75

Three things to note:

1. The duty exemption ends July 1, 2026. EU removes de minimis. After that, this shipment pays import duties.

2. HS 8507.60 triggers IATA DGR HAZMAT requirements. The code matters for compliance, not just cost.

3. VAT applies regardless of duty status. De minimis = duty-free, not tax-free.

KR→EU logistics planning: calculate your post-July-1 numbers now.

potal.app — Forever Free, $0/month.

해시태그: #Logistics #CrossBorderEcommerce #ImportDuty #LithiumBattery #TradeCompliance
첫 댓글용 링크: potal.app

### LinkedIn 한글 번역
$150 리튬이온 배터리팩, 한국→독일. POTAL 실비용: $180.75.

제품 $150 / 관세 $0 (de minimis 면제) / 독일 부가세 19% = $28.50 / 보험 $2.25

총계: $180.75

주의: ① 2026-07-01 de minimis 폐지 → 관세 면제 종료. ② HS 8507.60 = IATA DGR HAZMAT 적용. ③ 부가세는 관세 무관하게 항상 적용.

potal.app — 영구 무료.

---

## DEV.to
```markdown
---
title: "Li-ion Battery Pack, Korea to Germany: Real Landed Cost Breakdown — $180.75"
published: false
tags: [customs, logistics, tradeData, ecommerce]
canonical_url: https://potal.app/blog/liion-kr-de-landed-cost
cover_image: 04_result.png
---
```

HS 8507.60. Lithium-ion accumulators.

Ship one from South Korea to Germany. Live POTAL API result:

| Line item | Amount |
|-----------|--------|
| Product price | $150.00 |
| Import duty | $0.00 (de minimis ≤ $160) |
| German VAT (19%) | $28.50 |
| Insurance (1.5% CIF) | $2.25 |
| **Total landed cost** | **$180.75** |

**EU de minimis ends July 1, 2026.** After that, this shipment pays import duties.

**HAZMAT**: HS 8507.60 triggers IATA DGR Section II. Specific packaging, labeling, Wh rating disclosure required for air freight.

**VAT applies regardless of duty status.** De minimis = duty-free, not tax-free.

```bash
curl -X POST https://potal.app/api/calculate \
  -d '{"productName":"Lithium-ion Battery Pack","material":"lithium","productCategory":"electronics","origin":"KR","destinationCountry":"DE","price":150}'
```

240 countries. Forever Free at potal.app.

### DEV.to 한글 번역
**제목**: 리튬이온 배터리팩, 한국→독일: 실제 착지가격 분해 — $180.75

POTAL API 실데이터 (라이브 호출 결과):
제품 $150 / 관세 $0 / 독일 부가세 $28.50 / 보험 $2.25 / **총 $180.75**

2026-07-01 EU de minimis 폐지 후 관세 면제 종료. HS 8507.60 HAZMAT 적용. 부가세는 항상 적용.

240개국. potal.app 영구 무료.

---

## Medium
**Title**: A Battery Pack Leaves Incheon. By the Time It Clears Frankfurt, the Price Has Changed.

A battery pack leaves a factory in Incheon. $150 per unit. By the time it clears customs at Frankfurt Airport, the price is $180.75.

That extra $30.75: $28.50 to the German government (VAT 19%), $2.25 to the insurer (1.5% of cargo value). Import duty: $0 — the package value fell just below the EU's de minimis threshold.

That rule ends July 1, 2026. Every package will incur import duties after that date.

For logistics teams planning KR→EU shipments past July 1: calculate your new landed costs now. POTAL runs this for any product, any origin, any EU destination. One API call.

$180.75 is the honest price of a $150 battery pack today. Know it before your customer finds out the hard way.

potal.app — Forever Free, $0/month.

### Medium 한글 번역
**제목**: 배터리팩이 인천을 떠납니다. 프랑크푸르트 세관을 통과할 때쯤엔 가격이 바뀌어 있습니다.

인천 공장에서 $150. 프랑크푸르트 세관 통과 후 $180.75.

추가된 $30.75: 독일 부가세 $28.50 + 보험료 $2.25. 관세 $0 (현재 de minimis 면제).

2026년 7월 1일 이후 관세 면제 종료. 7월 1일 이후 KR→EU 물류를 계획 중이라면 지금 새 착지가격을 계산하세요.

potal.app — 영구 무료.

---

---

# Day 3: 수요일 — 2026-04-15
## Topic: EU De Minimis D-77 — 2026년 7월 1일
## Category: 4 — Industry News / Regulatory Update

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_14_scenario-cosmetics-eu.mov | 영상 | 화장품 KR→DE 시나리오 영상. EU 관세 계산 흐름 시연. 메인 첨부 |
| 2 | rec_23_dashboard-country-select.mov | 영상 (간접 관련) | 240국 드롭다운으로 EU 국가 선택하는 15초 클립 — 선택적 추가 |

### DEV.to
| 순서 | 에셋 파일명 | 유형 | 삽입 위치 |
|------|-----------|------|----------|
| 1 | rec_14_scenario-cosmetics-eu.mov | 영상 스크린샷 | cover_image 대용 정적 이미지 캡처 후 사용 |
| 2 | rec_23_dashboard-country-select.mov | 영상 스크린샷 | 본문 "What you need to do now" 섹션 근처 |

### Medium
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_23_dashboard-country-select.mov | 이미지 | 히어로 이미지 (240국 드롭다운 스크린샷) |

### 에셋 참고사항
- rec_14_scenario-cosmetics-eu.mov: W15 미사용, 첫 사용
- rec_23_dashboard-country-select.mov: W15 미사용, 첫 사용

---

## LinkedIn
In 77 days, the EU eliminates its €150 de minimis threshold.

Right now: packages under €150 skip import duties. July 1, 2026: that ends.

Every package from outside the EU — regardless of value — requires customs processing. €3 flat-rate duty for packages under €150. Full VAT applies either way.

What this means:
- Per-package costs increase
- Customs processing time increases for every shipment
- Carriers must file customs data for every parcel
- Accurate HS codes become critical for duty calculation

POTAL supports all 27 EU member states: DE, FR, NL, IT, ES, PL. Run your July 1 cost now. Link in first comment.

Forever Free. $0/month.

해시태그: #EURegulations #CrossBorderEcommerce #Customs #DeMinimisTax #GlobalTrade
첫 댓글용 링크: potal.app

### LinkedIn 한글 번역
77일 후, EU €150 de minimis 폐지.

지금: €150 미만 패키지 수입관세 면제. 2026-07-01: 종료.

모든 역외 패키지 통관 의무. €150 미만에 €3 고정 관세. 부가세는 항상 적용.

변화: 패키지당 비용 증가 / 통관 시간 증가 / 모든 소포 통관 신고 필요 / 정확한 HS Code 필수.

POTAL: EU 27개국 전체 지원. 지금 7월 1일 이후 비용 계산 가능. potal.app 영구 무료.

---

## DEV.to
(전체 내용 03_devto-blogs.md Day 3 참조)

### DEV.to 한글 번역
(07_korean-translations.md Day 3 참조)

---

## Medium
(전체 내용 04_medium-essays.md Day 3 참조)

### Medium 한글 번역
(07_korean-translations.md Day 3 참조)

---

---

# Day 4: 목요일 — 2026-04-16
## Topic: HS Code 정확도: 1필드 18% vs 4필드 100%
## Category: 5 — Comparison / Competitive Analysis

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_05_accuracy-meter.mov | 영상 | 정확도 미터 변화 영상. Product Name → Material → Category 순서로 바가 올라가는 15초 클립 |
| 2 | rec_18_empty-vs-full.mov | 영상 (간접 관련) | 빈 필드 vs 풀 필드 before/after — 추가 첨부 가능 |

### DEV.to
| 순서 | 에셋 파일명 | 유형 | 삽입 위치 |
|------|-----------|------|----------|
| 1 | rec_05_accuracy-meter.mov | 영상 | cover_image (GIF 또는 정적 스크린샷) |
| 2 | rec_18_empty-vs-full.mov | 이미지 | 본문 "The data" 테이블 아래 시각 보조 |

### Medium
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_05_accuracy-meter.mov | 이미지 | 히어로 이미지 (정확도 바 최대화 스크린샷) |
| 2 | rec_18_empty-vs-full.mov | 본문 이미지 | 빨간 1/10 → 초록 10/10 비교 시각 |

### 에셋 참고사항
- rec_05_accuracy-meter.mov: W15 미사용, 첫 사용
- rec_18_empty-vs-full.mov: W15 미사용, 첫 사용

---

## LinkedIn
One product. Two inputs. 18% accuracy.
Add one field. 63%.
Add another. 96%.
One more. ~100%.

23,300 ablation tests. 50 products. 466 field combinations.

The jump from Product Name to Material: +45 points. Material maps to 21 HS chapters. Without it, the classifier guesses between cotton (6109.10), polyester (6109.90), and blends. With it, the path is direct.

Category adds 33 more. It resolves function-vs-material ambiguity that Material alone can't fix.

Most HS classification tools accept one text field. That's the 18% baseline.

POTAL accepts 10. You see the accuracy bar move in real time.

potal.app — Forever Free, $0/month.

해시태그: #HSCode #TradeCompliance #Classification #CrossBorderEcommerce #Customs
첫 댓글용 링크: potal.app

### LinkedIn 한글 번역
1필드 18%. Material 추가 → 63%. Category 추가 → 96%. Description 추가 → ~100%.

23,300회 ablation 테스트 결과. Product Name에서 Material까지 +45포인트 점프.

대부분의 HS 도구: 1필드 = 18% 기준선.
POTAL: 10필드, 실시간 정확도 바.

potal.app — 영구 무료.

---

## DEV.to
(전체 내용 03_devto-blogs.md Day 4 참조)

### DEV.to 한글 번역
(07_korean-translations.md Day 4 참조)

---

## Medium
(전체 내용 04_medium-essays.md Day 4 참조)

### Medium 한글 번역
(07_korean-translations.md Day 4 참조)

---

---

# Day 5: 금요일 — 2026-04-17
## Topic: 154,264행 실데이터 빌드 로그 (CW33)
## Category: 6 — Behind the Scenes / Building POTAL

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 10_dashboard.png | 이미지 | 대시보드 Overview 탭 — TOTAL API CALLS + Forever Free + ACTIVE KEYS |
| 2 | rec_11_dashboard.mov | 영상 (간접 관련) | 대시보드 둘러보기 15초 클립 — 추가 첨부 가능 |

### DEV.to
| 순서 | 에셋 파일명 | 유형 | 삽입 위치 |
|------|-----------|------|----------|
| 1 | 10_dashboard.png | 이미지 | cover_image |

### Medium
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 10_dashboard.png | 히어로 이미지 | 에세이 상단 |
| 2 | rec_11_dashboard.mov | 본문 이미지 | 스크린샷으로 대시보드 Usage 탭 |

### 에셋 참고사항
- 10_dashboard.png: W15 미사용, 첫 사용
- rec_11_dashboard.mov: W15 미사용, 첫 사용

---

## LinkedIn
Sprint 1: Replace hardcoded FTA data with real DB entries.
Sprint 2: US/EU tax tables — 937 rows.
Sprint 3: Classifier, HS, brand data — 77,709 rows.
Sprint 4: Sanctions — 47,926 entities (OFAC SDN).
Sprint 5: Currency, anti-dumping — 24,484 rows.
Sprint 6: Scaffold. Verify. Ship.

Total: 154,264 rows. 23 tables. 6 sprints. One developer.

Started because I found 65 hardcoded values in the codebase. Correct when I wrote them. Not updating themselves. Not real.

"No Fake, All Real."

verify-cw32: 28/28 green. verify-cw33: 23/23 green.

When you calculate a landed cost on POTAL, the tariff rate comes from a row in a database — not a number someone typed into a source file.

potal.app — Forever Free, $0/month.

해시태그: #BuildingInPublic #Bootstrapped #TradeData #SoloFounder #CrossBorderEcommerce
첫 댓글용 링크: potal.app

### LinkedIn 한글 번역
스프린트별 154,264행 적재. 23개 테이블. 6 스프린트. 개발자 1명.

코드베이스에서 65개 하드코딩 항목 발견 → "No Fake, All Real" 결정. verify-cw32 28/28 green → verify-cw33 23/23 green.

POTAL에서 착지가격 계산 시 관세율은 소스 파일의 숫자가 아닌 DB 행에서 옵니다.

potal.app — 영구 무료.

---

## DEV.to
(전체 내용 03_devto-blogs.md Day 5 참조)

### DEV.to 한글 번역
(07_korean-translations.md Day 5 참조)

---

## Medium
(전체 내용 04_medium-essays.md Day 5 참조)

### Medium 한글 번역
(07_korean-translations.md Day 5 참조)

---

---

# Day 6: 토요일 — 2026-04-18
## Topic: HS Code 정확도 +45포인트: Material 필드 팁
## Category: 7 — Community / Tips / Quick Win

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_05_accuracy-meter.mov | 영상 | 정확도 미터 변화 클립 (04-16과 다른 편집 각도 — Material 선택 순간 집중) |
| 2 | 02_demo-empty.png | 이미지 | 빈 폼 상태 — "여기서 Material 선택하면 이렇게 됩니다" 맥락 |

### DEV.to
| 순서 | 에셋 파일명 | 유형 | 삽입 위치 |
|------|-----------|------|----------|
| 1 | 02_demo-empty.png | 이미지 | cover_image (빈 폼 = "채워야 할 공간" 시각) |

### Medium
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 02_demo-empty.png | 히어로 이미지 | 에세이 상단 |
| 2 | rec_05_accuracy-meter.mov | 본문 이미지 | Material 선택 후 정확도 바 63%로 올라가는 장면 스크린샷 |

### 에셋 참고사항
- rec_05_accuracy-meter.mov: 04-16(목)에서도 사용 — 이번엔 Material 선택 순간에 집중한 다른 편집
- 02_demo-empty.png: W15 미사용, 첫 사용

---

## LinkedIn
The single field that improves HS code accuracy by 45 percentage points.

Not the description.
Not the price.
Not the weight.

It's the material.

23,300 tests. 50 products.

Product Name only: 18%
+ Material: 63% (+45 points)
+ Category: 96% (+33 more)
+ Description: ~100%

Why material? The HS Schedule is organized by physical substance. Cotton is Chapter 52. Steel is Chapter 72. Without material, the classifier guesses between chapters.

Practical: on POTAL, fill material first. Watch the accuracy bar jump from 18% to 63%. Then add category → 96%.

Two fields. 78 percentage points.

potal.app — Forever Free, $0/month.

해시태그: #HSCode #CustomsTips #TradeCompliance #CrossBorderEcommerce #ImportExport
첫 댓글용 링크: potal.app

### LinkedIn 한글 번역
HS Code 정확도를 45포인트 올리는 필드 하나.

설명 아님. 가격 아님. 무게도 아님. Material(소재)입니다.

23,300회 테스트:
Product Name만: 18%
+ Material: 63% (+45포인트)
+ Category: 96% (+33포인트)
+ Description: ~100%

이유: HS Schedule은 물리적 소재를 기준으로 구성. Material 없으면 챕터 수준에서 추측.

POTAL에서: Material 먼저 → 정확도 바 18%→63% 즉시 확인.

potal.app — 영구 무료.

---

## DEV.to
(전체 내용 03_devto-blogs.md Day 6 참조)

### DEV.to 한글 번역
(07_korean-translations.md Day 6 참조)

---

## Medium
(전체 내용 04_medium-essays.md Day 6 참조)

### Medium 한글 번역
(07_korean-translations.md Day 6 참조)
