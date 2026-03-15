-- Migration 032: PSR table, screening logs, export control chart
-- Created: 2026-03-15

-- Product Specific Rules (FTA Rules of Origin)
CREATE TABLE IF NOT EXISTS product_specific_rules (
  id serial PRIMARY KEY,
  fta_code text NOT NULL,
  hs6_code text NOT NULL,
  rule_type text NOT NULL, -- CTC, CTH, CTSH, CC, RVC, SP
  rule_text text,
  threshold_pct numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_psr_fta_hs ON product_specific_rules(fta_code, hs6_code);

-- Screening audit logs
CREATE TABLE IF NOT EXISTS screening_logs (
  id serial PRIMARY KEY,
  query_name text,
  query_country text,
  matched_count int,
  top_match_score numeric,
  decision text, -- clear, potential_match, match
  user_id uuid,
  seller_id uuid,
  created_at timestamptz DEFAULT now()
);

-- BIS Commerce Country Chart for export controls
CREATE TABLE IF NOT EXISTS export_control_chart (
  id serial PRIMARY KEY,
  eccn_group text,
  country_code text,
  reason_for_control text,
  license_required boolean,
  license_exceptions text[],
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ecc_eccn_country ON export_control_chart(eccn_group, country_code);
