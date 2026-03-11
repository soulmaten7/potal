-- ===== 021: Exchange Rate History 테이블 =====
-- 일간 환율 동기화(exchange-rate-sync cron) 히스토리 저장
-- 환율 변동 추적, 감사, 이상치 감지용
-- =====

CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,                -- exchangerate-api, fawaz-currency-api, hardcoded-fallback
  base_currency TEXT NOT NULL DEFAULT 'USD',
  rates JSONB NOT NULL,                -- { "EUR": 0.92, "KRW": 1340, ... }
  currency_count INT,
  fetched_at TEXT,                     -- 원본 API 기준 시간
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 최근 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_created ON exchange_rate_history(created_at DESC);

-- 30일 이상 데이터 자동 정리 (선택적 — 저장 공간 절약)
-- COMMENT: 필요시 cron에서 DELETE FROM exchange_rate_history WHERE created_at < now() - interval '90 days';
