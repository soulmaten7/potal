# POTAL PMF Outreach Playbook
> ⚠️ **이 파일은 2026-04-02부터 `community-prompts/` 폴더로 대체되었습니다.**
> 실행 방법: `community-prompts/Community_Outreach_Map.md` 참조
> Gemini 채팅 5개로 전 세계 커뮤니티에 현지어 답변 (영어/독일어/일본어/한국어/인도영어)
> 이 파일은 전략 참고용으로 보존합니다.

> 작성일: 2026-04-01
> 목적: 실제 사용자 5~10명을 직접 만들고, PMF를 확인하기 위한 2주 실행 가이드
> 원칙: "넓게 뿌리기" 금지. "좁고 깊게" 대화하기.

---

## 핵심 전략 요약

| 항목 | 내용 |
|------|------|
| 목표 | 2주 안에 실제 POTAL 사용자 5~10명 확보 |
| 방식 | 3개 채널에서 매일 "도움 주기 + 직접 대화" |
| 하지 말 것 | 홍보성 포스팅, 여러 플랫폼에 같은 글 뿌리기 |
| 해야 할 것 | 관세 문제로 고민하는 사람을 찾아서, 진짜 도움 주기 |

---

## PART 1: 타겟 정의 — "누구에게 말할 것인가"

### 1차 타겟 (가장 긴급한 사람)

**"관세 때문에 고객을 잃고 있는 크로스보더 Shopify 셀러"**

이 사람의 특징:
- Shopify/WooCommerce에서 해외 고객에게 판매 중
- 체크아웃에서 관세/세금이 안 보여서 "고객이 결제 직전에 이탈"하는 경험
- 또는 DDP로 보냈는데 관세 금액을 잘못 계산해서 마진이 깎임
- 또는 DAP로 보냈는데 고객이 "예상 못한 관세"에 화내서 반품/리뷰테러
- Zonos 같은 솔루션을 써봤는데 비쌈 ($100~$4,000/월)

**이 사람이 하는 말 (검색할 키워드):**
- "customers refusing delivery because of duties"
- "how to show landed cost at checkout"
- "Shopify duties and taxes at checkout"
- "DDP vs DAP which is better"
- "Zonos alternative" / "Zonos too expensive"
- "HS code classification for my products"
- "customs duty calculator free"
- "surprise duties killing my conversion rate"

### 2차 타겟 (기술적으로 관심 있는 사람)

**"AI 에이전트/자동화에 관세 계산을 연동하고 싶은 개발자"**

이 사람의 특징:
- MCP, API, AI agent를 만들고 있는 개발자
- 크로스보더 커머스 자동화 프로젝트 진행 중
- HS Code 분류를 자동화하고 싶음

**이 사람이 하는 말:**
- "customs duty API"
- "HS code classification API"
- "MCP server ecommerce"
- "landed cost calculation API free"
- "trade compliance automation"

### 3차 타겟 (장기적 파트너)

**"크로스보더 컨설팅/물류 담당자"**

이 사람의 특징:
- Customs broker, Trade compliance officer, Import/Export manager
- 기업의 관세 업무를 담당하면서 더 좋은 도구를 찾고 있음
- 무역 관련 LinkedIn 그룹에서 활동

---

## PART 2: 채널별 실행 가이드 — "어디서, 어떻게"

---

### 채널 1: Reddit (매일 오후 30분)

#### 어디서 찾나

| 서브레딧 | 멤버 수 | 왜 여기인가 | 검색 키워드 |
|----------|---------|-------------|------------|
| r/shopify | 220K+ | Shopify 셀러들이 관세 문제를 직접 물어봄 | duties, customs, international shipping, landed cost |
| r/ecommerce | 180K+ | 크로스보더 셀러 밀집 | cross-border, duties, DDP, tariffs |
| r/FulfillmentByAmazon | 110K+ | 아마존 FBA 셀러, 수입 관세 고민 많음 | import duties, HS code, customs |
| r/smallbusiness | 1.1M+ | 소규모 수출입 사업자 | import, export, customs, duties |
| r/Entrepreneur | 3M+ | 사업 시작하면서 관세 모르는 사람들 | international selling, customs, shipping overseas |

#### 정확히 뭘 하나

**Step 1: 검색**

각 서브레딧에서 이 키워드를 검색 (Sort by: New)
```
site:reddit.com/r/shopify duties taxes checkout
site:reddit.com/r/ecommerce landed cost customs
site:reddit.com/r/shopify DDP DAP
site:reddit.com/r/ecommerce "HS code"
```

**Step 2: 도움 되는 답변 달기 (POTAL 언급 없이)**

찾은 질문에 대해 "진짜 도움이 되는 답변"을 먼저 적어요. POTAL은 아직 언급하지 않아요.

예시 — 누가 이런 글을 올렸을 때:
> "My EU customers keep getting hit with surprise customs fees. Any way to calculate this upfront?"

이렇게 답변:
```
Great question. The two main approaches are:

1. Switch to DDP (Delivered Duty Paid) — you calculate duties upfront
   and include them in the checkout price. Your customer sees the final
   price with no surprises.

2. Show a "landed cost estimate" at checkout — this requires knowing
   the HS code of your product + the destination country's duty rate.

For HS code classification, your product category matters a lot.
For example, a cotton t-shirt (6109.10) has very different duty rates
than a polyester blend (6109.90).

The key numbers you need:
- HS code (determines the duty %)
- Destination country duty rate (varies by country + trade agreements)
- VAT/GST rate of the destination country
- De minimis threshold (some countries waive duties below a certain value)

What products are you selling and to which countries? Happy to help
you figure out the specific rates.
```

**Step 3: 대화가 이어지면, 자연스럽게 POTAL 소개**

상대가 "thanks, can you help me find the HS code for X?" 같은 후속 질문을 하면:
```
Sure! For [product], the HS code would likely be [code].
The duty rate to [country] is approximately [X]%.

Actually, I built a free tool that does exactly this —
calculates landed cost for 240 countries including duties,
taxes, and shipping. It's called POTAL (potal.app).
Completely free, no usage limits.

Let me know if you want me to run a calculation for your
specific product.
```

#### 하지 말 것 (Reddit에서 절대 금지)
- 글 올리자마자 POTAL 링크 넣기 → 스팸 처리됨
- "Check out my free tool!" 같은 셀프 프로모션 → 다운보트 + 밴
- 같은 답변 복붙 → 스팸으로 보고됨
- 새 계정으로 바로 홍보 → Karma가 낮으면 글 자체가 안 보임

#### 해야 할 것
- 먼저 2~3일은 다른 글에 유용한 답변만 달기 (Karma 쌓기)
- 답변이 진짜 도움이 되어야 함 (복붙 아닌, 그 사람 상황에 맞는 구체적 답변)
- POTAL 언급은 대화의 자연스러운 흐름에서만
- 일주일에 1~2번만 직접 글(Post) 작성 가능. "Show HN" 스타일로:
  - "I built a free customs duty calculator for cross-border sellers — feedback welcome"

---

### 채널 2: LinkedIn (매일 오전 30분)

#### 누구를 찾나

LinkedIn 검색 (일반 검색 또는 Sales Navigator)에서 아래 조합으로 검색:

**검색어 조합 1 — Shopify 셀러:**
```
"cross-border" AND "Shopify" AND ("ecommerce" OR "e-commerce")
```
Job Title 필터: Founder, CEO, COO, Head of Operations, Ecommerce Manager

**검색어 조합 2 — 물류/관세 담당자:**
```
"customs" AND ("ecommerce" OR "logistics" OR "trade compliance")
```
Job Title 필터: Customs Broker, Trade Compliance Manager, Import Manager, Supply Chain Manager, Logistics Director

**검색어 조합 3 — 개발자/API 사용자:**
```
"ecommerce API" AND ("developer" OR "CTO" OR "engineer")
```

**검색어 조합 4 — 경쟁사 고객 (가장 강력):**
```
"Zonos" OR "Avalara" OR "Global-e" OR "customs duty calculator"
```
→ 이 키워드가 포함된 포스트에 댓글 단 사람 / 이 회사를 팔로우하는 사람

#### 정확히 뭘 하나

**방법 A: Connection Request + 메시지 (매일 10명)**

하루에 10명에게 Connection Request를 보냅니다. 메시지는 짧고 개인적이어야 해요.

**Connection Request 메시지 템플릿 (300자 제한):**

버전 1 — Shopify 셀러용:
```
Hi [이름], saw you're scaling [회사명] internationally on Shopify.
I've been working on cross-border duty calculation — curious if
duties/taxes at checkout have been a pain point for you?
```

버전 2 — 관세 관련 포스트에 반응한 사람용:
```
Hi [이름], noticed your comment about [specific topic they mentioned].
I've been deep in this space — built a free landed cost tool for
240 countries. Would love to hear how you're handling this currently.
```

버전 3 — 개발자용:
```
Hi [이름], saw your work on [their project/post]. I built an open
MCP server for customs duty calculation — free API, 240 countries.
Thought it might be relevant to what you're building.
```

**방법 B: 포스트에 댓글 달기 (매일 3~5개)**

LinkedIn에서 이 키워드로 "Posts" 탭을 검색:
```
cross-border ecommerce duties
customs duty calculator
landed cost ecommerce
international shipping costs
tariffs ecommerce impact
```

관련 포스트를 찾으면 "가치 있는 댓글"을 답니다:

예시 — 누군가 "New US tariffs are killing our margins" 같은 글을 올렸을 때:
```
This is hitting a lot of sellers hard. The key is making duties
transparent at checkout — 75% of customers abandon orders when they
get hit with surprise fees at delivery.

Two things that help:
1. Switch to DDP and bake duties into the product price
2. Show a landed cost breakdown at checkout so customers know
   exactly what they're paying

The HS code classification is usually where it gets tricky —
the difference between 6109.10 and 6109.90 can mean 0% vs 15% duty.
```

댓글에 POTAL을 바로 언급하지 않아요. 누가 "how do you calculate this?" 하고 물어보면 그때:
```
I actually built a free tool for this — potal.app. It calculates
landed cost for 240 countries including duties, VAT, and FTA
preferential rates. No cost, no usage limits.
Happy to run some numbers for your specific products if you want.
```

**방법 C: 프로필 최적화 (1회)**

LinkedIn 프로필을 먼저 정리하세요. 사람들이 DM 보기 전에 프로필을 2~3번 확인합니다.

Headline 변경:
```
현재: [기존 타이틀]
변경: Building POTAL — Free Landed Cost Infrastructure for Cross-Border Commerce | 240 Countries, 140 Features, $0 Forever
```

About 섹션에 추가:
```
Cross-border sellers shouldn't have to pay $4,000/month just to
calculate duties and taxes.

I built POTAL (potal.app) — a free Total Landed Cost platform with
140 features covering 240 countries. HS Code classification, duty
calculation, FTA origin determination, sanctions screening, and more.

Forever free. No usage caps. No hidden tiers.

If you're in cross-border ecommerce and struggling with duties/taxes,
I'd love to chat: [이메일]
```

---

### 채널 3: Shopify Community + 개발자 커뮤니티 (매일 오후 20분)

#### Shopify Community (community.shopify.com)

**어디에서 찾나:**
- Shopify Discussions → "international" / "duties" / "customs" 검색
- Shopify Apps → "duty calculator" / "landed cost" 관련 앱 리뷰 확인
- Troubleshooting duties and import taxes 관련 스레드

**검색 URL:**
```
https://community.shopify.com/c/shopify-discussions/bd-p/shopify-discussions
→ 검색: "duties" / "customs" / "landed cost" / "international shipping tax"
```

**답변 방식 (Reddit과 동일한 원칙):**

먼저 도움이 되는 답변을 자세히 적고, 대화가 이어지면 POTAL 소개.

예시:
```
The issue you're describing is really common — customers in [country]
are seeing duties at delivery because your store is set to DAP
(Delivered at Place).

To fix this:
1. Go to Settings > Markets > [Country] > Duties and import taxes
2. Enable "Charge duties and import taxes at checkout"
3. Make sure your HS codes are set correctly for each product

For HS code lookup: your product [X] would likely fall under
[HS code], which has a [X]% duty rate to [country].

If you need a quick way to check rates for multiple countries,
there's a free tool at potal.app that covers 240 countries —
might save you some time.
```

#### DEV.to (dev.to)

**뭘 하나:**
- 주 1회 기술 블로그 포스트 작성
- MCP, API, cross-border ecommerce 관련 기술 글

**포스트 주제 아이디어:**

1주차: "How I Built a Free Landed Cost API for 240 Countries"
- POTAL의 기술 스택, 아키텍처, HS Code 분류 방식 설명
- API 사용 예시 코드 포함
- 태그: #api #ecommerce #opensource #webdev

2주차: "Building an MCP Server for Customs Duty Calculation"
- MCP란 뭔지, POTAL MCP 서버 사용법
- Claude/ChatGPT에서 관세 계산하는 실제 예시
- 태그: #ai #mcp #ecommerce #api

**DEV.to 글 구조:**
```
1. 문제 정의 (관세 계산이 왜 어려운지)
2. 해결 방법 (기술적으로 어떻게 만들었는지)
3. 코드 예시 (API 호출 코드 3~5줄)
4. 결과 (실제 계산 결과 예시)
5. "써보고 피드백 주세요" + potal.app 링크
```

#### Indie Hackers (indiehackers.com)

**뭘 하나:**
- 주 1~2회 "빌딩 저니" 포스트
- 구체적인 숫자가 포함된 진행 상황 공유

**포스트 예시:**
```
제목: "I launched a free customs duty calculator with 140 features —
here's what happened in week 1"

내용:
- 왜 만들었는지 (경쟁사 분석, $4K/월 vs 무료)
- 첫 주 결과 (방문자 수, API 호출 수, 피드백)
- 배운 점
- 다음 주 계획
```

Indie Hackers에서는 "진짜 숫자"가 반응을 만듭니다. $0 MRR이어도 괜찮아요 — 솔직함이 핵심.

---

## PART 3: 일일 실행 스케줄

### 매일 루틴 (총 약 90분)

| 시간 | 활동 | 채널 | 소요 시간 |
|------|------|------|----------|
| 오전 (9:00~9:30) | LinkedIn: Connection Request 10개 + 댓글 3~5개 | LinkedIn | 30분 |
| 오후 (14:00~14:30) | Reddit: 관련 질문 검색 + 답변 3~5개 | Reddit | 30분 |
| 오후 (14:30~14:50) | Shopify Community: 관련 질문 답변 1~2개 | Shopify | 20분 |
| 저녁 (21:00~21:10) | 오늘 반응 정리 (누가 답했는지, 뭘 물었는지) | 스프레드시트 | 10분 |

### 주간 루틴

| 요일 | 추가 활동 |
|------|----------|
| 월요일 | DEV.to 또는 Indie Hackers 글 1개 작성 |
| 수요일 | LinkedIn 포스트 1개 작성 (관세 관련 인사이트) |
| 금요일 | 주간 결과 정리: 총 연락 수, 답변 수, 가입 수 |

---

## PART 4: 반응 추적 시트

매일 저녁 10분 동안 이걸 기록하세요:

| 날짜 | 채널 | 상대방 | 상대 상황 | 내가 한 답변 | 반응 | POTAL 소개 여부 | 가입 여부 | 메모 |
|------|------|--------|----------|-------------|------|----------------|----------|------|
| 4/2 | Reddit r/shopify | u/seller123 | EU 배송 관세 문제 | DDP 전환 방법 설명 | 감사 답변 + 후속 질문 | O (자연스럽게) | 확인 중 | HS code 도움 요청함 |
| 4/2 | LinkedIn | John S. | Shopify Plus, 미국→유럽 | Connection request | 수락 | X (아직) | - | 다음 주 DM 예정 |

---

## PART 5: 2주 후 판단 기준

### 성공 신호 (PMF 있음 → 확대하기)
- 5명 이상이 실제로 POTAL에서 API 호출 또는 기능 사용
- "이 기능 좋다", "이거 필요했다" 같은 자발적 피드백
- 누군가 다른 사람에게 POTAL을 추천한 경우
- API 호출이 매일 증가하는 추세

이 신호가 보이면 → Product Hunt 런칭, 데모 영상, 더 많은 플랫폼 포스팅으로 확대

### 경고 신호 (PMF 재검토 필요)
- 가입은 하는데 아무도 실제로 사용하지 않음
- "무료라서 좋다" 말고 다른 가치를 못 느낌
- 관세 문제를 가진 사람 자체를 찾기 어려움
- 답변에 반응이 전혀 없음

이 신호가 보이면 → 타겟을 바꾸거나, 기능 범위를 좁히거나, 메시지를 완전히 다시 만들기

### 위험 신호 (큰 방향 전환 필요)
- 사람들이 관세 계산 도구 자체에 관심이 없음
- "그건 그냥 스프레드시트로 해요" 같은 반응
- 무료여도 안 쓰는 사람이 대부분

이 신호가 보이면 → 1:1 인터뷰로 "진짜 문제가 뭔지" 다시 물어보기

---

## PART 6: DM/이메일 템플릿 모음

### LinkedIn DM (Connection 수락 후 보내는 첫 메시지)

**셀러용:**
```
Hi [이름], thanks for connecting!

Quick question — in your experience selling to [국가/지역],
how do you handle duties and taxes at checkout?

I've been talking to a lot of cross-border sellers and this seems
to be a huge pain point. Curious if you've found a good solution
or if it's still a headache.

No pitch — genuinely curious about your experience.
```

**답변이 오면 2번째 메시지:**
```
That makes sense. [그들의 답변에 대한 구체적 반응].

I actually built something for exactly this problem — it's called
POTAL (potal.app). Free landed cost calculator covering 240 countries.
Duties, taxes, FTA rates, HS code classification — all included.

Would you be open to trying it out? I'd really value your honest
feedback on what works and what doesn't.
```

### 콜드 이메일 (기업 담당자용)

**제목:** Quick question about [회사명]'s cross-border duty calculation

```
Hi [이름],

I noticed [회사명] ships internationally to [지역].
Quick question — how are you currently calculating duties and
import taxes for your customers?

I built POTAL (potal.app) — a free Total Landed Cost platform
that covers 240 countries. It includes HS code classification,
duty rates, VAT/GST, FTA preferential rates, and more.

It's completely free with no usage limits (not a trial — actually free forever).

Would you be open to a 10-minute call this week? I'd love to
show you how it works and get your honest feedback.

Best,
Euntae Jang
POTAL — potal.app
```

### Shopify 앱 리뷰 섹션 댓글 (경쟁사 앱 리뷰에 답변)

Zonos, Avalara, Global-e 같은 앱 리뷰에서 "너무 비싸다" / "기능이 부족하다" 같은 리뷰를 남긴 사람에게:

**직접 댓글은 안 됨** — 대신 그 사람의 스토어를 찾아서 이메일로 연락:
```
Hi [이름],

I came across your store [스토어명] — looks like you're shipping
internationally. I noticed you might be looking for a better
solution for duty/tax calculation.

I built POTAL (potal.app) as a free alternative — 140 features,
240 countries, no cost ever. I built it specifically because I
thought sellers shouldn't have to pay $4,000/month for customs calculation.

Would love to get your take on it if you have 5 minutes to check it out.

Best,
Euntae
```

---

## PART 7: 주의사항

### Reddit 계정 관리
- 은태님 Reddit 계정의 Karma가 낮으면 먼저 2~3일 일반 답변으로 Karma 쌓기
- 각 서브레딧의 Self-promotion 규칙 확인 (대부분 10:1 규칙 — 10개 일반 글/답변당 1개 홍보성 글)
- 너무 많은 서브레딧에 같은 글 올리면 Cross-posting 스팸으로 처리됨

### LinkedIn 계정 관리
- 하루 Connection Request 한도: 약 100개 (하지만 20~30개가 안전)
- 너무 많은 메시지를 보내면 계정 제한 걸림
- 메시지마다 개인화 필수 — 복붙 감지됨

### 전체 원칙
1. **먼저 도움, 나중에 소개** — 모든 채널에서 이 순서를 지키세요
2. **복붙 금지** — 모든 답변/DM은 그 사람 상황에 맞게 수정
3. **거절 당해도 계속** — 10명 중 1~2명만 반응해도 성공
4. **기록 필수** — 추적 시트에 매일 기록. 패턴이 보이기 시작함
5. **2주 후 판단** — 그 전에 "안 되나?" 하고 포기하지 말 것

---

## Quick Start — 내일 아침 바로 시작

1. **LinkedIn 프로필 수정** (15분) — Headline + About 섹션 위 템플릿대로 변경
2. **Reddit 로그인** → r/shopify, r/ecommerce 구독 → "duties" 검색 → 최근 글 3개에 답변
3. **LinkedIn 검색** → "cross-border ecommerce Shopify" → 10명에게 Connection Request
4. **저녁에 스프레드시트 만들기** → PART 4 추적 시트 형식대로 Google Sheets 생성

이게 전부예요. 화려한 게 아니라 매일 90분, 2주. 이게 첫 5명의 진짜 사용자를 만드는 방법이에요.
