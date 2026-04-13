# Medium Essays — 2026-W16
> 생성일: 2026-04-12 (sunday-content-prep 자동 생성)
> 형식: 에세이 형식 / 한글 번역 포함

---

## Day 1 (Mon 04-13) — API Tutorial

**Title**: The Hidden Cost Your Checkout Doesn't Show — And the API Call That Fixes It

The hardest part of cross-border e-commerce isn't the shipping.

It's the number your customer sees at customs.

They paid $150 at checkout. They expected a package. What they got was a customs bill they didn't know was coming — $28.50 in VAT, $2.25 in insurance fees, a processing charge from the carrier. The parcel sits at customs. The customer contacts support. The return request follows.

This is a solvable problem. The data exists. The calculation is deterministic. You can compute the exact landed cost before checkout and show your customer the real number.

Here's what that looks like in practice.

One API call to POTAL returns: the HS code for your product (the international customs classification code), the applicable import duty rate, the VAT or GST for the destination country, insurance estimates, and any compliance flags — HAZMAT, sanctions, regulatory restrictions.

For a $150 lithium-ion battery pack shipped from South Korea to Germany, the response looks like this: $0 import duty (currently de minimis exempt), $28.50 German VAT at 19%, $2.25 insurance, $180.75 total. Plus a HAZMAT note about IATA DGR requirements for lithium batteries in air freight.

That's every line that a German customs officer sees. Show it to your customer before they pay and you've eliminated the surprise.

The API supports 240 countries and 874,000+ tariff rows. It's updated continuously. It's free.

The problem of cross-border surprise costs isn't a logistics problem. It's an information problem. The data exists; it just hasn't been surfaced to the customer at the right moment.

That's what POTAL is for.

Try it at potal.app — Forever Free, $0/month.

---

### Medium 한글 번역

**제목**: 체크아웃이 보여주지 않는 숨겨진 비용 — 그리고 이를 해결하는 API 호출

국경 간 전자상거래에서 가장 어려운 건 배송이 아닙니다.

고객이 세관에서 보는 숫자입니다.

체크아웃에서 $150을 냈습니다. 패키지를 기대했습니다. 그런데 받은 건 몰랐던 세관 청구서였습니다 — 부가세 $28.50, 보험료 $2.25, 운송사 처리비. 소포는 세관에 묶입니다. 고객은 고객지원에 연락합니다. 반품 요청이 뒤따릅니다.

이건 해결 가능한 문제입니다. 데이터는 존재합니다. 계산은 결정론적입니다. 체크아웃 전에 정확한 착지가격을 계산해서 실제 숫자를 고객에게 보여줄 수 있습니다.

POTAL API 한 번의 호출로: HS Code, 수입관세율, 부가세/소비세, 보험 추정치, 컴플라이언스 플래그를 받습니다.

한국→독일, 배터리팩 $150 시나리오: 관세 $0, 독일 부가세 $28.50, 보험 $2.25, 총 $180.75. 더불어 IATA DGR 리튬 배터리 HAZMAT 주의사항도 함께.

고객이 결제하기 전에 이걸 보여주면 고객의 놀라움이 사라집니다.

국경 간 예상치 못한 비용 문제는 물류 문제가 아닙니다. 정보 문제입니다. 데이터는 있습니다. 적시에 고객에게 전달되지 않을 뿐입니다.

potal.app — 영구 무료. $0/월.

---

## Day 2 (Tue 04-14) — Case Study

**Title**: A Battery Pack Leaves Incheon. By the Time It Clears Frankfurt, the Price Has Changed.

A battery pack leaves a factory in Incheon. A pallet of them, actually — lithium-ion cells, assembled, tested, boxed. $150 per unit.

By the time a single unit clears customs at Frankfurt Airport, the price is $180.75.

That extra $30.75 didn't go anywhere suspicious. It went to the German government ($28.50 in VAT), to the insurer (2.25 at 1.5% of the cargo value), and to no one — the import duty was zero because the package value fell just below the EU's current de minimis threshold.

Zero import duty. That's the counterintuitive part. A $150 product from South Korea enters Germany duty-free because of a rule that was designed for small gifts and sample packages, not commercial electronics. Every $150 battery pack — every box of cosmetics, every fashion accessory under that threshold — entered the EU's market without contributing to the import duty system that protects EU manufacturers.

That rule ends July 1, 2026.

After that date, this $150 battery pack will pay import duties. The exact amount depends on the negotiated rate between Korea and the EU — South Korea has a free trade agreement with the EU (KORUS-equivalent), which may push the rate to zero through a different mechanism. But the de minimis exemption, as a blanket policy, is gone.

For logistics teams planning shipments into Europe past July 1: calculate your new landed costs now. The VAT doesn't change. The insurance doesn't change. But the duty line — currently $0 — may not stay $0.

POTAL can run this calculation for any product, any origin, any EU destination. The data is live. The calculation takes one API call.

$180.75 is the honest price of a $150 battery pack today. Know it before your customer finds out the hard way.

potal.app — Forever Free, $0/month.

---

### Medium 한글 번역

**제목**: 배터리팩이 인천을 떠납니다. 프랑크푸르트 세관을 통과할 때쯤엔 가격이 바뀌어 있습니다.

배터리팩 하나가 인천 공장을 떠납니다. 리튬이온 셀, 조립, 테스트, 포장 완료. 개당 $150.

프랑크푸르트 공항 세관을 통과할 때쯤 가격은 $180.75가 됩니다.

추가된 $30.75: 독일 정부에 $28.50 (부가세 19%), 보험사에 $2.25 (화물가의 1.5%). 수입관세는 $0 — 패키지 금액이 EU 현행 de minimis 기준을 아슬아슬하게 밑돌기 때문.

이 규칙은 2026년 7월 1일에 끝납니다. 그 이후엔 이 배터리팩도 수입관세를 냅니다.

7월 1일 이후 유럽 배송을 계획 중인 물류팀: 지금 새 착지가격을 계산하세요. POTAL이 어떤 제품, 어떤 원산지, 어떤 EU 목적지든 계산합니다. 한 번의 API 호출로.

$180.75가 오늘 $150 배터리팩의 정직한 가격입니다. 고객이 어렵게 알아내기 전에 먼저 아세요.

potal.app — 영구 무료. $0/월.

---

## Day 3 (Wed 04-15) — Industry News

**Title**: For Years, Small Packages Slipped Into the EU Without Customs. That Ends in 77 Days.

For years, a package valued under €150 could enter the European Union from anywhere in the world without paying import duties.

Not without VAT — that always applied. But without duty. Without the friction of formal customs processing. Without contributing to the import duty system that EU manufacturers pay into when they compete in their own market.

Regulators called it the de minimis threshold. Critics called it a loophole. Either way, it was real, it was large, and it ends on July 1, 2026.

Seventy-seven days from now, every package entering the EU from outside — regardless of value — will go through customs processing. Packages under €150 will pay a €3 flat-rate duty. That's the floor. On top of that, carriers will have to file customs declarations for every parcel, adding processing costs that will vary by carrier and volume.

The VAT doesn't change. Germany stays at 19%. France at 20%. The Netherlands at 21%. What changes is that the duty exemption — the rule that let you ship a €30 item to Germany without paying import duties — is gone.

For sellers, this means three things. First, your landed cost for EU shipments under €150 increases. The €3 duty seems small, but for high-volume, low-margin businesses shipping hundreds of parcels daily, it compounds. Second, customs processing time increases. More declarations means more volume through customs systems, means more delays. Third, accurate HS codes become more important. The €3 flat rate applies per package — but if your product has additional specific duties beyond the flat rate, you need the right HS code to know that.

POTAL already calculates EU landed costs for all 27 member states. You can run a Germany scenario, a France scenario, a Netherlands scenario today and see the numbers. The July 1 impact can be modeled now.

The threshold is going away. The question is whether your pricing and logistics planning has already accounted for that.

potal.app — Forever Free, $0/month.

---

### Medium 한글 번역

**제목**: 수년간 소형 패키지는 EU에 세관 없이 들어왔습니다. 77일 후 그게 끝납니다.

수년간, €150 미만 패키지는 어디서든 EU에 수입관세 없이 들어올 수 있었습니다.

부가세는 항상 적용됐습니다. 하지만 관세는 아니었습니다. 2026년 7월 1일, 그 규칙이 끝납니다.

지금으로부터 77일 후, EU 역외에서 들어오는 모든 패키지 — 금액 무관 — 가 통관 처리를 거쳐야 합니다. €150 미만 패키지는 €3 고정 관세를 냅니다. 운송사도 모든 소포에 통관 신고를 제출해야 합니다.

셀러에게 의미하는 것: 첫째, €150 미만 EU 배송 착지가격 상승. 둘째, 통관 처리 시간 증가. 셋째, 정확한 HS Code가 더 중요해짐.

POTAL은 EU 27개 회원국 모두 지원합니다. 지금 바로 독일, 프랑스, 네덜란드 시나리오를 계산하고 7월 1일 이후 영향을 미리 파악하세요.

기준선은 사라집니다. 가격 책정과 물류 계획이 이미 이를 반영했는지가 관건입니다.

potal.app — 영구 무료. $0/월.

---

## Day 4 (Thu 04-16) — Comparison

**Title**: The Customs Industry Has a Dirty Secret: Most HS Code Tools Are Guessing

If you ask most HS code classification tools what code applies to a product called "bag," they'll give you an answer.

That answer will be wrong a large fraction of the time.

Not because the tools are poorly built. Because the question is underspecified. "Bag" is Chapter 42 if it's leather. Chapter 63 if it's textile. Chapter 39 if it's plastic. The chapter — and the duty rate — depends on the material, which no one told the tool.

This isn't a technical failure. It's a data entry problem. One text field is not enough information to classify most products.

Here's what the data actually shows. We ran 23,300 classification tests across 50 products, using 466 different field combinations. The accuracy curve by field count:

Product name only: 18% accuracy. This is the baseline for tools that accept one text field. Nearly one in five has a chance of a correct answer.

Add material: 63%. One additional piece of information — the substance the product is made of — triples accuracy. This jump is so large because the HS Schedule is fundamentally organized by material at the Section and Chapter level.

Add category: 96%. This resolves the remaining ambiguity between chapters that share material types. Leather goods vs. leather footwear vs. leather clothing — same material, different chapters, different duty rates.

Add description: ~100%. The remaining edge cases get resolved by the keyword pool.

The implication is uncomfortable for the industry: most HS classification tools, by accepting only a product name, are operating at 18% accuracy on average. They return an answer. But the answer is correct less than one-fifth of the time.

The fix is not a better algorithm on a single text field. The fix is collecting the right inputs.

POTAL accepts 10 fields. You don't need all of them — three gets you to 96%. But the information has to come from somewhere, and the accuracy difference between one field and three fields is 78 percentage points.

When a misclassified HS code means paying 25% more in tariffs on a shipment of 10,000 units, that 78-point accuracy gap has a dollar value.

Try the difference yourself at potal.app — Forever Free, $0/month.

---

### Medium 한글 번역

**제목**: 관세 업계의 불편한 진실: 대부분의 HS Code 도구는 추측을 합니다

대부분의 HS 분류 도구에 "bag"을 입력하면 답을 줍니다.

그 답은 상당 부분 틀립니다.

도구가 잘못 만들어진 게 아닙니다. 질문이 부족하기 때문입니다. "Bag"은 가죽이면 챕터 42, 섬유면 챕터 63, 플라스틱이면 챕터 39입니다. 챕터 — 그리고 관세율 — 는 소재에 달려 있는데, 아무도 도구에 그걸 알려주지 않았습니다.

23,300회 분류 테스트 결과:
- Product Name만: 18%
- + Material: 63%
- + Category: 96%
- + Description: ~100%

불편한 함의: 제품명 하나만 받는 도구는 평균 18% 정확도로 운영되고 있습니다. 답을 줍니다. 하지만 그 답이 맞을 확률은 5번 중 1번도 안 됩니다.

10,000개 물량에서 HS 오분류로 25% 관세를 더 내면, 그 78포인트 정확도 차이는 돈으로 환산됩니다.

potal.app에서 직접 차이를 확인하세요 — 영구 무료. $0/월.

---

## Day 5 (Fri 04-17) — Behind the Scenes

**Title**: I Spent a Week Eliminating Fake Data From My Product. Here's Why It Was Harder Than It Sounds.

The decision was simple. The execution was not.

I'm a solo founder building POTAL — a trade compliance tool that calculates import duties, classifies HS codes, and screens shipments for sanctions. Accuracy is the product. If the data is wrong, the product is wrong.

Two months ago, I did an audit of POTAL's codebase and found 65 hardcoded entries representing real trade data.

Not obviously wrong. Not obviously anything — they were correct when I wrote them. Fixed HS code overrides that matched a product to its code. Static FTA eligibility rules that reflected real agreements. Sanction entries that matched real restricted entities.

But they were frozen in time. The HS Nomenclature gets updated. FTA rules change when new agreements are ratified. The OFAC SDN list gets updated weekly. Hardcoded data doesn't know that.

The decision was: replace all of it with database rows that have source timestamps and can be synced.

The CW33 sprint series took six weeks and loaded 154,264 rows across 23 tables. Sprint by sprint:

The hardest part wasn't the technical implementation. Supabase handles 47,000-row imports without complaint. The hardest part was the migration order. You can't remove the hardcoded HS overrides until the database table that replaces them is populated. You can't populate that table until the migration runs. You can't run the migration until the verify-cw32 test suite is green. And verify-cw32 is 28 tests that run the full calculation pipeline end-to-end.

One broken test blocks everything. Sprint 4 (sanctions, 47,926 rows) required converting five call sites from synchronous in-memory lookups to async database queries. That touched five different files across the API layer. Each one needed to be async-awaited correctly or the screening endpoint would silently return empty results instead of an error.

The lesson from CW33 wasn't about databases or data volumes. It was about the definition of done.

Done doesn't mean "it works." Done means "it works on real data, the real data is verifiable, and the system knows when the data was last updated."

Before CW33, POTAL gave you the right answer. After CW33, POTAL gives you the right answer and you can trace exactly where it came from.

That's a different product.

potal.app — Forever Free, $0/month.

---

### Medium 한글 번역

**제목**: 제품에서 가짜 데이터를 없애는 데 일주일을 썼습니다. 생각보다 어려운 이유가 있었습니다.

결정은 단순했습니다. 실행은 아니었습니다.

저는 POTAL을 혼자 만들고 있습니다 — 수입관세 계산, HS Code 분류, 제재 스크리닝을 하는 무역 컴플라이언스 도구입니다. 정확도가 제품입니다. 데이터가 틀리면 제품이 틀립니다.

두 달 전, 코드베이스 감사에서 65개 하드코딩 항목을 발견했습니다. 틀리지 않았습니다. 썼을 때는 맞았습니다. 하지만 시간 속에 얼어붙어 있었습니다.

결정: 전부 소스 타임스탬프가 있고 동기화할 수 있는 DB 행으로 교체.

CW33 스프린트 시리즈가 6주 동안 23개 테이블에 154,264행을 로드했습니다.

가장 어려운 부분은 기술 구현이 아니었습니다. 마이그레이션 순서였습니다. 하드코딩된 HS 오버라이드를 제거하려면 DB 테이블이 먼저 채워져야 합니다. 테이블을 채우려면 마이그레이션이 먼저 실행되어야 합니다. 마이그레이션은 verify-cw32 테스트 28개가 통과해야 실행할 수 있습니다.

CW33의 교훈은 DB나 데이터 볼륨이 아니었습니다. '완료'의 정의에 관한 것이었습니다.

완료는 "작동한다"가 아닙니다. 완료는 "실데이터로 작동하고, 실데이터를 검증할 수 있고, 시스템이 데이터가 언제 마지막으로 업데이트됐는지 알고 있다"입니다.

potal.app — 영구 무료. $0/월.

---

## Day 6 (Sat 04-18) — Community/Tips

**Title**: A One-Minute Change to How You Classify Products That Prevents Customs Delays

A customs delay costs more than the cost of the delay.

There's the literal cost: storage fees at the customs facility, re-delivery charges, customer service time, and the refund or return if the customer gives up. Then there's the downstream cost: the customer who got a delayed package doesn't come back.

A significant fraction of customs delays are caused by incorrect HS codes. The wrong code means the wrong duty calculation, which means discrepancies in the paperwork, which means the package gets held for review.

Incorrect HS codes come from underspecified classification. One text field. Product name only. That gets you to about 18% classification accuracy on average. Nearly 82% of products classified this way will get the wrong code.

Here's the one-minute change that fixes most of it.

Add the material.

The HS Schedule — the international system that customs codes are based on — is organized by physical substance at its highest level. Cotton is Chapter 52. Steel is Chapter 72. Rubber is Chapter 40. Leather is Chapter 41.

When you provide the material alongside the product name, classification accuracy jumps from 18% to 63%. That's a 45-point improvement from one additional data point.

If you add the product category (apparel, electronics, footwear, food, cosmetics), accuracy reaches 96%. You've provided two extra fields and gone from barely-above-guessing to nearly-certain.

On POTAL, you can see this happen in real time. The demo form has a classification accuracy bar that updates as you fill fields. Type a product name: 18%. Select a material: 63%. Select a category: 96%. The bar moves because the underlying classification engine is running the calculation live.

Most customs problems are information problems. The solution isn't a better algorithm working on bad inputs. The solution is better inputs.

Material first. Category second. Everything else after.

potal.app — Forever Free, $0/month.

---

### Medium 한글 번역

**제목**: 통관 지연을 막는 제품 분류 방식의 1분 개선법

통관 지연의 비용은 지연 자체의 비용보다 큽니다.

직접 비용: 세관 보관료, 재배송비, 고객 응대 시간, 반품. 간접 비용: 지연을 경험한 고객은 돌아오지 않습니다.

상당 부분의 통관 지연은 잘못된 HS Code에서 옵니다. 틀린 코드 = 틀린 관세 계산 = 서류 불일치 = 검토 보류.

1분 개선법: Material(소재)을 추가하세요.

Product Name만으로 HS 분류 시 정확도 ~18%. Material 추가 시 ~63% (+45포인트). Category 추가 시 ~96%.

POTAL 데모 폼에서 이 과정을 실시간으로 확인할 수 있습니다. 필드를 채울 때마다 정확도 바가 움직입니다.

대부분의 통관 문제는 정보 문제입니다. 해결책은 나쁜 입력값에 더 나은 알고리즘이 아닙니다. 더 나은 입력값입니다.

Material 먼저. Category 두 번째. 나머지는 그 다음.

potal.app — 영구 무료. $0/월.
