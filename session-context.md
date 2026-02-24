# POTAL Session Context
> 마지막 업데이트: 2026-02-24 (음성 검색 기능 추가 완료)

## 현재 상태 요약

POTAL은 여러 쇼핑몰에서 상품을 검색/비교하는 가격비교 서비스.
**현재 5개 RapidAPI 기반 provider만 활성화** (직접 상품 URL 제공).
Serper Google Shopping 기반 17개 provider는 2026-02-24 Coordinator에서 제거됨 (코드 파일은 남아있음).

---

## 오늘 (2026-02-24) 작업 요약

### 1. Serper 17개 provider 제거 ✅
- Coordinator.ts에서 Serper 관련 코드 전부 제거 (imports, instances, fetchFromProviders 내 카테고리 필터링)
- 5개 RapidAPI provider만 유지: Amazon, Walmart, eBay, Target, AliExpress
- TypeScript 빌드 에러 0개 확인
- 커밋: `9ea57b3` — push 완료

### 2. 음성 검색 (마이크) 기능 추가 ✅
- **`app/hooks/useVoiceSearch.ts`** (신규) — Web Speech API 기반 커스텀 훅, 비용 $0
- **`components/icons.tsx`** — `Microphone` SVG 아이콘 추가
- **`components/home/SearchWidget.tsx`** — 홈 검색창에 마이크 버튼 (모바일+데스크톱)
- **`components/search/StickyHeader.tsx`** — 검색결과 페이지에도 마이크 버튼 (모바일+데스크톱)
- 동작: 🎤 클릭 → 브라우저 마이크 권한 → 빨간색 펄스 → 음성 인식 → 검색창에 텍스트 자동 입력
- 지원: Chrome/Edge 완벽, Safari 기본, Firefox 미지원 (마이크 버튼 숨김)
- TypeScript 빌드 에러 0개 확인
- **아직 미커밋**

### 3. RapidAPI 환불 요청 메시지 작성 ✅
- Best Buy developer, Shein developer, RapidAPI 지원센터 → `rapidapi-refund-messages.md`
- 사용자가 이미 메일 발송 완료

### 4. Rakuten Publisher 프로필 이슈
- SID: 4654560 — "Complete company details" 미완료 상태
- 상담원(Madhu)이 쿠키/캐시 삭제 제안 → 시크릿 모드에서도 동일 문제
- 스크린샷 첨부하여 답장 발송 완료 (Case #390705)
- **대기 중**: Rakuten 내부 팀이 직접 해결해야 함

---

## Provider 현황

### 활성 (RapidAPI 기반 — 직접 상품 URL 제공, Coordinator에서 호출)
| Provider | API | 상태 |
|----------|-----|------|
| Amazon | RapidAPI (`real-time-amazon-data`) | ✅ 정상 |
| Walmart | RapidAPI (`realtime-walmart-data`) | ✅ 정상 |
| eBay | RapidAPI PRO (`real-time-ebay-data`) | ✅ 정상 |
| Target | RapidAPI (`target-com-shopping-api`) | ✅ 정상 |
| AliExpress | RapidAPI (`aliexpress-data`) | ✅ 정상 |

### 제거됨 (2026-02-24, Serper Google Shopping — 상품 URL 문제)
| Provider | 제거 이유 |
|----------|----------|
| Temu, Best Buy, Home Depot, Lowe's, Nordstrom, IKEA, Wayfair, Newegg, Sephora, Etsy, Mercari, iHerb, Shein, ASOS, Farfetch, YesStyle, MyTheresa | Serper Shopping API가 Google 리다이렉트 URL만 반환 → 실제 상품 페이지 연결 불가. 코드 파일은 `providers/` 폴더에 남아있음 (향후 직접 API 확보 시 재활용 가능) |

---

## 검색 기능 현황

| 기능 | 상태 | 파일 |
|------|------|------|
| 텍스트 검색 | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx |
| 사진 검색 (Vision API) | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx, `/api/search/analyze` |
| 음성 검색 (마이크) | ✅ 신규 | `useVoiceSearch.ts`, SearchWidget.tsx, StickyHeader.tsx |
| 최근 검색어 | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx |
| ZIP 코드 입력 | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx |

---

## Serper 기반 Provider의 근본 문제

### 문제
Serper Shopping API는 Google Shopping 결과를 반환하는데, **상품 URL이 Google 리다이렉트 URL**이라서 실제 상품 페이지로 직접 연결이 안 됨.

### 시도한 해결책들 (전부 불완전)
1. **2단계 Web Search**: Shopping API → Web Search(`site:domain "title"`)로 실제 URL 찾기
   - 결과: provider당 2개만 해석 가능. 나머지는 Google 검색 fallback
2. **RequestThrottler (5/sec) + 429 재시도**: rate limit 관리
   - 결과: 429 에러는 해결했지만 근본 문제 아님
3. **Early-release deadline**: 시간 초과 시 throttler 슬롯 즉시 반환
   - 결과: timeout 문제 해결했지만 근본 문제 아님
4. **directUrlLimit = 2, products = limit**: 해석 가능한 수만큼만 반환
   - 결과: fallback URL 제거는 됐지만 상품 수가 너무 적음
5. **5분 캐시**: 같은 쿼리 반복 시 API 호출 안 함
   - 결과: 크레딧 절약에는 도움
6. **카테고리 기반 사전 필터링**: 쿼리→카테고리 분류 → 관련 provider만 호출
   - 결과: 크레딧 절약에는 도움이지만 상품 URL 문제의 근본 해결 아님

### 결론
**Serper Shopping API를 통한 2단계 URL 해석 방식 자체가 한계**가 있음.
각 쇼핑몰의 자체 API 또는 RapidAPI에서 직접 상품 URL을 제공하는 API로 전환해야 함.

---

## Temu Provider — 전체 시도 히스토리

### 배경
Temu는 POTAL에서 가장 처음 추가하려던 provider인데, **한 번도 제대로 작동한 적이 없음**.
유일하게 Apify만 잠깐 동작했다가 차단됨.

### 시도한 방법들 (전부 실패)

| # | 방법 | 결과 | 상세 |
|---|------|------|------|
| 1 | **Apify Actor** (`amit123/temu-products-scraper`) | ❌ 차단됨 | 유일하게 잠깐 동작했으나 2026-02-18부터 Temu 서버 403 차단. 빌드 v1.0.32~v1.0.37 전부 실패 |
| 2 | **RapidAPI Temu Shopping API** | ❌ 호출 안 됨 | RapidAPI에서 제공하는 Temu 전용 API 테스트했으나 호출 자체가 안 됨 |
| 3 | **Apify Temu Listings Scraper** | ❌ 호출 안 됨 | 다른 Apify Actor도 시도했으나 마찬가지 |
| 4 | **Serper organic search** (`site:temu.com`) | ❌ 가격 없음 | 링크는 나오지만 가격 데이터가 snippet에 없어서 사용 불가 |
| 5 | **Serper Shopping** (`query + "temu"`) | ❌ URL 문제 | 상품/가격은 나오지만 링크가 Google 리다이렉트. 실제 Temu 상품 페이지로 안 감 |
| 6 | **Scrapeless** (scraper.temu + webunlocker) | ❌ 호출 안 됨 | 테스트 스크립트 작성했으나 실패 |
| 7 | **Google &btnI 리다이렉트** | ❌ 서버사이드 안 됨 | 302 대신 200 반환 |

### 현재 상태
- Serper Shopping 기반 TemuProvider 코드는 있지만, **실제 사용자에게 동작하는 Temu 상품은 0개**
- Temu Individual Affiliate 신청한 상태 (승인 대기)

### 남은 가능성
1. **Temu Affiliate Program API** — 승인되면 REST API + 상품 데이터 피드 + 딥링크 사용 가능
   - URL: https://partner-eu.temu.com/documentation
   - 상태: 승인 대기 중
2. **새로운 RapidAPI/Apify Actor** — 시간이 지나면서 새로운 API가 나올 수 있음. 주기적 확인 필요
3. **Temu가 공식 API 오픈** — 현재는 없지만 장기적으로 가능성 있음

---

## 시도하지 말아야 할 것들

| 방법 | 왜 안 되는지 |
|------|-------------|
| Apify Actor `amit123/temu-products-scraper` | Temu 403 차단 (2026-02-18~) |
| RapidAPI Temu Shopping API | 호출 자체가 안 됨 (이미 테스트 완료) |
| Apify Temu Listings Scraper | 호출 안 됨 (이미 테스트 완료) |
| Scrapeless (scraper.temu, webunlocker) | 호출 안 됨 (이미 테스트 완료) |
| Serper organic search (`site:temu.com`) | 가격 데이터 미포함 |
| Serper Shopping → Web Search 2단계 (Temu) | URL이 Google 리다이렉트, 실제 상품페이지 안 감 |
| Google &btnI 리다이렉트 | 서버사이드에서 안 됨 (302 아닌 200 반환) |
| directUrlLimit 5개 이상 | 13 providers × 5 = 65 web searches → timeout |

---

## RapidAPI 구독 현황

### 활성 (사용 중)
| API | 플랜 | 비용 | 상태 |
|-----|------|------|------|
| Real-Time Amazon Data | - | - | ✅ 사용 중 |
| Realtime Walmart Data | - | - | ✅ 사용 중 |
| Real-Time eBay Data | PRO | $10/mo | ✅ 사용 중 (`real-time-ebay-data.p.rapidapi.com`) |
| Target COM Shopping API | - | - | ✅ 사용 중 |
| AliExpress Data | - | - | ✅ 사용 중 |

### 환불 요청 (메일 발송 완료)
| API | 문제 | 상태 |
|-----|------|------|
| Best Buy (bestbuy-usa.p.rapidapi.com) | 500 에러 | 환불 요청 메일 발송 완료 |
| Unofficial Shein (unofficial-shein.p.rapidapi.com) | 500 에러 | 환불 요청 메일 발송 완료 |
| eBay Search Result (BASIC) | 빈 결과 반환, 미사용 | BASIC 구독 해지 필요 (PRO만 사용) |

---

## 현재 코드 구조 (핵심 파일)

```
app/
├── hooks/
│   ├── useVoiceSearch.ts        # 🎤 음성 검색 훅 (Web Speech API, $0)
│   ├── useProductSearch.ts      # 상품 검색 훅
│   ├── useUserPreferences.ts    # 사용자 설정
│   └── useWishlist.ts           # 위시리스트
├── lib/
│   ├── agent/
│   │   ├── Coordinator.ts       # 전체 검색 파이프라인 (5개 RapidAPI provider만 호출)
│   │   ├── QueryAgent.ts        # 검색어 분석
│   │   └── AnalysisAgent.ts     # 상품 분석
│   └── search/
│       ├── providers/
│       │   ├── AmazonProvider.ts          # RapidAPI ✅ 활성
│       │   ├── WalmartProvider.ts         # RapidAPI ✅ 활성
│       │   ├── EbayProvider.ts            # RapidAPI ✅ 활성
│       │   ├── TargetProvider.ts          # RapidAPI ✅ 활성
│       │   ├── AliExpressProvider.ts      # RapidAPI ✅ 활성
│       │   ├── SerperShoppingProvider.ts  # ⛔ 비활성 (Coordinator에서 미사용)
│       │   └── ... (17개 Serper provider) # ⛔ 비활성 (코드만 남아있음)
│       ├── FraudFilter.ts
│       ├── CostEngine.ts
│       └── ScoringEngine.ts
components/
├── home/
│   └── SearchWidget.tsx          # 홈 검색 (텍스트 + 사진 + 🎤음성)
├── search/
│   └── StickyHeader.tsx          # 검색결과 헤더 (텍스트 + 사진 + 🎤음성)
└── icons.tsx                     # SVG 아이콘 (Microphone 추가)
```

---

## 외부 서비스 대기 현황

| 서비스 | 상태 | 다음 단계 |
|--------|------|----------|
| Temu Affiliate Program | 승인 대기 중 | 승인되면 API 문서 분석 → TemuProvider 구현 |
| Rakuten Publisher (SID: 4654560) | Case #390705 답변 대기 | "Complete company details" 이슈 Rakuten 내부 해결 대기 |
| RapidAPI Best Buy 환불 | 메일 발송 완료 | 답변 대기 |
| RapidAPI Shein 환불 | 메일 발송 완료 | 답변 대기 |

---

## TODO

- [ ] 음성 검색 커밋 + push
- [ ] Temu Affiliate 승인 확인 → 승인되면 API 문서 분석 후 구현
- [ ] Rakuten Case #390705 답변 확인
- [ ] RapidAPI Best Buy/Shein 환불 답변 확인
- [ ] eBay BASIC 구독 해지 (PRO만 사용)
- [ ] 새로운 Temu API가 나오는지 주기적 확인
- [ ] Serper 기반 나머지 provider들도 대안 API 조사

---

## Serper API 정보 (참고용 — 현재 미사용)

- **키**: SERPER_API_KEY (환경변수)
- **상태**: Coordinator에서 제거됨 (2026-02-24). 코드 파일만 남아있음
- **제거 이유**: Google 리다이렉트 URL만 반환 → 실제 상품 페이지 연결 불가
- **크레딧**: 무료 tier 2,500 거의 소진됨

---

## Git 상태

- `9ea57b3` — Serper 17개 provider 제거 (push 완료)
- 음성 검색 기능 변경사항 **미커밋** (useVoiceSearch.ts, SearchWidget.tsx, StickyHeader.tsx, icons.tsx)
