# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-10 (Cowork 세션 5 — 프로젝트 전체 파악 + Paddle 라이브 수정 + 문서 교차검증)

---

## ⚠️ 이번 세션(Cowork 5)에서 완료된 사항

### 1. Paddle Billing 라이브 수정
- **Webhook Secret 수정** → Vercel 재배포 → 웹훅 정상 수신
- DB 수동 동기화: sellers 테이블에 billing_customer_id, billing_subscription_id, subscription_status, plan_id 업데이트
- Paddle Customer Portal: 고객명 "Jang Eun" + locale "en" 설정
- Manage Subscription 버튼: `window.open` (새 탭)으로 변경
- **14일 무료체험**: 6개 Price 모두 trial_period 14일 + requires_payment_method 설정
- **VAT 외부 처리**: 6개 Price 모두 tax_mode "external" (VAT-exclusive)

### 2. MIN 임포트 완료 확인
- **112,935,450행, 53개국 전체 완료** ✅
- session-context.md, CLAUDE.md, .cursorrules 업데이트 완료

### 3. AGR 임포트 스크립트 생성 + 실행
- `import_agr_all.py` + `run_agr_loop.sh` 생성
- Mac에서 실행 시작 (ARE 2M행 완료, ARG 진행 중)

### 4. 기능 상태 전수 조사
- 33개 기능 중 8개가 이미 구현되어 있음을 확인:
  - #3 이미지 HS 분류, #6 제한물품, #7 통관서류, #8 DDP 체크아웃
  - #9 다중통화, #12 원산지 감지, #13 관세 알림, #14 AI 에이전트 SDK
- session-context.md 33개 기능 테이블 업데이트

### 5. 문서 교차검증 + 불일치 수정
- `.cursorrules`: MIN 완료 반영, Shopify 심사 제출 완료 반영, macmap_min_rates 수치 업데이트
- `NEXT_SESSION_START.md`: 전면 재작성 (이 파일)
- `CLAUDE.md`: MIN 완료, 테이블 수치 업데이트

---

## 현재 진행 중인 백그라운드 작업

### AGR 관세율 임포트 (Mac)
```bash
# 진행 확인
tail -5 ~/portal/agr_import.log
cat ~/portal/agr_import_progress.json
```
- 144M행, 53개국, ~15시간 예상
- 스크립트: import_agr_all.py + run_agr_loop.sh
- progress 파일로 이어받기 가능

### WDC 상품명 추출 (AGR 완료 후)
```bash
cd ~/portal && nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &
```
- ⚠️ AGR 완료 후 실행 (동시 실행 금지)

---

## 다음 세션 우선순위

### 🔴 즉시 (코드 변경 필요)
1. **DDP Checkout Stripe→Paddle 전환** — `app/lib/checkout/stripe-checkout.ts`가 아직 Stripe API 사용 중. Paddle로 전환 필요
2. **WooCommerce 플러그인 완성** — `plugins/woocommerce/` 기본 코드만 있음. WordPress 설치 후 테스트 필요
3. **BigCommerce/Magento 플러그인** — `plugins/bigcommerce/` (설치 스크립트만), `plugins/magento/` (빈 구조)

### 🟡 비즈니스/운영
4. **Shopify 앱 심사 상태 확인** — Partner Dashboard에서 확인
5. **Paddle Customer Portal E2E 확인** — 실제 구독 플로우 테스트
6. **AGR 임포트 완료 확인** → WDC 추출 실행

### 🟢 개발 (AGR/WDC 완료 후)
7. **lookup_duty_rate_v2() 검증** — MIN+AGR 4단계 폴백 통합 테스트
8. **반덤핑/상계관세 5단계 폴백** — lookup_duty_rate에 AD/CVD/SG 추가
9. **WDC 상품명→HS 매핑 파이프라인** — 5.95억 상품 데이터 처리

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live 전환 완료 + 14일 무료체험 + Overage 빌링. 단, **DDP Checkout은 아직 Stripe 코드**
- **요금제**: ✅ 전체 코드베이스 정리 완료
- **B2C 잔재**: ✅ 완전 정리
- **Git push**: Mac 터미널에서만 가능
- **터미널 작업**: 한 번에 하나만 (AGR 실행 중 WDC 동시 실행 금지)

---

## 33개 기능 현황 요약
- ✅ 구현 완료: #1~#9, #12~#14 (28개)
- ⏳ 계획/진행중: #10 WooCommerce, #11 BigCommerce/Magento
- 나머지: 세션 28 정의된 33개 중 대부분 완료. session-context.md "33개 기능" 테이블 참조

## Paddle 환경변수 (Live)
```
PADDLE_API_KEY=pdl_live_apikey_***REDACTED***
PADDLE_WEBHOOK_SECRET=***REDACTED***
PADDLE_ENVIRONMENT=production
PADDLE_PRICE_BASIC_MONTHLY=pri_01kkaxq0grevdgr3dgrx3fwvpx
PADDLE_PRICE_BASIC_ANNUAL=pri_01kkaxr28wf8bwmkx73myw9fya
PADDLE_PRICE_PRO_MONTHLY=pri_01kkaxrzdgvhn47ryqvjzfajbz
PADDLE_PRICE_PRO_ANNUAL=pri_01kkaxskn730atcdyrahs5t4zp
PADDLE_PRICE_ENTERPRISE_MONTHLY=pri_01kkaxt980j0s0aypv7nk0474k
PADDLE_PRICE_ENTERPRISE_ANNUAL=pri_01kkaxtxp8jjtfhxjwyqfz74rf
```
