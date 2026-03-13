# Private Beta Launch Checklist — 3/17 (D-5)
> 2026-03-13 03:30 KST

---

## ✅ 코드 준비 완료
- [x] 42/42 기능 코드 구현 (스프린트 20-Task 완료)
- [x] npm run build 0 errors
- [x] API E2E 10/10 pass
- [x] 8개 엔드포인트 정상
- [x] Cron 10/11 정상
- [x] Paddle 6 Live Prices
- [x] Auth/보안 점검
- [x] i18n 50개 언어
- [x] 분류기 86%
- [x] git push 완료 (fa757f5)

---

## 🔲 Beta 런칭 전 은태님 액션 (코드 아님)

### 3/13-14 (오늘-내일)
- [ ] **Beta 가입 페이지 확인** — https://www.potal.app 접속해서 가입 플로우 직접 테스트
- [ ] **API 키 발급 테스트** — 대시보드에서 API 키 발급 → curl로 테스트 호출
- [ ] **Beta 테스터 리스트 작성** — 지인 셀러 2-3명 연락처 (Shopify/WooCommerce 사용자)
- [ ] **Beta 초대 이메일 작성** — 아래 초안 참고
- [ ] **PH 프로모 코드 설정** — Paddle에서 "PRODUCTHUNT" 쿠폰 생성 (Basic 3개월 무료)
- [ ] **Crisp 채팅 위젯 활성화** — NEXT_PUBLIC_CRISP_WEBSITE_ID 환경변수에 값 넣기

### 3/15-16 (주말)
- [ ] **Beta 테스터에게 초대 발송**
- [ ] **피드백 수집 채널 준비** — Crisp 채팅 or Google Form or 간단한 이메일
- [ ] **최종 프로덕션 모니터링** — Morning Brief 이메일 수신 확인

### 3/17 (월) — Beta 시작
- [ ] **Beta 테스터 가입 확인**
- [ ] **첫 API 호출 확인** — 대시보드에서 사용량 표시
- [ ] **피드백 수집 시작**

---

## 🔲 Product Hunt 3/24 준비

### 에셋 (✅ 완료)
- [x] Thumbnail 240x240 — thumbnail-240x240.png
- [x] Gallery 4장 — hero, dashboard, integrations, pricing
- [x] Tagline 3개 후보
- [x] Description 260자
- [x] First Comment 초안
- [x] Tags: Developer Tools, E-Commerce, SaaS

### PH 런치 전 할 일 (3/17-23)
- [ ] **Product Hunt 계정 확인** — producthunt.com 로그인
- [ ] **Coming Soon 페이지 등록** — 런치 전 미리 관심 수집
- [ ] **Launch date 예약** — 3/24 (화) 00:01 PST
- [ ] **Maker 프로필 업데이트** — 사진, bio, Twitter/X 연동
- [ ] **지인 네트워크 알림** — "3/24에 PH 런칭합니다" 사전 공유
- [ ] **First Comment 최종 수정** — Beta 피드백 반영
- [ ] **PH exclusive 쿠폰 테스트** — "PRODUCTHUNT" 코드 Paddle에서 실제 작동 확인

---

## 📧 Beta 초대 이메일 초안

Subject: POTAL Private Beta — 크로스보더 관세 계산, 무료로 써보세요

---

안녕하세요 [이름]님,

해외 판매 시 관세/VAT/수수료를 자동 계산해주는 API 서비스 POTAL을 만들었습니다.

지금 Private Beta를 시작하는데, 실제 셀러분의 피드백이 필요해서 연락드렸습니다.

**POTAL이 하는 것:**
- 240개국 관세/VAT/통관수수료 실시간 계산
- Shopify 위젯 (상품 페이지에 "Total Landed Cost" 표시)
- REST API (월 100건 무료)

**Beta 혜택:**
- Basic 플랜($20/월) 3개월 무료
- 직접 피드백 채널 (수정 사항 즉시 반영)

가입: https://www.potal.app
API 문서: https://www.potal.app/developers

5분이면 테스트해볼 수 있습니다. 가입 후 대시보드에서 API 키 발급 → 아래 curl 한 줄이면 됩니다:

```
curl -X POST https://www.potal.app/api/v1/calculate \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productName":"Cotton T-Shirt","price":25,"origin":"CN","destination":"US"}'
```

감사합니다!
은태 드림
contact@potal.app

---

## 📧 Beta 초대 영문 버전

Subject: POTAL Private Beta — Calculate landed costs for free

Hi [Name],

I built POTAL — a Total Landed Cost API for cross-border e-commerce.

We're starting our Private Beta and I'd love your feedback as an active seller.

**What POTAL does:**
- Instant duty, VAT, customs fee calculation for 240+ countries
- Shopify widget (shows "Total Landed Cost" on product pages)
- REST API (100 calls/month free)

**Beta perks:**
- Basic plan ($20/mo) free for 3 months
- Direct feedback channel (we ship fixes same day)

Sign up: https://www.potal.app
API docs: https://www.potal.app/developers

Takes 5 minutes to test. Sign up → get API key → one curl command.

Best,
Euntae
contact@potal.app
