# W16 주간 토픽 플랜 (2026-04-13 ~ 04-18)
> 생성일: 2026-04-12 (sunday-content-prep 자동 생성)

## 카테고리 로테이션
W15 마지막 카테고리: Category 1 (Product Feature Deep Dive, 04-11 토)
W16 시작: Category 2부터 순환

| 요일 | 날짜 | 카테고리 | 토픽 | 핵심 앵글 |
|------|------|---------|------|----------|
| 월 | 04-13 | 2 — API Tutorial | POTAL API 3분 가이드 — HS 분류 + Landed Cost 한 번에 | classify_product + calculate_landed_cost 두 엔드포인트 실제 코드. npm potal-mcp-server 또는 REST. AI 에이전트에서 바로 쓰는 방법. |
| 화 | 04-14 | 3 — Case Study | Li-ion 배터리팩, 한국→독일 실비용: $180.75 | POTAL MCP 실데이터: $150 배터리팩이 독일 도착 시 $180.75. 관세 $0 (de minimis), VAT 19% = $28.50, 보험 $2.25. HAZMAT 주의사항. |
| 수 | 04-15 | 4 — Industry News | EU 면세 D-77 — 2026년 7월 1일이 바꾸는 것들 | €150 de minimis 폐지 카운트다운. 패키지마다 관세 처리. €3 flat-rate duty. POTAL은 DE, FR, NL 등 EU 전체 이미 지원. |
| 목 | 04-16 | 5 — Comparison | HS Code 정확도: 1필드 18% vs 4필드 100% — 데이터 | 23,300 ablation 테스트 결과. Product Name만: 18%. +Material: 63%. +Category: 96%. +Description: ~100%. 시각적 비교. |
| 금 | 04-17 | 6 — Behind the Scenes | 154,264행 실데이터를 혼자 시드한 이야기 (CW33) | 6개 스프린트, 23개 테이블, 154,264행. "No Fake, All Real" 결정부터 완료까지. 1인 창업 + Claude AI 조합. |
| 토 | 04-18 | 7 — Community/Tips | HS 정확도를 45포인트 올리는 필드 하나 | Material 필드 = +45% 정확도. Description 아님, 가격 아님. 실증 데이터. 5분 만에 바로 쓸 수 있는 팁. |

## 첫 줄 Hook 요약

| 날짜 | 플랫폼 | Hook |
|------|--------|------|
| 04-13 | LinkedIn | "Three lines of code. That's all it takes to get a fully classified HS code and landed cost for any product, to any country." |
| 04-13 | DEV.to | "You're building a checkout flow. You need the HS code and total import cost for 5 countries. Here's the POTAL API call that does it." |
| 04-13 | Medium | "The hardest part of cross-border e-commerce isn't the shipping. It's the number your customer sees at customs." |
| 04-14 | LinkedIn | "We shipped a $150 lithium-ion battery pack from South Korea to Germany. POTAL calculated the real cost: $180.75. Here's every line." |
| 04-14 | DEV.to | "Li-ion batteries are HS 8507.60. Ship one from KR to DE and you get: $0 import duty, $28.50 VAT, $2.25 insurance. Total: $180.75." |
| 04-14 | Medium | "A battery pack leaves a factory in Incheon. By the time it clears German customs, $30.75 has been added to the price. Who pays that?" |
| 04-15 | LinkedIn | "In 77 days, the EU eliminates its €150 de minimis threshold. Every package from outside the EU gets a customs bill. Ready?" |
| 04-15 | DEV.to | "On July 1, 2026, the EU removes the €150 customs exemption. Here's what changes in your cross-border logistics stack." |
| 04-15 | Medium | "For years, small packages slipped into the EU without customs paperwork. That ends in 77 days." |
| 04-16 | LinkedIn | "One product. Two inputs. 18% accuracy. Add one more field. 63%. One more. 96%. This is what the ablation data actually shows." |
| 04-16 | DEV.to | "We ran 23,300 classification tests across 50 products. Here's the exact accuracy curve by field count." |
| 04-16 | Medium | "The customs industry has a dirty secret: most HS code tools are guessing. Here's how to tell the difference." |
| 04-17 | LinkedIn | "Sprint 1: Foundation. Sprint 6: 154,264 rows of real trade data in production. No fake entries. Here's what 'No Fake, All Real' actually took." |
| 04-17 | DEV.to | "CW33 build log: how I replaced every hardcoded value in POTAL with real database entries across 6 sprints." |
| 04-17 | Medium | "I spent a week eliminating fake data from my product. Here's why that decision was harder than it sounds." |
| 04-18 | LinkedIn | "The single field that improves HS code accuracy by 45 percentage points. It's not the description. It's not the price." |
| 04-18 | DEV.to | "Quick tip: HS code accuracy breakdown by field. One change gets you from 18% to 63%." |
| 04-18 | Medium | "A one-minute change to how you classify products can prevent customs delays for your buyers." |
