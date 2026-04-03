# POTAL 다음 진행 체크리스트
> 2026-03-08 (세션 35) 기준 | session-context.md 기반 정리

---

## 1. 지금 진행 중
- [ ] **MIN 벌크 임포트 완료** — 현재 **92.3M행** (44개국 완료, 세션 35 스트리밍 방식 재개), 9개국 남음 (SGP, THA, TUN, TUR, TWN, UKR, URY, USA, VNM). Cowork VM에서 import_min_remaining.py 실행 중
- [ ] **WDC 350GB 다운로드** — Mac 터미널 PID 65774에서 nohup 실행 중. 외장하드 /Volumes/soulmaten/POTAL/wdc-products. 현황: 245/1,899 파일 (12.9%), ~3주 예상
- [ ] **MIN 완료 후 → AGR 벌크 임포트** — 148M행, 같은 스트리밍 방식으로 진행

## 2. 데이터 완료 후 즉시
- [ ] **lookup_duty_rate 5-stage fallback 검증** — MIN→AGR→NTLC→정부API→AI 순서로 관세율 조회 로직 테스트
- [x] ~~**session-context.md / CLAUDE.md 업데이트**~~ — ✅ 세션 34 완료
- [ ] **git push** (Mac 터미널에서) — 세션 34 변경사항 push 필요

## 3. 33개 기능 — 미구현 항목 (우선순위순)

### 빠르게 할 수 있는 것 (코드 수정 소규모) — ✅ 세션 34 완료
- [x] ~~**#12 원산지 자동 감지**~~ — ✅ AI 프롬프트 + types + GlobalCostEngine 수정. origin 미입력 시 AI가 브랜드/상품명에서 원산지 추정
- [x] ~~**#4 다국어 분류 50개+**~~ — ✅ AI 프롬프트에 50개+ 언어 명시적 지원 추가. 비영어 입력 → AI 폴백으로 자동 처리
- [x] ~~**#9 다중 통화 표시**~~ — ✅ 위젯에 Intl.NumberFormat 현지 통화 표시 추가. 총합 아래에 현지 통화 금액 자동 표시
- [x] ~~**#3 이미지 기반 HS 분류**~~ — ✅ classifyWithVision() + /api/v1/classify 엔드포인트 신규. GPT-4o-mini Vision + Claude 폴백

### 중간 규모 개발 — ✅ 세션 34 완료
- [x] ~~**#7 통관서류 자동생성**~~ — ✅ documents/ 모듈 + /api/v1/documents 엔드포인트. Commercial Invoice + Packing List 생성, HS코드 자동분류 포함
- [x] ~~**#6 제한 물품 검사**~~ — ✅ restrictions/ 모듈 + /api/v1/restrictions 엔드포인트. 30+ 보편적 규칙 + 국가별 특수규칙 (이슬람국가 돼지고기, 인도 소고기, EU CE, 호주 바이오시큐리티 등)
- [x] ~~**#13 관세 변동 알림**~~ — ✅ alerts/ 모듈 + /api/v1/alerts 엔드포인트 (GET/POST/DELETE). 셀러별 HS코드+국가 모니터링, webhook/email 알림
- [x] ~~**#14 AI 에이전트 프레임워크**~~ — ✅ agent-sdk/ 모듈 + /api/v1/agent 엔드포인트. OpenAI/Anthropic tool schema, 6개 tool 정의, batch 실행 지원
- [x] ~~**#5 관세율 DB 실시간 업데이트 자동화**~~ — ✅ updater/ 모듈 + /api/v1/admin/update-tariffs 엔드포인트. 7개 정부API 자동 fetch, top 50 HS코드, Cron/Make.com 연동용

### 큰 규모 개발 — ✅ 세션 34 완료
- [x] ~~**#8 체크아웃 통합 (DDP)**~~ — ✅ checkout/ 모듈 + /api/v1/checkout 엔드포인트. Stripe Checkout 연동, DDP 가격 계산(관세+VAT+수수료), quote 모드 지원
- [x] ~~**#10 WooCommerce 플러그인**~~ — ✅ plugins/woocommerce/potal-landed-cost/ 완성. Admin 설정, 위젯 자동삽입, REST proxy, DDP cart fee, shortcode 지원
- [x] ~~**#11 BigCommerce/Magento**~~ — ✅ plugins/bigcommerce/ (Script Manager 설치 스크립트) + plugins/magento/Potal/LandedCost/ (Magento 2 모듈: admin config, block, template, helper)

## 4. 비즈니스 / 런치

### 결제 서비스 (LemonSqueezy 거절 → 대안 필요)
- ❌ **LemonSqueezy 거절** (신원 확인 실패) — 세션 35 결정 대기
- [ ] **Paddle 전환 옵션** — LK-based, EU GDPR 준수, LemonSqueezy보다 기능 풍부. 계정 생성 → Product 생성 → Webhook 설정
  - 또는 **Stripe 계속 사용** — 기존 계정 유지 (SCA 완성도 높음)
  - 은태님 의사결정 후 진행
- [ ] Dashboard 설정 — Currency: KRW → USD, Contact email → contact@potal.app
- [ ] Product 3개 생성 — Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
- [ ] Variant/Price ID → Vercel 환경변수 업데이트
- [ ] Webhook 설정 (Dashboard → webhook URL)
- [ ] **코드 내 요금제 숫자 전체 업데이트** — plan-checker/pricing/dashboard/i18n 등

### Shopify
- [ ] **심사 전 필수 수정 (세션 35 발견)** — 세션 35에서 코드 리뷰 결과 5개 문제점 발견:
  - [ ] HMAC 서명 검증 미완료 (security risk)
  - [ ] console.log 6개 제거 (프로덕션 금지)
  - [ ] GDPR 웹훅 미완료 (shop/redact, customer/redact, data_request 처리)
  - [ ] error.ts Shopify UI 호출 미구현
  - [ ] 에러 처리 부실 (try-catch 추가)
- [ ] 임베디드 앱 확인 통과 (Partner Dashboard)
- [ ] "검토를 위해 제출" 클릭 (심사 7~14일)

### 기타
- [x] ~~**RapidAPI 유료 구독 전부 취소**~~ — ✅ 완료
- [x] ~~RapidAPI 환불 (#130604)~~ — ✅ 완료

## 5. LLM 플랫폼 (대기 중)
- [ ] **Copilot** — Microsoft 365 Business 계정 필요
- [ ] **Meta AI** — 지역 제한 풀리면 즉시 등록
- [ ] **Grok** — 커스텀 앱 스토어 출시 시 진입

## 6. 장기
- [ ] 투자자 피치 원페이저 PDF
- [ ] 글로벌 확장 (US 시장 장악 후)
