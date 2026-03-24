-- F052: API Key IP allowlist/blocklist rules
CREATE TABLE IF NOT EXISTS api_key_ip_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('allow', 'block')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_rules_key ON api_key_ip_rules(api_key_id);
CREATE INDEX IF NOT EXISTS idx_ip_rules_ip ON api_key_ip_rules(ip_address);
