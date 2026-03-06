# POTAL × LemonSqueezy 설정 가이드

> Stripe 계정 정지로 인해 LemonSqueezy로 전환 (2026-03-06, 세션 26)
> LemonSqueezy = Merchant of Record (MoR). ITIN/SSN 불필요. 수수료 5% + $0.50

## 1단계: Supabase 마이그레이션

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 파일: supabase/migrations/005_billing_provider.sql
-- 위 파일 전체 내용을 복사하여 실행
```

## 2단계: LemonSqueezy 계정 설정

1. **가입**: https://lemonsqueezy.com → Sign Up
2. **신원 확인**: Settings → Identity Verification → 정부 ID 사진 업로드
3. **세금 양식**: Settings → Tax Information → W-8 BEN 제출 (한국 주소 입력, ITIN 불필요)

## 3단계: Product 생성

LemonSqueezy Dashboard → Products → Create Product:

| Product | Price | Billing | Notes |
|---------|-------|---------|-------|
| POTAL Starter | $9/month | Recurring (Monthly) | 5,000 API calls/month |
| POTAL Growth | $29/month | Recurring (Monthly) | 25,000 API calls/month |
| POTAL Enterprise | Custom | Recurring (Monthly) | Unlimited, 별도 협의 |

각 Product 생성 후 → Variant ID 복사 (URL에서 확인 가능)

## 4단계: Webhook 설정

LemonSqueezy Dashboard → Settings → Webhooks → Create Webhook:

- **URL**: `https://www.potal.app/api/billing/webhook`
- **Secret**: 자동 생성된 시크릿 복사
- **Events 선택**:
  - ✅ subscription_created
  - ✅ subscription_updated
  - ✅ subscription_cancelled
  - ✅ subscription_expired
  - ✅ subscription_payment_success
  - ✅ subscription_payment_failed

## 5단계: API Key 생성

LemonSqueezy Dashboard → Settings → API Keys → Create API Key

## 6단계: 환경변수 설정

### .env.local (로컬 개발)

```bash
# LemonSqueezy
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_VARIANT_STARTER=your_starter_variant_id
LEMONSQUEEZY_VARIANT_GROWTH=your_growth_variant_id
LEMONSQUEEZY_VARIANT_ENTERPRISE=your_enterprise_variant_id
```

### Vercel 환경변수

Vercel Dashboard → Project Settings → Environment Variables:

1. **삭제**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
2. **추가**: 위 6개 LemonSqueezy 변수

## 7단계: 배포 및 테스트

```bash
# Mac 터미널에서
cd ~/portal
git add . && git commit -m "billing: Stripe → LemonSqueezy 전환"
git push origin main
```

Vercel 자동 배포 후 테스트:

1. Dashboard → Billing 탭 → "Start 14-Day Free Trial" 클릭
2. LemonSqueezy 체크아웃 페이지에서 테스트 결제
3. 웹훅 수신 확인 (LemonSqueezy Dashboard → Webhooks → Recent Events)
4. Supabase → sellers 테이블에서 `billing_customer_id`, `billing_subscription_id` 업데이트 확인
5. Dashboard에서 "Manage Subscription" 버튼 → Customer Portal 접근 확인

## 테스트 카드

LemonSqueezy Test Mode:
- **성공**: `4242 4242 4242 4242`
- **실패**: `4000 0000 0000 0002`
- **만료**: 아무 미래 날짜, CVC 아무 3자리

## 참고: Stripe에서 마이그레이션

| 항목 | Stripe | LemonSqueezy |
|------|--------|-------------|
| SDK | `stripe` | `@lemonsqueezy/lemonsqueezy.js` |
| 초기화 | `new Stripe(key)` | `lemonSqueezySetup({ apiKey })` |
| 상품 ID | Price ID (`price_xxx`) | Variant ID (숫자) |
| 체크아웃 | `checkout.sessions.create()` | `createCheckout()` |
| 웹훅 검증 | `constructEvent()` | HMAC SHA-256 |
| 포탈 | `billingPortal.sessions.create()` | `subscription.urls.customer_portal` |
| 구독 상태 | `trialing, active, ...` | `on_trial, active, ...` |
| 구독 취소 | `subscriptions.update()` | `cancelSubscription()` |
