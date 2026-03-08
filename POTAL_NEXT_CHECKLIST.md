# POTAL 다음 진행 체크리스트
> 2026-03-08 기준 | session-context.md 기반 정리

---

## 1. 지금 진행 중 (자동)
- [ ] **MIN 벌크 임포트 완료** — 현재 ~92M/130M행, 11개국 남음 (PID 88903)
- [ ] **MIN 완료 후 → AGR 벌크 임포트** — 148M행, 같은 방식으로 진행

## 2. 데이터 완료 후 즉시
- [ ] **lookup_duty_rate 5-stage fallback 검증** — MIN→AGR→NTLC→정부API→AI 순서로 관세율 조회 로직 테스트
- [ ] **session-context.md / CLAUDE.md / .cursorrules 최종 업데이트** — MIN/AGR 완료 수치 반영
- [ ] **git push** (Mac 터미널에서)

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

### LemonSqueezy (신원 확인 승인 후)
- [ ] LS Dashboard 설정 — Currency: KRW → USD, Contact email → contact@potal.app
- [ ] LS Product 3개 생성 — Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
- [ ] Variant ID → Vercel 환경변수 업데이트
- [ ] Webhook 설정 (LS Dashboard → webhook URL)
- [ ] **코드 내 요금제 숫자 전체 업데이트** — plan-checker/pricing/dashboard/i18n 등

### Shopify
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
