-- ============================================================
-- POTAL B2B Schema — Total Landed Cost Infrastructure
-- Migration 003: Core B2B tables
-- ============================================================
-- Tables: sellers, plans, api_keys, widget_configs, usage_logs
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ─── 1. Plans ──────────────────────────────────────────────
-- Subscription tiers: Starter $29, Growth $79, Enterprise $199+

CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,                          -- 'starter', 'growth', 'enterprise'
  name TEXT NOT NULL,                           -- Display name
  price_monthly INTEGER NOT NULL,               -- Price in cents (2900, 7900, 19900)
  max_products INTEGER NOT NULL,                -- Product limit (100, 500, -1=unlimited)
  max_calculations_monthly INTEGER NOT NULL,    -- Calc limit (5000, 25000, -1=unlimited)
  features JSONB DEFAULT '[]'::JSONB,           -- Feature list for display
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO public.plans (id, name, price_monthly, max_products, max_calculations_monthly, features)
VALUES
  ('starter', 'Starter', 2900, 100, 5000, '["Basic widget", "Email support", "5K calculations/mo"]'::JSONB),
  ('growth', 'Growth', 7900, 500, 25000, '["Custom widget design", "Dashboard analytics", "Priority support", "25K calculations/mo"]'::JSONB),
  ('enterprise', 'Enterprise', 19900, -1, -1, '["Unlimited products", "Unlimited calculations", "API access", "Dedicated manager", "Custom integration"]'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Sellers ────────────────────────────────────────────
-- E-commerce sellers who install POTAL widget or use API

CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Auth: seller can optionally link to auth.users, or be API-only
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Business info
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT,                              -- e.g. "https://myshop.com"
  platform TEXT,                                 -- 'shopify', 'woocommerce', 'custom', etc.
  shopify_shop_domain TEXT,                      -- e.g. "myshop.myshopify.com" (Shopify only)
  -- Subscription
  plan_id TEXT REFERENCES public.plans(id) DEFAULT 'starter',
  stripe_customer_id TEXT,                       -- Stripe customer for billing
  stripe_subscription_id TEXT,                   -- Active subscription
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_status TEXT DEFAULT 'trialing',   -- 'trialing', 'active', 'past_due', 'canceled'
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_sellers_contact_email ON public.sellers(contact_email);
CREATE INDEX IF NOT EXISTS idx_sellers_platform ON public.sellers(platform);
CREATE INDEX IF NOT EXISTS idx_sellers_subscription_status ON public.sellers(subscription_status);

-- RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own record"
  ON public.sellers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sellers can update own record"
  ON public.sellers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create seller"
  ON public.sellers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── 3. API Keys ───────────────────────────────────────────
-- Each seller gets API keys for widget and/or direct API access

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  -- Key info
  key_prefix TEXT NOT NULL,                     -- First 8 chars for identification: "pk_live_"
  key_hash TEXT NOT NULL,                       -- SHA-256 hash of full key (never store plaintext)
  name TEXT DEFAULT 'Default',                  -- User-given name: "Production", "Staging"
  key_type TEXT NOT NULL DEFAULT 'publishable', -- 'publishable' (widget) or 'secret' (API)
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  -- Limits
  rate_limit_per_minute INTEGER DEFAULT 60,     -- Per-key rate limit
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ                        -- NULL = active, set = revoked
);

CREATE INDEX IF NOT EXISTS idx_api_keys_seller_id ON public.api_keys(seller_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_prefix_hash ON public.api_keys(key_prefix, key_hash);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own API keys"
  ON public.api_keys FOR SELECT
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can manage own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- ─── 4. Widget Configs ─────────────────────────────────────
-- Per-seller widget customization (colors, position, behavior)

CREATE TABLE IF NOT EXISTS public.widget_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  -- Widget appearance
  name TEXT DEFAULT 'Default Widget',
  theme JSONB DEFAULT '{
    "primaryColor": "#2563EB",
    "textColor": "#1F2937",
    "backgroundColor": "#FFFFFF",
    "borderRadius": "8px",
    "position": "below-price"
  }'::JSONB,
  -- Widget behavior
  show_breakdown BOOLEAN DEFAULT TRUE,          -- Show cost breakdown or just total
  show_delivery_estimate BOOLEAN DEFAULT TRUE,
  default_destination_country TEXT DEFAULT 'US',
  supported_countries TEXT[] DEFAULT ARRAY['US'],
  -- Embed info
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Domains where widget can load (CORS)
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_widget_configs_seller_id ON public.widget_configs(seller_id);

-- RLS
ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own widget configs"
  ON public.widget_configs FOR SELECT
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can manage own widget configs"
  ON public.widget_configs FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- ─── 5. Usage Logs ─────────────────────────────────────────
-- Track every API call for billing, analytics, rate limiting

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  -- Request info
  endpoint TEXT NOT NULL,                        -- '/v1/calculate', '/v1/classify', etc.
  method TEXT DEFAULT 'GET',
  -- Context
  origin_country TEXT,                           -- 'CN', 'US', etc.
  destination_country TEXT DEFAULT 'US',
  product_price_cents INTEGER,                   -- For analytics (price in cents)
  -- Result
  status_code INTEGER DEFAULT 200,
  response_time_ms INTEGER,                      -- Processing time
  -- Billing period
  billed_at DATE DEFAULT CURRENT_DATE,           -- For monthly aggregation
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition-friendly indexes for high-volume table
CREATE INDEX IF NOT EXISTS idx_usage_logs_seller_date ON public.usage_logs(seller_id, billed_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_endpoint ON public.usage_logs(endpoint);

-- RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own usage logs"
  ON public.usage_logs FOR SELECT
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Insert policy: server-side only (via service role key, not client)
-- No INSERT policy for regular users — logs are created by API server

-- ─── 6. Helper: Updated At Trigger ────────────────────────
-- Reuse existing set_updated_at() from 001_profiles.sql

DROP TRIGGER IF EXISTS sellers_updated_at ON public.sellers;
CREATE TRIGGER sellers_updated_at
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS widget_configs_updated_at ON public.widget_configs;
CREATE TRIGGER widget_configs_updated_at
  BEFORE UPDATE ON public.widget_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 7. Monthly Usage Summary View ────────────────────────
-- For seller dashboard and billing checks

CREATE OR REPLACE VIEW public.seller_monthly_usage AS
SELECT
  seller_id,
  DATE_TRUNC('month', billed_at) AS month,
  COUNT(*) AS total_calculations,
  COUNT(DISTINCT billed_at) AS active_days,
  AVG(response_time_ms) AS avg_response_ms,
  COUNT(*) FILTER (WHERE status_code >= 400) AS error_count
FROM public.usage_logs
GROUP BY seller_id, DATE_TRUNC('month', billed_at);

-- ============================================================
-- Done. Tables created:
-- 1. plans         — Subscription tiers
-- 2. sellers       — E-commerce seller accounts
-- 3. api_keys      — API key management (hashed)
-- 4. widget_configs — Widget customization
-- 5. usage_logs    — API usage tracking
-- + seller_monthly_usage VIEW for dashboard/billing
-- ============================================================
