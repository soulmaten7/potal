-- 055_forever_free_profile.sql
-- B-2: Forever Free 프로필 데이터 수집 스키마
-- 가입 시 필수 5개 → 1달 무료 / 프로필 완성 → Forever Free
--
-- ⚠️ 실제 적용은 은태님 확인 후 수동으로 실행

-- 1. sellers 테이블에 프로필 필드 추가
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT '';
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS company_size TEXT;  -- 1-10 / 11-50 / 51-200 / 201-1000 / 1000+
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS monthly_shipments TEXT;  -- 0-100 / 101-1000 / 1001-10000 / 10000+
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS primary_platform TEXT;  -- Shopify / WooCommerce / Amazon / etc.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS main_trade_countries TEXT[];  -- 주요 수출입 국가 최대 5개
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS annual_revenue_range TEXT;  -- Under $100K / $100K-$500K / etc.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;  -- 프로필 완성 시점
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS trial_type TEXT NOT NULL DEFAULT 'monthly';  -- monthly = 1달 무료 / forever = Forever Free
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;  -- 가입 후 30일

-- 2. trial_type CHECK constraint
ALTER TABLE sellers ADD CONSTRAINT chk_trial_type CHECK (trial_type IN ('monthly', 'forever'));

-- 3. company_size CHECK constraint
ALTER TABLE sellers ADD CONSTRAINT chk_company_size CHECK (
  company_size IS NULL OR company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')
);

-- 4. monthly_shipments CHECK constraint
ALTER TABLE sellers ADD CONSTRAINT chk_monthly_shipments CHECK (
  monthly_shipments IS NULL OR monthly_shipments IN ('0-100', '101-1000', '1001-10000', '10000+')
);

-- 5. annual_revenue_range CHECK constraint
ALTER TABLE sellers ADD CONSTRAINT chk_annual_revenue CHECK (
  annual_revenue_range IS NULL OR annual_revenue_range IN (
    'Under $100K', '$100K-$500K', '$500K-$1M', '$1M-$5M', '$5M+'
  )
);

-- 6. RLS 정책 — 본인 프로필만 수정 가능 (기존 정책에 추가)
-- sellers 테이블에 이미 RLS가 있으면 아래는 skip
-- CREATE POLICY IF NOT EXISTS "sellers_update_own" ON sellers
--   FOR UPDATE USING (auth.uid() = id);

-- 7. 인덱스
CREATE INDEX IF NOT EXISTS idx_sellers_trial_type ON sellers(trial_type);
CREATE INDEX IF NOT EXISTS idx_sellers_trial_expires ON sellers(trial_expires_at);
CREATE INDEX IF NOT EXISTS idx_sellers_country ON sellers(country);
CREATE INDEX IF NOT EXISTS idx_sellers_industry ON sellers(industry);
CREATE INDEX IF NOT EXISTS idx_sellers_profile_completed ON sellers(profile_completed_at);

-- 8. 기존 셀러에게 trial 설정 (기존 유저 = forever free, 프로필 완성 불필요)
UPDATE sellers SET trial_type = 'forever', profile_completed_at = created_at
WHERE trial_type = 'monthly' AND created_at < NOW() - INTERVAL '1 day';
