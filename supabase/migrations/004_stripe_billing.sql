-- 004: Add Stripe billing columns to sellers table
-- Run this in Supabase SQL Editor

-- Add current_period_end for subscription tracking
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index for Stripe customer lookup (webhook uses this)
CREATE INDEX IF NOT EXISTS idx_sellers_stripe_customer_id
ON public.sellers(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Index for Stripe subscription lookup
CREATE INDEX IF NOT EXISTS idx_sellers_stripe_subscription_id
ON public.sellers(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;
