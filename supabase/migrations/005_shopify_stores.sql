-- POTAL — Shopify Stores Table
-- Shopify 앱 설치 정보 + 토큰 관리
--
-- ⚠️ Supabase SQL Editor에서 실행 필요

CREATE TABLE IF NOT EXISTS shopify_stores (
  id            BIGSERIAL PRIMARY KEY,
  shop_domain   TEXT NOT NULL UNIQUE,  -- mystore.myshopify.com
  access_token  TEXT NOT NULL,         -- Shopify access token (encrypted in production)
  scope         TEXT,                  -- 앱 권한 범위
  seller_id     UUID REFERENCES sellers(id) ON DELETE SET NULL,  -- POTAL 셀러 연결
  potal_api_key TEXT,                  -- 이 스토어에 할당된 POTAL API 키
  installed_at  TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE,
  shop_name     TEXT,                  -- 스토어 이름
  shop_email    TEXT,                  -- 스토어 이메일
  plan_name     TEXT,                  -- Shopify 플랜 (basic, shopify, advanced, plus)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_shopify_stores_seller ON shopify_stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_shopify_stores_active ON shopify_stores(is_active) WHERE is_active = TRUE;

-- RLS (Row Level Security)
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

-- Service role만 접근 가능 (토큰이 민감 데이터)
CREATE POLICY "Service role full access" ON shopify_stores
  FOR ALL
  USING (auth.role() = 'service_role');
