# POTAL — Stripe 빌링 설정 가이드

## 완료된 코드 작업

| 파일 | 설명 |
|------|------|
| `app/lib/billing/stripe.ts` | Stripe 싱글톤 + 플랜 설정 |
| `app/lib/billing/subscription.ts` | 구독 라이프사이클 관리 |
| `app/api/billing/checkout/route.ts` | Checkout 세션 생성 |
| `app/api/billing/webhook/route.ts` | Stripe Webhook 핸들러 |
| `app/api/billing/portal/route.ts` | Customer Portal |
| `app/dashboard/page.tsx` | Billing 탭 (플랜 카드 + 업그레이드 버튼) |
| `supabase/migrations/004_stripe_billing.sql` | DB 마이그레이션 |

---

## Step 1: Supabase 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 실행:

```sql
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_sellers_stripe_customer_id
ON public.sellers(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sellers_stripe_subscription_id
ON public.sellers(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;
```

---

## Step 2: Stripe 대시보드에서 Product 생성

### 2-1. Growth Plan

1. Stripe Dashboard → **Products** → **+ Add product**
2. Name: `POTAL Growth`
3. Price: `$49.00` / month (recurring)
4. **Price ID를 복사** (예: `price_1Qxxx...`)

### 2-2. Enterprise Plan (선택)

1. Name: `POTAL Enterprise`
2. Price: Custom (예: `$299.00` / month)
3. **Price ID를 복사**

---

## Step 3: Webhook 설정

1. Stripe Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**
2. Endpoint URL: `https://potal-x1vl.vercel.app/api/billing/webhook`
3. Events 선택:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Webhook Secret을 복사** (예: `whsec_xxx...`)

---

## Step 4: 환경변수 추가 (Vercel)

Vercel Dashboard → Settings → Environment Variables에 추가:

```
STRIPE_SECRET_KEY=sk_live_xxx...     (또는 sk_test_xxx)
STRIPE_WEBHOOK_SECRET=whsec_xxx...
STRIPE_PRICE_GROWTH=price_xxx...
STRIPE_PRICE_ENTERPRISE=price_xxx... (Enterprise 플랜 사용 시)
```

> **참고**: 기존에 이미 설정된 변수:
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `SUPABASE_SERVICE_ROLE_KEY`
> - `NEXT_PUBLIC_APP_URL` (= `https://potal-x1vl.vercel.app`)

---

## Step 5: Customer Portal 설정

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**
2. 활성화할 기능:
   - ✅ Update payment method
   - ✅ View invoice history
   - ✅ Cancel subscription
   - ✅ Switch plan (Growth ↔ Enterprise)
3. **Save**

---

## Step 6: 배포 & 테스트

```bash
# Vercel 재배포 (환경변수 적용)
vercel --prod

# 또는 Vercel Dashboard에서 Redeploy
```

### 테스트 순서:

1. `/dashboard` → Billing 탭 접속
2. Growth 플랜 "Start 14-Day Free Trial" 클릭
3. Stripe Checkout 페이지에서 테스트 카드 입력:
   - 카드: `4242 4242 4242 4242`
   - 만료: 아무 미래 날짜
   - CVC: 아무 3자리
4. 체크아웃 완료 → 대시보드로 리다이렉트
5. Webhook이 DB 업데이트 확인 (Supabase에서 sellers 테이블 확인)
6. "Manage Subscription" → Stripe Customer Portal 접속 확인

---

## 빌링 흐름 요약

```
Seller Dashboard (Billing tab)
  ↓ "Start 14-Day Free Trial" 클릭
POST /api/billing/checkout
  ↓ Stripe Checkout Session 생성
Stripe Checkout Page (결제 정보 입력)
  ↓ 완료
checkout.session.completed webhook
  ↓ Supabase sellers 테이블 업데이트
Dashboard redirect (?checkout=success)
  ↓ 14일 후
customer.subscription.updated (trialing → active)
  ↓ 매달
invoice.payment_succeeded webhook
  ↓ 실패 시
invoice.payment_failed → past_due 상태
```
