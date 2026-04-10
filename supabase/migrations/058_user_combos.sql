-- Sprint 4: user_combos table for CUSTOM builder saved combinations
CREATE TABLE IF NOT EXISTS user_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selected_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  share_slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_combos_user_id ON user_combos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_combos_share_slug ON user_combos(share_slug) WHERE share_slug IS NOT NULL;

ALTER TABLE user_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own combos" ON user_combos
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Public combos readable" ON user_combos
  FOR SELECT USING (is_public = TRUE);
