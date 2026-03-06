-- ============================================
-- Migration 005: Stripe → LemonSqueezy 결제 전환
-- Date: 2026-03-06 (세션 26)
-- Reason: Stripe 계정 정지됨 → LemonSqueezy (MoR) 전환
-- ============================================

-- 1. 컬럼 이름 변경 (Stripe-specific → provider-agnostic)
ALTER TABLE public.sellers
  RENAME COLUMN stripe_customer_id TO billing_customer_id;

ALTER TABLE public.sellers
  RENAME COLUMN stripe_subscription_id TO billing_subscription_id;

-- 2. 결제 제공자 컬럼 추가
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS billing_provider TEXT DEFAULT 'lemonsqueezy';

-- 3. 기존 인덱스 삭제 + 새 인덱스 생성
DROP INDEX IF EXISTS idx_sellers_stripe_customer_id;
DROP INDEX IF EXISTS idx_sellers_stripe_subscription_id;

CREATE INDEX IF NOT EXISTS idx_sellers_billing_customer_id
  ON public.sellers(billing_customer_id)
  WHERE billing_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sellers_billing_subscription_id
  ON public.sellers(billing_subscription_id)
  WHERE billing_subscription_id IS NOT NULL;

-- 4. 기존 Stripe 데이터 정리 (테스트 데이터만 있으므로 NULL 처리)
UPDATE public.sellers
SET billing_customer_id = NULL,
    billing_subscription_id = NULL,
    billing_provider = 'lemonsqueezy'
WHERE billing_customer_id IS NOT NULL
  AND billing_customer_id LIKE 'cus_%';
