# Daily Content: 2026-04-02
## Topic: EU Abolishes the €150 De Minimis Exemption in July 2026 — What Cross-Border Sellers Need to Know
## Category: 4 — Industry News + POTAL

---

## LinkedIn
**해시태그**: #CrossBorderCommerce #DeMinimis #Ecommerce #TotalLandedCost #InternationalTrade
**첫 댓글용 링크**: potal.app
**게시 시간 권장**: 화~수 오후 1~3시 GMT

In 90 days, every package entering the EU will be taxed.

The EU is abolishing its €150 de minimis exemption in July 2026. Until now, goods under €150 shipped to the EU were exempt from customs duties. That's ending.

What this means for cross-border sellers:

A $30 phone case shipped from Korea to Germany? Customs duty + VAT now applies.
A $80 pair of sneakers from the US to France? Same thing.
Every single shipment, regardless of value, will need an HS code, a duty rate, and a VAT calculation.

This follows the US abolishing its $800 de minimis threshold in August 2025. The two largest consumer markets in the world now tax every import.

For sellers without landed cost infrastructure, this is a pricing nightmare. You either absorb the cost and lose margin, or surprise customers at delivery and lose trust.

For sellers with the right tools, nothing changes. You already show the real price at checkout.

POTAL calculates Total Landed Cost across 240 countries. HS code classification, duty rates, VAT, shipping — all in one API call. 140 features. $0. Forever Free.

The regulatory walls are going up. The question is whether your checkout is ready.

potal.app

#CrossBorderCommerce #DeMinimis #Ecommerce #TotalLandedCost #InternationalTrade

### 한글 번역

90일 후, EU로 들어가는 모든 소포에 관세가 부과됩니다.

EU가 2026년 7월부터 €150 소액면세(de minimis) 제도를 폐지합니다. 지금까지는 €150 이하 물품이 EU로 배송될 때 관세가 면제됐습니다. 그게 끝납니다.

크로스보더 셀러에게 이게 뭘 의미하냐면:

한국에서 독일로 보내는 $30 폰케이스? 이제 관세 + VAT가 붙습니다.
미국에서 프랑스로 보내는 $80 운동화? 마찬가지입니다.
가격과 무관하게 모든 배송에 HS 코드, 관세율, VAT 계산이 필요합니다.

이건 2025년 8월 미국이 $800 소액면세를 폐지한 것에 이은 조치입니다. 세계 최대 소비 시장 두 곳이 이제 모든 수입품에 세금을 부과합니다.

Total Landed Cost 인프라가 없는 셀러에게 이건 가격 책정 악몽입니다. 비용을 직접 흡수해서 마진을 잃거나, 배송 시점에 추가 비용을 고객에게 떠넘겨서 신뢰를 잃거나.

제대로 된 도구를 가진 셀러에게는 달라지는 게 없습니다. 이미 결제 시점에 실제 가격을 보여주고 있으니까요.

POTAL은 240개국에 걸쳐 Total Landed Cost를 계산합니다. HS 코드 분류, 관세율, VAT, 배송비 — API 한 번 호출이면 됩니다. 140개 기능. $0. Forever Free.

규제의 벽이 올라가고 있습니다. 당신의 체크아웃이 준비되어 있는지가 문제입니다.

potal.app

---

## DEV.to
**Front matter**:
```yaml
---
title: "EU Kills the €150 De Minimis Exemption — How to Calculate Landed Cost for Every Shipment"
description: "The EU abolishes its €150 duty exemption in July 2026. Here's how to handle HS codes, duties, and VAT programmatically with a single API."
tags: api, ecommerce, webdev, saas
cover_image: https://potal.app/og-image.png
---
```

# EU Kills the €150 De Minimis Exemption — How to Calculate Landed Cost for Every Shipment

Starting July 2026, the EU will abolish its €150 de minimis exemption. Every package entering the EU, regardless of value, will be subject to customs duties and VAT.

This follows the US removing its $800 de minimis threshold in August 2025. The two largest e-commerce markets now require duty and tax calculations on every single cross-border shipment.

## What Changed

Until now, goods valued under €150 shipped to any EU member state were exempt from customs duties (though VAT applied via IOSS for items under €150). The new regulation removes this exemption entirely. Every item needs:

1. An **HS code** (Harmonized System classification)
2. A **duty rate** based on that HS code and the destination country
3. **VAT** calculated on top of (product price + shipping + duty)
4. Awareness of any **restrictions or regulations** (certain goods are prohibited or require permits)

## The Developer Problem

If you're building or maintaining an e-commerce platform that ships internationally, you now need to calculate these costs at checkout — for every order, to every EU country.

Doing this manually doesn't scale. The EU has 27 member states, each with VAT rates between 17% and 27%. Duty rates vary by HS code (there are thousands of them). And HS classification itself is non-trivial — the same "bag" can be classified differently depending on its material, intended use, and construction.

## One API Call

POTAL's API handles this in a single request. Here's what a landed cost calculation looks like:

```bash
curl -X POST https://potal.app/api/v1/calculate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Leather Handbag",
    "material": "Leather",
    "category": "Bags",
    "price": 120,
    "currency": "USD",
    "origin_country": "KR",
    "destination_country": "DE",
    "weight": 0.8,
    "shipping_method": "standard"
  }'
```

The response includes the HS code, duty rate, duty amount, VAT rate, VAT amount, shipping estimate, and total landed cost — the actual price the buyer will pay.

## Key Numbers

- **240 countries** supported
- **595 GRI rules** for HS code classification
- **7 government APIs** integrated for real-time tariff data
- **140 features** total — HS classification, denied party screening, FTA lookup, restriction checks, and more
- **$0** — Forever Free. No usage limits that matter (100K/month soft cap for DDoS protection)

## SDK Support

Available as npm and PyPI packages:

```bash
npm install potal-sdk
```

```bash
pip install potal
```

Also available as a ChatGPT Custom GPT, Claude MCP server, and Gemini Gem for AI agent workflows.

## Why This Matters Now

The window between now and July 2026 is when sellers and platforms need to integrate landed cost calculations. After that, any checkout that doesn't show the full cost will either eat the margin or create a bad delivery experience.

The regulatory direction is clear: more taxation, more compliance, fewer exemptions. Building landed cost into your stack now means you don't have to scramble when the next threshold drops.

Try it: potal.app

### 한글 번역

# EU, €150 소액면세 폐지 — 모든 배송 건에 대해 Landed Cost를 계산하는 방법

2026년 7월부터 EU가 €150 소액면세(de minimis) 제도를 폐지합니다. 가격과 관계없이 EU로 들어가는 모든 소포에 관세와 VAT가 부과됩니다.

이건 2025년 8월 미국이 $800 소액면세를 폐지한 것에 이은 조치입니다. 세계 최대 이커머스 시장 두 곳이 이제 모든 크로스보더 배송에 관세·세금 계산을 요구합니다.

## 뭐가 바뀌었나

지금까지 €150 이하 물품은 EU 회원국으로 배송 시 관세가 면제됐습니다 (IOSS를 통한 VAT는 적용). 새 규정은 이 면제를 완전히 제거합니다. 모든 상품에 필요한 것:

1. **HS 코드** (품목 분류)
2. HS 코드와 목적국에 따른 **관세율**
3. (상품 가격 + 배송비 + 관세) 위에 계산되는 **VAT**
4. **규제/제한 사항** 확인 (특정 물품은 금지되거나 허가 필요)

## 개발자가 마주하는 문제

국제 배송을 하는 이커머스 플랫폼을 만들거나 운영하고 있다면, 이제 체크아웃 시점에 이 비용을 계산해야 합니다 — 모든 주문, 모든 EU 국가에 대해.

수작업으로는 확장이 안 됩니다. EU에는 27개 회원국이 있고, 각국 VAT율은 17%~27%입니다. 관세율은 HS 코드마다 다르고 (수천 개가 있습니다), HS 분류 자체가 단순하지 않습니다 — 같은 "가방"도 소재, 용도, 구조에 따라 다르게 분류될 수 있습니다.

## API 한 번 호출

POTAL의 API는 이걸 요청 한 번으로 처리합니다. Landed cost 계산은 이렇게 생겼습니다:

```bash
curl -X POST https://potal.app/api/v1/calculate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Leather Handbag",
    "material": "Leather",
    "category": "Bags",
    "price": 120,
    "currency": "USD",
    "origin_country": "KR",
    "destination_country": "DE",
    "weight": 0.8,
    "shipping_method": "standard"
  }'
```

응답에는 HS 코드, 관세율, 관세 금액, VAT율, VAT 금액, 배송비 추정, 그리고 total landed cost — 구매자가 실제로 지불할 가격이 포함됩니다.

## 핵심 숫자

- **240개국** 지원
- HS 코드 분류를 위한 **595개 GRI 규칙**
- 실시간 관세 데이터를 위한 **7개 정부 API** 연동
- 총 **140개 기능** — HS 분류, 제재 대상 스크리닝, FTA 조회, 규제 확인 등
- **$0** — Forever Free. 의미 있는 사용 제한 없음 (DDoS 방지 목적 월 100K 소프트 캡)

## SDK 지원

npm과 PyPI 패키지로 이용 가능:

```bash
npm install potal-sdk
```

```bash
pip install potal
```

ChatGPT Custom GPT, Claude MCP 서버, Gemini Gem으로도 이용 가능합니다.

## 왜 지금 중요한가

지금부터 2026년 7월까지가 셀러와 플랫폼이 landed cost 계산을 통합해야 하는 시간입니다. 그 이후에는 전체 비용을 보여주지 않는 체크아웃은 마진을 까먹거나 나쁜 배송 경험을 만들게 됩니다.

규제 방향은 명확합니다: 더 많은 과세, 더 많은 컴플라이언스, 더 적은 면세. 지금 landed cost를 스택에 넣어두면 다음 면세 기준이 사라질 때 허둥대지 않아도 됩니다.

사용해보세요: potal.app

---

## Medium
**태그**: Cross Border Commerce, Ecommerce, International Trade, Customs, SaaS
**게시 시간 권장**: 화~수 오전 10시~오후 1시

# The €150 Loophole Is Closing — What It Means for Every Business That Ships to Europe

For years, cross-border sellers have operated under a simple assumption: if the package is cheap enough, it clears customs tax-free.

In the EU, the threshold has been €150. Ship a product worth less than that to any of the 27 member states, and customs duties don't apply. This exemption has been a quiet subsidy for low-cost cross-border sellers, particularly those shipping from Asia.

That's ending in July 2026.

The EU is abolishing its de minimis exemption entirely. Every package, every value, every shipment will be subject to customs duties and VAT. The reasoning is straightforward — the exemption was designed for a world where cross-border e-commerce barely existed. In a world where billions of low-value packages cross borders annually, it became a loophole that undercut domestic businesses and cost governments billions in lost revenue.

## The US Already Did This

In August 2025, the United States abolished its $800 de minimis threshold. The motivations were similar: a flood of low-value packages, primarily from Chinese e-commerce platforms, was entering the country duty-free. The change forced every cross-border shipment into the formal customs process.

Now the EU is following. Together, the US and EU represent the two largest consumer markets for cross-border e-commerce. For any seller operating internationally, there is no more "too small to tax."

## The Practical Impact

The change creates a new operational requirement: every product shipped to the EU needs a Harmonized System (HS) code, a duty rate calculation, and a VAT computation. This applies whether you're selling a $10 phone case or a $500 jacket.

For large enterprises with customs departments, this is manageable. For small and mid-size sellers — the majority of cross-border e-commerce — it's a significant new burden. Most don't have the expertise to classify products into HS codes, and most e-commerce platforms don't calculate duties at checkout.

The result, unless sellers adapt, will be one of two outcomes. Either the seller absorbs the unexpected duty cost and loses margin, or the buyer gets hit with a surprise charge at delivery and loses trust in the seller.

## Building Landed Cost Into the Stack

The solution is showing the full cost — product, shipping, duty, and tax — at the point of purchase. This is called Total Landed Cost, and it's what eliminates surprise charges.

POTAL provides this as infrastructure. A single API call takes a product description, origin country, and destination country, and returns the HS code, duty rate, VAT, and total landed cost. It covers 240 countries, uses 595 classification rules, and integrates with 7 government APIs for real-time tariff data.

The entire platform — 140 features — is free. Not a trial. Not a freemium tier. Free, with no time limit and no meaningful usage cap.

The logic is simple: the more sellers that integrate landed cost calculations, the more data flows through the system, and the more valuable the infrastructure becomes. POTAL is to cross-border commerce what Stripe was to payments in its early days — invisible infrastructure that makes a complex process feel simple.

## The Window

Between now and July 2026, sellers and platforms have roughly 90 days to integrate landed cost calculations into their checkout flows. After that, every EU-bound shipment without proper duty and VAT disclosure will either cost the seller money or cost them a customer.

The trend is clear. Exemptions are disappearing. Compliance requirements are increasing. The businesses that build this into their infrastructure now will have a structural advantage over those that scramble later.

potal.app

### 한글 번역

# €150 허점이 닫힌다 — 유럽에 물건을 보내는 모든 비즈니스에게 이것이 의미하는 것

수년간 크로스보더 셀러들은 단순한 가정 하에 운영해왔습니다: 소포가 충분히 저렴하면 관세 없이 통관된다.

EU에서 그 기준은 €150이었습니다. 그 이하 가치의 물품을 27개 회원국 어디로 보내든 관세가 적용되지 않았습니다. 이 면세는 저가 크로스보더 셀러들, 특히 아시아에서 배송하는 셀러들에게 조용한 보조금이었습니다.

그게 2026년 7월에 끝납니다.

EU가 소액면세(de minimis) 제도를 완전히 폐지합니다. 모든 소포, 모든 금액, 모든 배송에 관세와 VAT가 부과됩니다. 이유는 단순합니다 — 이 면세는 크로스보더 이커머스가 거의 존재하지 않던 시대에 설계되었습니다. 매년 수십억 개의 저가 소포가 국경을 넘는 세상에서, 이건 국내 기업을 약화시키고 정부에 수십억 달러의 세수 손실을 초래하는 허점이 되었습니다.

## 미국은 이미 했다

2025년 8월, 미국이 $800 소액면세 기준을 폐지했습니다. 동기는 비슷했습니다: 주로 중국 이커머스 플랫폼에서 오는 대량의 저가 소포가 면세로 입국하고 있었습니다. 이 변화로 모든 크로스보더 배송이 정식 통관 절차를 거치게 되었습니다.

이제 EU가 따라갑니다. 미국과 EU는 크로스보더 이커머스의 2대 소비 시장입니다. 국제적으로 운영하는 어떤 셀러에게든, 더 이상 "너무 작아서 세금을 안 매긴다"는 없습니다.

## 실질적 영향

이 변화는 새로운 운영 요건을 만듭니다: EU로 배송하는 모든 제품에 HS 코드, 관세율 계산, VAT 산출이 필요합니다. $10 폰케이스를 팔든 $500 재킷을 팔든 적용됩니다.

관세 부서가 있는 대기업에게는 관리 가능합니다. 하지만 크로스보더 이커머스의 대다수를 차지하는 중소 셀러에게는 상당한 새로운 부담입니다. 대부분은 HS 코드로 제품을 분류할 전문성이 없고, 대부분의 이커머스 플랫폼은 체크아웃에서 관세를 계산하지 않습니다.

셀러가 적응하지 않으면 결과는 둘 중 하나입니다. 셀러가 예상치 못한 관세 비용을 흡수해서 마진을 잃거나, 구매자가 배송 시 깜짝 추가 요금을 맞아서 셀러에 대한 신뢰를 잃거나.

## Landed Cost를 스택에 넣기

해결책은 구매 시점에 전체 비용 — 상품, 배송, 관세, 세금 — 을 보여주는 것입니다. 이걸 Total Landed Cost라고 하며, 깜짝 비용을 없애는 것입니다.

POTAL은 이것을 인프라로 제공합니다. API 한 번 호출로 상품 설명, 출발국, 도착국을 넣으면 HS 코드, 관세율, VAT, total landed cost를 돌려줍니다. 240개국을 지원하고, 595개 분류 규칙을 사용하며, 실시간 관세 데이터를 위해 7개 정부 API와 연동됩니다.

전체 플랫폼 — 140개 기능 — 이 무료입니다. 체험판이 아닙니다. 프리미엄 티어가 아닙니다. 시간 제한 없고 의미 있는 사용 제한 없는, 무료입니다.

논리는 단순합니다: 더 많은 셀러가 landed cost 계산을 통합할수록, 더 많은 데이터가 시스템을 통해 흐르고, 인프라의 가치가 높아집니다. POTAL은 크로스보더 커머스에서 Stripe가 초기에 결제에서 했던 것과 같습니다 — 복잡한 프로세스를 단순하게 느끼게 만드는 보이지 않는 인프라.

## 시간의 창

지금부터 2026년 7월까지, 셀러와 플랫폼에게는 체크아웃 플로우에 landed cost 계산을 통합할 약 90일이 있습니다. 그 이후에는 관세·VAT를 제대로 공개하지 않는 모든 EU행 배송이 셀러에게 돈을 잃게 하거나 고객을 잃게 할 것입니다.

트렌드는 명확합니다. 면세가 사라지고 있습니다. 컴플라이언스 요건이 늘고 있습니다. 지금 이것을 인프라에 구축하는 비즈니스가 나중에 허둥대는 비즈니스보다 구조적 우위를 갖게 될 것입니다.

potal.app

---

## Visual Suggestions

1. **비교 인포그래픽**: "Before vs After July 2026" — 왼쪽: €150 이하 면세, 오른쪽: 모든 금액 과세. 간결한 도식.
2. **타임라인 그래픽**: US $800 폐지 (Aug 2025) → EU €150 폐지 (Jul 2026) → "What's next?" 타임라인
3. **Landed Cost 분해 차트**: $30 폰케이스의 실제 비용 분해 (상품 $30 + 배송 $8 + 관세 $X + VAT $Y = Total $Z)
4. **LinkedIn 캐러셀 (PDF)**: 5슬라이드 — (1) "€150 exemption ends July 2026" (2) "US already did this in 2025" (3) "What sellers need now" (4) "One API call" (5) "potal.app — 140 features, $0"
