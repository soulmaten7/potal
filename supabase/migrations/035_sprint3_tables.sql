-- Sprint 3 tables
-- Dangerous goods (F027)
CREATE TABLE IF NOT EXISTS dangerous_goods (
  id serial PRIMARY KEY,
  un_number text NOT NULL,
  proper_shipping_name text,
  class text NOT NULL,
  division text,
  packing_group text,
  hs_codes text[],
  air_allowed boolean DEFAULT true,
  sea_allowed boolean DEFAULT true,
  special_provisions text
);

-- Restricted items (F014)
CREATE TABLE IF NOT EXISTS restricted_items (
  id serial PRIMARY KEY,
  hs_code_pattern text NOT NULL,
  origin_country text,
  destination_country text,
  restriction_type text NOT NULL,
  description text,
  license_info text,
  source text,
  direction text DEFAULT 'import'
);

-- Notifications (F087)
CREATE TABLE IF NOT EXISTS notifications (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

-- Digital services tax (F055)
CREATE TABLE IF NOT EXISTS digital_services_tax (
  id serial PRIMARY KEY,
  country_code text NOT NULL,
  tax_name text NOT NULL,
  rate numeric NOT NULL,
  threshold_usd numeric,
  applies_to text,
  effective_date date,
  source text
);

-- Sub-national taxes extension (F054)
CREATE TABLE IF NOT EXISTS sub_national_taxes (
  id serial PRIMARY KEY,
  country_code text NOT NULL,
  region_code text NOT NULL,
  region_name text NOT NULL,
  tax_name text NOT NULL,
  rate numeric NOT NULL,
  applies_to text DEFAULT 'goods',
  source text
);
