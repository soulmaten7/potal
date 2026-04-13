# LinkedIn Posts — 2026-W16
> 생성일: 2026-04-12 (sunday-content-prep 자동 생성)
> 형식: 영문 포스트 + 한글 번역 / 해시태그 5개 / 첫 댓글용 링크: potal.app

---

## Day 1 (Mon 04-13) — API Tutorial

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

If you're using Claude or another AI agent, POTAL has an MCP server too:

```
npm install -g potal-mcp-server
```

Then expose classify_product and calculate_landed_cost to your agent. Your AI can now look up real tariff data at runtime — not cached guesses.

240 countries. 874,000+ tariff rows. Updated continuously.

Forever Free. $0/month.

Try it at potal.app. First comment has the link.

#CrossBorderCommerce #API #TradeCompliance #DeveloperTools #HSCode

### 한글 번역

코드 세 줄이면 됩니다. 어떤 제품이든, 어느 나라든 HS Code 분류와 총 착지가격을 한 번에 받을 수 있습니다.

POTAL API 호출 예시:

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

응답: HS 8507.60. 수입관세 $0. 부가세 $28.50. 총 착지가격 $180.75.

한 번의 호출로 전체 그림이 나옵니다.

Claude 등 AI 에이전트를 사용 중이라면 POTAL MCP 서버도 있습니다:

```
npm install -g potal-mcp-server
```

classify_product와 calculate_landed_cost를 에이전트에 노출하면, AI가 실시간 관세 데이터를 직접 조회할 수 있습니다. 캐시된 추측값이 아닌 실데이터로.

240개국. 874,000개 이상 관세 행. 지속 업데이트.

영구 무료. 월 $0.

potal.app에서 바로 써보세요. 첫 번째 댓글에 링크 있습니다.

---

## Day 2 (Tue 04-14) — Case Study

We shipped a $150 lithium-ion battery pack from South Korea to Germany.

POTAL calculated the real cost: $180.75.

Here's every line of the breakdown:

Product price: $150.00
Import duty: $0.00 — de minimis exempt (package value ≤ $160 USD equivalent)
German VAT (19%): $28.50
Insurance (1.5% CIF): $2.25
Shipping: not included in this calculation

Total landed cost: $180.75

A few things worth noting:

First, the duty exemption won't last. The EU is eliminating its de minimis threshold on July 1, 2026. After that, every package — including this one — gets processed through customs. That $0 duty line disappears.

Second, lithium-ion batteries carry HAZMAT classification requirements under IATA DGR. The HS code matters for compliance, not just cost. HS 8507.60 triggers specific documentation requirements for air freight.

Third, the VAT applies regardless of duty status. De minimis means duty-free, not tax-free.

For anyone doing KR→EU logistics planning: these numbers are live in POTAL. 240 countries, forever free.

potal.app

#Logistics #CrossBorderEcommerce #ImportDuty #LithiumBattery #TradeCompliance

### 한글 번역

리튬이온 배터리팩 하나를 한국에서 독일로 보냈습니다.

POTAL이 계산한 실제 비용: $180.75.

비용 분해 전체를 공개합니다:

제품 가격: $150.00
수입관세: $0.00 — de minimis 면제 ($160 이하)
독일 부가세 (19%): $28.50
보험 (CIF의 1.5%): $2.25
운송비: 이 계산에 미포함

총 착지가격: $180.75

몇 가지 주의사항:

첫째, 관세 면제는 오래가지 않습니다. EU는 2026년 7월 1일부터 de minimis 기준을 폐지합니다. 그 이후에는 이 배터리팩도 통관 처리됩니다. $0 관세 줄이 사라집니다.

둘째, 리튬이온 배터리는 IATA DGR 기준 위험물로 분류됩니다. HS 코드는 비용뿐만 아니라 컴플라이언스에도 중요합니다. HS 8507.60은 항공화물 시 특정 서류를 요구합니다.

셋째, 부가세는 관세 면제 여부와 무관하게 적용됩니다. De minimis는 관세 면제이지, 세금 면제가 아닙니다.

한국→EU 물류를 계획 중이라면: 이 수치들은 POTAL에서 실시간으로 확인할 수 있습니다. 240개국, 영구 무료.

potal.app

---

## Day 3 (Wed 04-15) — Industry News

In 77 days, the EU eliminates its €150 de minimis threshold.

Right now: packages valued under €150 entering the EU skip customs duties. That's why Chinese and Korean sellers have been shipping direct-to-consumer at scale across Europe.

July 1, 2026: that ends.

Every package from outside the EU — regardless of value — will require customs processing. The EU is introducing a €3 flat-rate customs duty for packages under €150, plus full VAT obligations.

What this means operationally:

Customs processing time increases for every shipment. Per-package costs go up (€3 duty + VAT). Carriers need to file customs data for every parcel. Sellers need accurate HS codes to determine the correct rate.

POTAL already supports all EU member states: DE, FR, NL, IT, ES, PL, and 27 more. You can calculate the July 1 cost right now. Run any KR→DE or CN→FR scenario on potal.app.

The €150 threshold is gone. The €3 duty is not optional. Build it into your pricing now.

Forever Free. $0/month.

#EURegulations #CrossBorderEcommerce #Customs #DeMinimisTax #GlobalTrade

### 한글 번역

77일 후, EU가 €150 de minimis 기준을 폐지합니다.

지금: €150 미만 패키지는 EU 입국 시 관세를 면제받습니다. 중국·한국 셀러들이 직배송 방식으로 유럽 소비자에게 대규모 판매를 해온 이유입니다.

2026년 7월 1일: 그 시대가 끝납니다.

금액에 관계없이 EU 외부에서 들어오는 모든 패키지가 통관 처리를 받아야 합니다. €150 미만 패키지에는 €3 고정 관세가 도입되고, 부가세 의무도 전면 적용됩니다.

운영상 의미:

모든 발송건의 통관 처리 시간 증가. 패키지당 비용 상승 (€3 관세 + 부가세). 화물사가 모든 소포에 통관 데이터 제출 필요. 셀러가 정확한 HS Code 확보 필요.

POTAL은 이미 DE, FR, NL, IT, ES, PL 등 EU 전체 회원국을 지원합니다. 지금 바로 7월 1일 이후 비용을 계산할 수 있습니다. potal.app에서 KR→DE 또는 CN→FR 시나리오를 실행해 보세요.

€150 기준은 사라집니다. €3 관세는 선택이 아닙니다. 지금 가격 책정에 반영하세요.

영구 무료. 월 $0.

---

## Day 4 (Thu 04-16) — Comparison

One product. Two inputs. 18% accuracy.

Add one field. 63%.
Add another. 96%.
One more. ~100%.

This isn't theory. This is what 23,300 ablation test combinations across 50 products actually showed.

Here's the accuracy breakdown:

Product Name only: ~18%
+ Material: ~63%
+ Category: ~96%
+ Description: ~100%

The jump from Product Name to Material is 45 percentage points. Material maps directly to 21 HS chapters — cotton, steel, rubber, leather. Without it, the classifier is guessing.

Category adds 33 more points. It distinguishes function from material. "Leather bag" can be Chapter 42 (leather goods) or Chapter 63 (textile articles). Category resolves that.

Description fills in the last gap — it extends the keyword pool and matches Chapter Notes for edge cases.

Most HS classification tools accept one text field. Product name. That's the 18% baseline.

POTAL accepts 10 fields. You don't have to fill all of them. But each one you add moves the accuracy number up.

The data is what it is.

potal.app — Forever Free, $0/month.

#HSCode #TradeCompliance #Classification #CrossBorderEcommerce #Customs

### 한글 번역

제품 하나. 입력 두 개. 정확도 18%.

필드 하나 추가. 63%.
하나 더. 96%.
하나 더. ~100%.

이론이 아닙니다. 50개 제품 × 466가지 조합 = 23,300회 ablation 테스트 실측 결과입니다.

정확도 분해:

Product Name만: ~18%
+ Material: ~63%
+ Category: ~96%
+ Description: ~100%

Product Name에서 Material 추가 시 45포인트 점프. Material은 HS 21개 챕터에 직접 매핑됩니다 — 면, 철강, 고무, 가죽. 없으면 분류기가 추측을 합니다.

Category는 33포인트를 더합니다. 기능 vs 소재를 구분합니다. "Leather bag"은 챕터 42(가죽제품)일 수도, 챕터 63(섬유류)일 수도 있습니다. Category가 이를 해결합니다.

Description은 나머지 공백을 채웁니다 — 키워드 풀을 확장하고 엣지 케이스의 챕터 주석을 매칭합니다.

대부분의 HS 분류 도구는 텍스트 필드 하나를 받습니다. 제품명. 그게 18% 기준선입니다.

POTAL은 10개 필드를 받습니다. 전부 채울 필요는 없습니다. 하지만 하나씩 추가할 때마다 정확도가 올라갑니다.

데이터는 있는 그대로입니다.

---

## Day 5 (Fri 04-17) — Behind the Scenes

Sprint 1: Replace hardcoded FTA data with real database entries.
Sprint 2: Load US and EU tax tables — 937 rows.
Sprint 3: Classifier, HS codes, brand data — 77,709 rows.
Sprint 4: Sanctions — 47,926 entities from OFAC SDN.
Sprint 5: Currency and anti-dumping data — 24,484 rows.
Sprint 6: Scaffold. Verify. Ship.

Total: 154,264 rows. 23 tables. 6 sprints. One developer.

The decision that started this: I found 65 hardcoded entries in the codebase that were supposed to be real trade data. Fixed HS overrides. Static sanction lists. Hardcoded FTA rules.

None of it was wrong, exactly. But none of it was real either.

"No Fake, All Real" became the working principle for CW33. Every hardcoded value got a database row. Every static list got replaced with a synced source. The classifier got connected to actual Supabase tables instead of in-memory arrays.

It took a week of focused sprints and broke nothing in production (28/28 verify-cw32 green before the migration, 23/23 verify-cw33 green after).

The result: POTAL now runs on 154,264 real data points. When you calculate a landed cost, the tariff rate comes from a row in the database, not a number someone typed into a source file.

That's the only kind of data worth building on.

potal.app — Forever Free, $0/month.

#BuildingInPublic #Bootstrapped #TradeData #SoloFounder #CrossBorderEcommerce

### 한글 번역

스프린트 1: 하드코딩된 FTA 데이터를 실제 DB 항목으로 교체.
스프린트 2: 미국·EU 세율표 로드 — 937행.
스프린트 3: 분류기, HS코드, 브랜드 데이터 — 77,709행.
스프린트 4: 제재 목록 — OFAC SDN에서 47,926개 단체.
스프린트 5: 환율 및 반덤핑 데이터 — 24,484행.
스프린트 6: 스캐폴드. 검증. 배포.

총계: 154,264행. 23개 테이블. 6개 스프린트. 개발자 1명.

출발점: 코드베이스에서 실무역 데이터로 써야 할 65개 하드코딩 항목을 발견했습니다. 고정된 HS 오버라이드. 정적 제재 리스트. 하드코딩된 FTA 규칙들.

틀렸다고 할 수는 없었습니다. 하지만 진짜도 아니었습니다.

"No Fake, All Real"이 CW33의 작업 원칙이 되었습니다. 하드코딩된 값마다 DB 행이 생겼습니다. 정적 리스트마다 동기화 소스로 교체됐습니다. 분류기가 인메모리 배열 대신 실제 Supabase 테이블에 연결됐습니다.

집중 스프린트 일주일이 걸렸고, 프로덕션에서 아무것도 깨지지 않았습니다 (마이그레이션 전 verify-cw32 28/28 green, 이후 verify-cw33 23/23 green).

결과: POTAL은 이제 154,264개 실데이터 위에서 돌아갑니다. 착지가격을 계산할 때 관세율은 소스 파일에 누군가가 타이핑한 숫자가 아닌, 데이터베이스 행에서 옵니다.

그게 제대로 된 데이터입니다.

---

## Day 6 (Sat 04-18) — Community/Tips

The single field that improves HS code accuracy by 45 percentage points.

It's not the product description.
It's not the price.
It's not the weight.

It's the material.

Here's what the data shows across 23,300 classification tests:

Product Name only → 18% accuracy
Add Material → 63% (+45 points)
Add Category → 96% (+33 more points)
Add Description → ~100% (+4 more points)

Why material? Because HS code structure is built around physical substance. Chapter 50 is silk. Chapter 51 is wool. Chapter 52 is cotton. The first thing the tariff schedule needs to know is: what is this thing made of?

When you submit "T-shirt" without a material, the classifier has to guess between cotton (6109.10), polyester (6109.90), and blends. With "cotton" as the material, it goes straight to the right chapter.

Practical tip: If you're using POTAL or any HS classification tool, fill in the material field before anything else. You'll see the accuracy jump immediately.

Second tip: After material, add the category. "Apparel" vs "accessories" is the difference between Chapter 61 and Chapter 42 for a bag.

Those two fields alone get you to 96%.

potal.app — Forever Free, $0/month. Try it and see the accuracy bar move.

#HSCode #CustomsTips #TradeCompliance #CrossBorderEcommerce #ImportExport

### 한글 번역

HS Code 정확도를 45포인트 올리는 필드 하나.

제품 설명이 아닙니다.
가격이 아닙니다.
무게도 아닙니다.

Material(소재)입니다.

23,300회 분류 테스트 데이터가 보여주는 것:

Product Name만 → 정확도 18%
Material 추가 → 63% (+45포인트)
Category 추가 → 96% (+33포인트)
Description 추가 → ~100% (+4포인트)

왜 Material인가? HS Code 구조 자체가 물리적 소재를 중심으로 구성되어 있기 때문입니다. 50챕터는 실크. 51챕터는 양모. 52챕터는 면. 관세표가 가장 먼저 알아야 하는 건 "이게 뭘로 만들어졌는가"입니다.

"T-shirt"만 제출하면 분류기는 면(6109.10), 폴리에스터(6109.90), 혼방 중에서 추측을 해야 합니다. "cotton" 소재가 있으면 바로 올바른 챕터로 이동합니다.

실용 팁: POTAL이나 다른 HS 분류 도구를 사용할 때, 가장 먼저 Material 필드를 채우세요. 정확도가 즉시 오르는 걸 볼 수 있습니다.

두 번째 팁: Material 다음에 Category를 추가하세요. 가방의 경우 "Apparel"인지 "accessories"인지가 챕터 61과 챕터 42의 차이입니다.

이 두 필드만으로도 96%에 도달합니다.

potal.app — 영구 무료. $0/월. 직접 써보고 정확도 바가 올라가는 것을 확인하세요.
