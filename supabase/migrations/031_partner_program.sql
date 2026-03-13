-- F147: Partner Revenue Sharing Program

CREATE TABLE IF NOT EXISTS partner_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website TEXT,
  partner_type TEXT DEFAULT 'affiliate',
  referral_code TEXT UNIQUE NOT NULL,
  total_earnings NUMERIC DEFAULT 0,
  pending_payout NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES partner_accounts(id),
  referred_email TEXT NOT NULL,
  referred_company TEXT,
  referred_seller_id TEXT,
  status TEXT DEFAULT 'pending',
  commission_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_partner_accounts_seller ON partner_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner ON partner_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_code ON partner_accounts(referral_code);

ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_accounts_service_all ON partner_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY partner_referrals_service_all ON partner_referrals FOR ALL USING (true) WITH CHECK (true);
