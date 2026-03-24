-- F052 + F125: API Key Security — expiration, scoping, rotation support
-- Run: psql -f supabase/migrations/039_api_key_security.sql

-- Add expires_at column (nullable — null means never expires)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add scopes column (default ['*'] = full access)
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ARRAY['*'];

-- Index for efficient expiration checks
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys (expires_at) WHERE expires_at IS NOT NULL;
