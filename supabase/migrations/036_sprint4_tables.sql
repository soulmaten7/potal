-- Sprint 4 tables
CREATE TABLE IF NOT EXISTS us_state_tax_rates (
  id serial PRIMARY KEY,
  state_code text NOT NULL,
  state_name text NOT NULL,
  state_rate numeric NOT NULL,
  avg_local_rate numeric DEFAULT 0,
  combined_rate numeric NOT NULL,
  has_economic_nexus boolean DEFAULT true,
  nexus_revenue_threshold numeric DEFAULT 100000,
  nexus_transaction_threshold integer DEFAULT 200,
  food_exempt boolean DEFAULT false,
  clothing_exempt boolean DEFAULT false,
  notes text
);

CREATE TABLE IF NOT EXISTS certification_waitlist (
  id serial PRIMARY KEY,
  email text NOT NULL,
  name text,
  company text,
  signed_up_at timestamptz DEFAULT now()
);
