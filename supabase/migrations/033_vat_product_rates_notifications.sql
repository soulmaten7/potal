-- Migration 033: VAT product rates, notification preferences, email logs
-- Created: 2026-03-15

-- Product-specific VAT/GST rates (reduced, zero, exempt)
CREATE TABLE IF NOT EXISTS vat_product_rates (
  id serial PRIMARY KEY,
  country_code text NOT NULL,
  hs_chapter text NOT NULL,
  product_category text,
  rate_type text NOT NULL DEFAULT 'standard', -- standard, reduced, zero, exempt
  rate numeric NOT NULL,
  description text,
  UNIQUE(country_code, hs_chapter, rate_type)
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL, -- welcome, usage_alert, rate_change, weekly_summary, security_alert
  email_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  UNIQUE(user_id, notification_type)
);

-- Email send deduplication log
CREATE TABLE IF NOT EXISTS email_sent_logs (
  id serial PRIMARY KEY,
  seller_id uuid,
  email_type text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_email_sent_logs_seller ON email_sent_logs(seller_id, email_type, sent_at);
