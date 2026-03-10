# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-10 (Cowork 세션 5 — DDP Stripe→Quote, 플러그인 3종 완성, Dashboard UI 통일)

---

## ⚠️ 이번 세션(Cowork 5)에서 완료된 사항

### 1. DDP Checkout Stripe→Quote 전환
- `stripe-checkout.ts` → `ddp-session.ts` 리네임
- Stripe API 코드 전면 제거, Quote-only 방식 (셀러 자체 결제 연동)
- types.ts에서 stripeSessionId/checkoutUrl 제거
- checkout/route.ts Quote-only 재작성

### 2. 이커머스 플러그인 3종 완성
- **WooCommerce**: HPOS 호환, 캐싱, sanitize, i18n, Connection Test, uninstall.php
- **BigCommerce**: DDP 장바구니 통합 (Storefront API → POTAL Quote)
- **Magento**: layout XML (위젯 자동삽입), ACL, composer.json

### 3. Dashboard UI 통일
- Header: 대시보드에서도 메인 헤더 표시 (DEVELOPERS/PRICING/DASHBOARD/HELP)
- Footer: 대시보드에서도 푸터 표시
- 전체 1440px max-width 통일
- 유저 메뉴 드롭다운에 Docs 링크 추가
- DashboardContent 자체 Top Bar(로고/이메일/플랜/Docs/SignOut) 제거

### 4. MIN 임포트 완료 확인
- 53개국 ~113M행 전체 완료 ✅
- 남은 9개국 모두 "이미 완료, 건너뜀" 확인

### 5. AGR 임포트 시작
- `import_agr_all.py` + `run_agr_loop.sh` Mac 백그라운드 실행
- ARE 완료, AUS 진행중 (~14시간 예상)

### 6. WDC 다운로드 완료 확인
- 외장하드 1,903파일 (extracted + raw 폴더)

### 7. Git Push 2회
- 6b9e0be: DDP + 플러그인 (15 files, +467/-291)
- 3b3e0cb: Dashboard UI (4 files, +16/-77)

---

## 현재 진행 중인 백그라운드 작업

### AGR 관세율 임포트 (Mac)
```bash
# 진행 확인
tail -5 ~/portal/agr_import.log
cat ~/portal/agr_import_progress.json
```
- ~144M행, 53개국, ~14시간 예상
- 스크립트: import_agr_all.py + run_agr_loop.sh
- progress 파일로 이어받기 가능
- ⚠️ 완료 전까지 다른 대량 작업 금지

---

## 다음 세션 우선순위

### 🔴 즉시 (AGR 완료 후)
1. **AGR 임포트 완료 확인** → Supabase macmap_agr_rates 행 수 확인
2. **WDC 상품명 추출 실행**:
   ```bash
   cd ~/portal && nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &
   ```
3. **상품명→HS 코드 매핑 파이프라인** — WDC 5.95억 상품 데이터에서 상품명+카테고리 추출 후 HS 매핑

### 🟡 비즈니스/운영
4. **Shopify 앱 심사 상태 확인** — Partner Dashboard에서 확인
5. **lookup_duty_rate_v2() 검증** — MIN+AGR 4단계 폴백 통합 테스트
6. **반덤핑/상계관세 5단계 폴백** — lookup_duty_rate에 AD/CVD/SG 추가

### 🟢 개발 (장기)
7. **HS Code DB 확장** — WDC 상품명 매핑으로 Avalara 3,000만+ 대응
8. **플러그인 실제 환경 테스트** — WooCommerce/BigCommerce/Magento 설치 후 E2E

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live 완료 + Overage 빌링 + DDP Quote-only (Stripe 제거)
- **요금제**: ✅ 전체 코드베이스 정리 완료 (Free/Basic/Pro/Enterprise)
- **33개 기능**: ✅ 전부 구현 완료
- **Git push**: Mac 터미널에서만 가능
- **터미널 작업**: 한 번에 하나만 (AGR 실행 중 WDC 동시 실행 금지)
- **Dashboard UI**: 메인 헤더/푸터가 대시보드에도 표시됨 (DashboardContent 자체 Top Bar 없음)

---

## 파일 변경 목록 (Cowork 5)

### 수정된 파일 (11개)
1. `app/lib/checkout/ddp-session.ts` (구 stripe-checkout.ts에서 리네임+재작성)
2. `app/lib/checkout/types.ts`
3. `app/lib/checkout/index.ts`
4. `app/api/v1/checkout/route.ts`
5. `plugins/woocommerce/potal-landed-cost/potal-landed-cost.php`
6. `plugins/bigcommerce/potal-widget-installer.js`
7. `components/layout/Header.tsx`
8. `components/layout/Footer.tsx`
9. `app/dashboard/DashboardContent.tsx`
10. `app/dashboard/page.tsx`
11. 문서 5개 (session-context.md, .cursorrules, CLAUDE.md, CHANGELOG.md, NEXT_SESSION_START.md)

### 신규 파일 (4개)
1. `plugins/woocommerce/potal-landed-cost/uninstall.php`
2. `plugins/magento/Potal/LandedCost/view/frontend/layout/catalog_product_view.xml`
3. `plugins/magento/Potal/LandedCost/etc/acl.xml`
4. `plugins/magento/Potal/LandedCost/composer.json`

### 삭제된 파일 (1개)
1. `app/lib/checkout/stripe-checkout.ts` (ddp-session.ts로 리네임)

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
