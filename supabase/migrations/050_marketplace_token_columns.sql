-- F082: Add OAuth token + encryption columns to marketplace_connections
ALTER TABLE marketplace_connections ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT;
ALTER TABLE marketplace_connections ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;
ALTER TABLE marketplace_connections ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE marketplace_connections ADD COLUMN IF NOT EXISTS shop_domain TEXT;
ALTER TABLE marketplace_connections ADD COLUMN IF NOT EXISTS external_seller_id TEXT;
ALTER TABLE marketplace_connections ADD COLUMN IF NOT EXISTS error_message TEXT;
