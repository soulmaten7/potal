# Daily Content: 2026-04-09 (Thursday)
## Topic: Let Claude Calculate Tariffs with POTAL MCP — 3 Lines of Code
## Category: 2 — API Tutorial / Code Walkthrough
## Case: 2 (Sunday Prep ✅ + New Demo Assets ✅ — Prep 보강 + 새 에셋 반영)
## POTAL 실데이터 사용: classify_product (HS 8518.30, Wireless Bluetooth Headphones) + calculate_landed_cost (CN→US $109.59, CN→DE $96.39)

---

## 🎬 첨부 에셋 안내 (★ 필수 섹션)

이 섹션은 각 플랫폼에 포스팅할 때 어떤 이미지/영상을 첨부해야 하는지 안내한다.
에셋 파일명은 Notion "데모 영상 제작 가이드"에 적힌 이름을 그대로 사용한다.
**이미지/영상은 플랫폼별로 여러 개 첨부 가능** — 관련 에셋이 많으면 모두 안내한다.

### LinkedIn
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | rec_12_api-docs.mov | 영상 | 메인 영상으로 업로드. 개발자 페이지에서 코드 예시 복사하는 장면이 핵심 |
| 2 | 09_api-docs.png | 이미지 | 영상 대신 이미지 사용 시. /developers 페이지 상단 스크린샷 |
| 3 | rec_22_dashboard-10field.mov | 영상 | (간접 관련) Dashboard에서 10-field 입력 시연 — "MCP가 이걸 자동으로 한다" 맥락 |
| 4 | rec_24_features-browse.mov | 영상 | (간접 관련) Features 페이지 탐색 — "140개 기능을 MCP로 접근" 맥락 |

### X (Twitter)
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 09_api-docs.png | 이미지 | 트윗에 개발자 페이지 스크린샷 첨부 — 코드 예시가 보이게 |
| 2 | 04_result.png | 이미지 | 스레드에서 "이 결과를 MCP가 자동으로 가져온다" 설명 시 사용 |

### Instagram
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 09_api-docs.png | 이미지 | 캐러셀 1번: /developers 페이지 전체 |
| 2 | 04_result.png | 이미지 | 캐러셀 2번: MCP가 반환하는 결과 예시 |
| 3 | 01_hero.png | 이미지 | 캐러셀 3번: POTAL 홈페이지 "140 Features. All Free." |
| 에셋이 부족하면: Canva에서 코드 스니펫 인포그래픽 제작 권장 (터미널 스타일 배경 + 3줄 코드) |

### Threads
| 순서 | 에셋 파일명 | 유형 | 사용 방법 |
|------|-----------|------|----------|
| 1 | 09_api-docs.png | 이미지 | 개발자 페이지 스크린샷 — 짧은 글에 시각 자료 추가 |

### 에셋 참고사항
- rec_12_api-docs.mov: CW22-S4e 재촬영 완료 (2026-04-07). /developers 페이지 최신 상태 반영됨.
- rec_22_dashboard-10field.mov: CW22-S4e 재촬영 완료. Dashboard 10-field 입력 최신.
- rec_24_features-browse.mov: CW22-S4e 재촬영 완료. /features 통합 페이지 최신.
- ⚠️ 터미널 코드 스크린샷 (npm install + MCP 호출)은 아직 미촬영. Canva 인포그래픽으로 대체 권장.

---

## LinkedIn

I gave Claude one task: "What's the total landed cost for $79.99 headphones from China to the US?"

Three lines of code. Real answer in under 2 seconds.

Here's what happened:

```
npm install -g potal-mcp-server
```

Then Claude called two functions:
→ classify_product("Wireless Bluetooth Headphones", material: "plastic")
→ calculate_landed_cost(price: $79.99, origin: CN, destination: US)

The result:

HS Code: 8518.30
Base Duty: 0%
Section 301 Tariff: +25% ($20.00)
Sales Tax (NY): 8% ($6.40)
CBP Processing Fee: $2.00
Insurance: $1.20

Total Landed Cost: $109.59

Your customer thinks they're paying $79.99. They're actually paying $109.59. That's a 37% gap.

Same headphones to Germany?
→ $96.39 (duty-free under €150 de minimis, 19% VAT)

The difference between the US and Germany: $13.20 — entirely because of Section 301.

This is what POTAL MCP does. It gives AI agents real-time access to:
— HS code classification (96% accuracy with 3 fields)
— Landed cost calculation across 240 countries
— FTA lookup, sanctions screening, restriction checks
— 10 functions total, all through one npm package

No API key management. No rate limits. No monthly fees.

potal-mcp-server works with Claude, ChatGPT, and Gemini. Install once, query forever.

The full API docs are at potal.app/developers — copy-paste examples included.

First comment: potal.app/developers

#TradeCompliance #MCP #AIAgents #CustomsDuty #LandedCost

---

### LinkedIn 한글 번역

Claude에게 하나만 물어봤습니다: "중국산 $79.99 헤드폰을 미국에 보내면 총비용이 얼마야?"

코드 3줄. 실제 답변 2초 이내.

이렇게 했습니다:

```
npm install -g potal-mcp-server
```

그러면 Claude가 두 가지 함수를 호출합니다:
→ classify_product("Wireless Bluetooth Headphones", material: "plastic")
→ calculate_landed_cost(price: $79.99, origin: CN, destination: US)

결과:

HS Code: 8518.30
기본 관세: 0%
Section 301 관세: +25% ($20.00)
판매세 (뉴욕): 8% ($6.40)
CBP 처리 수수료: $2.00
보험: $1.20

총 도착 비용: $109.59

고객은 $79.99를 내는 줄 압니다. 실제로는 $109.59입니다. 37% 차이.

같은 헤드폰을 독일로 보내면?
→ $96.39 (€150 미만 면세, 부가세 19%)

미국과 독일의 차이: $13.20 — 전부 Section 301 때문입니다.

이게 POTAL MCP가 하는 일입니다. AI 에이전트에게 실시간 무역 데이터 접근을 제공합니다:
— HS 코드 분류 (3개 필드로 96% 정확도)
— 240개국 도착 비용 계산
— FTA 조회, 제재 심사, 규제 확인
— 총 10개 함수, npm 패키지 하나로

API 키 관리 불필요. 속도 제한 없음. 월 요금 없음.

potal-mcp-server는 Claude, ChatGPT, Gemini에서 동작합니다. 한 번 설치, 영구 사용.

전체 API 문서: potal.app/developers — 복사해서 쓸 수 있는 예시 포함.

첫 댓글: potal.app/developers

#TradeCompliance #MCP #AIAgents #CustomsDuty #LandedCost

---

## X (Twitter)

Thread (5 tweets):

1/5
I asked Claude: "What's the landed cost for $79.99 headphones, China to US?"

3 lines of code. Real answer:

$79.99 product
+$20.00 Section 301 (25%)
+$6.40 sales tax
+$2.00 CBP fee
+$1.20 insurance
= $109.59 total

37% more than the sticker price.

2/5
How?

npm install -g potal-mcp-server

That's it. Claude now has access to:
• HS code classification
• Landed cost for 240 countries
• FTA lookup
• Sanctions screening

10 functions. Zero API fees. Forever.

3/5
Same headphones to Germany: $96.39
Same headphones to US: $109.59

$13.20 difference — entirely Section 301.

Your AI agent can now compare costs across countries in seconds.

4/5
Works with Claude, ChatGPT, and Gemini.

No API keys. No rate limits. No $50K/yr enterprise contracts.

Just install and ask.

5/5
Full docs + copy-paste code examples:
potal.app/developers

140 trade compliance features. All free.

#MCP #AIAgents #TradeCompliance

---

### X 한글 번역

스레드 (5개 트윗):

1/5
Claude에게 물어봤습니다: "중국산 $79.99 헤드폰, 미국 도착 비용은?"

코드 3줄. 실제 결과:

$79.99 상품가
+$20.00 Section 301 (25%)
+$6.40 판매세
+$2.00 CBP 수수료
+$1.20 보험
= $109.59 총비용

표시 가격보다 37% 비쌉니다.

2/5
방법?

npm install -g potal-mcp-server

끝입니다. Claude가 이제 접근 가능:
• HS 코드 분류
• 240개국 도착 비용
• FTA 조회
• 제재 심사

10개 함수. API 비용 0원. 영구.

3/5
같은 헤드폰 독일행: $96.39
같은 헤드폰 미국행: $109.59

$13.20 차이 — 전부 Section 301.

AI 에이전트가 이제 초 단위로 국가별 비용을 비교합니다.

4/5
Claude, ChatGPT, Gemini 모두 호환.

API 키 없음. 속도 제한 없음. 연간 $50K 엔터프라이즈 계약 없음.

설치하고 물어보세요.

5/5
전체 문서 + 복사용 코드 예시:
potal.app/developers

무역 컴플라이언스 기능 140개. 전부 무료.

#MCP #AIAgents #TradeCompliance

---

## Instagram

Your AI can now calculate customs duties.

Not in theory. Right now.

I installed one npm package — potal-mcp-server — and asked Claude a simple question:

"What's the total cost for $79.99 wireless headphones from China to the US?"

Here's what came back in under 2 seconds:

HS Code: 8518.30 (headphones/speakers)
Base import duty: 0%
Section 301 tariff: +25% → $20.00
New York sales tax: 8% → $6.40
CBP processing fee: $2.00
Insurance: $1.20

Total landed cost: $109.59

That's 37% more than the price your customer sees at checkout.

Now the wild part — I changed just one thing. Destination: Germany instead of the US.

Same product. Same price. Same origin.

Total: $96.39.

$13.20 less. Because Germany doesn't have Section 301.

This is what POTAL MCP gives your AI agent:
→ HS code classification (96% accuracy)
→ Landed cost across 240 countries
→ FTA agreements, sanctions screening, trade restrictions
→ 10 functions, 1 npm package, $0/month

It works with Claude, ChatGPT, and Gemini. No API keys needed. No rate limits.

140 features. All free. Forever.

Try the live demo → Link in bio → potal.app

.
.
.
#TradeCompliance #MCP #ModelContextProtocol #AIAgents #CustomsDuty #LandedCost #ImportExport #Ecommerce #CrossBorderTrade #GlobalTrade #HarmonizedSystem #HSCode #Section301 #ChinaTariffs #FreeTools #DeveloperTools #APIIntegration #Claude #ChatGPT #Gemini

---

### Instagram 한글 번역

당신의 AI가 이제 관세를 계산합니다.

이론이 아닙니다. 지금 바로.

npm 패키지 하나 — potal-mcp-server — 를 설치하고 Claude에게 간단히 물어봤습니다:

"중국산 $79.99 무선 헤드폰을 미국에 보내면 총비용이 얼마야?"

2초 안에 돌아온 답:

HS Code: 8518.30 (헤드폰/스피커)
기본 수입 관세: 0%
Section 301 관세: +25% → $20.00
뉴욕 판매세: 8% → $6.40
CBP 처리 수수료: $2.00
보험: $1.20

총 도착 비용: $109.59

고객이 결제 시 보는 가격보다 37% 비쌉니다.

여기서 재밌는 부분 — 딱 하나만 바꿨습니다. 목적지: 미국 대신 독일.

같은 상품. 같은 가격. 같은 원산지.

총액: $96.39.

$13.20 저렴합니다. 독일에는 Section 301이 없으니까.

POTAL MCP가 AI 에이전트에게 주는 것:
→ HS 코드 분류 (96% 정확도)
→ 240개국 도착 비용
→ FTA 협정, 제재 심사, 무역 규제
→ 10개 함수, npm 패키지 1개, 월 $0

Claude, ChatGPT, Gemini 호환. API 키 불필요. 속도 제한 없음.

140개 기능. 전부 무료. 영원히.

라이브 데모 → Link in bio → potal.app

#TradeCompliance #MCP #ModelContextProtocol #AIAgents #CustomsDuty #LandedCost #ImportExport #Ecommerce #CrossBorderTrade #GlobalTrade #HarmonizedSystem #HSCode #Section301 #ChinaTariffs #FreeTools #DeveloperTools #APIIntegration #Claude #ChatGPT #Gemini

---

## Threads

Asked Claude to calculate tariffs. It did.

$79.99 headphones from China:
→ US: $109.59 (Section 301 adds $20)
→ Germany: $96.39 (no Section 301)

37% hidden cost gap.

One npm package. 10 functions. 240 countries. $0/month.

npm install -g potal-mcp-server

Works with Claude, ChatGPT, Gemini. No API keys needed.

Full docs: potal.app/developers

#MCP #AIAgents #TradeCompliance #LandedCost #FreeTools

---

### Threads 한글 번역

Claude에게 관세 계산을 시켰습니다. 해냈습니다.

중국산 $79.99 헤드폰:
→ 미국: $109.59 (Section 301이 $20 추가)
→ 독일: $96.39 (Section 301 없음)

37% 숨겨진 비용 차이.

npm 패키지 1개. 함수 10개. 240개국. 월 $0.

npm install -g potal-mcp-server

Claude, ChatGPT, Gemini 호환. API 키 불필요.

전체 문서: potal.app/developers

#MCP #AIAgents #TradeCompliance #LandedCost #FreeTools
