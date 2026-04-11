-- Migration: 066_cw33_currency_adcvd.sql
-- Description: CW33 Sprint 5 — Exchange rate cache + AD/CVD trade remedies
-- Created: 2026-04-11 KST

-- ─── exchange_rate_cache ───────────────────────
-- Daily USD-based exchange rates for 30+ currencies.
-- Primary source: Frankfurter (ECB) API + historical baseline from
-- tlc_data/currency/ecb_historical_rates.xml (8 MB seed)
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency TEXT NOT NULL DEFAULT 'USD',
    target_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    rate_date DATE NOT NULL,
    source TEXT NOT NULL,                 -- 'ecb' | 'frankfurter' | 'fallback'
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    fetched_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (base_currency, target_currency, rate_date, source)
);

CREATE INDEX IF NOT EXISTS idx_xr_date ON exchange_rate_cache(rate_date DESC);
CREATE INDEX IF NOT EXISTS idx_xr_pair ON exchange_rate_cache(base_currency, target_currency);

-- ─── trade_remedies ────────────────────────────
-- US AD/CVD + Safeguard measures.
-- Source: tlc_data/ad_cvd/ita_adcvd_cases_2000_current.json +
--         adcvd_scope_rulings.json
CREATE TABLE IF NOT EXISTS trade_remedies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL,            -- e.g. 'A-570-912'
    remedy_type TEXT NOT NULL,            -- 'anti_dumping' | 'countervailing' | 'safeguard' | 'section201'
    product_description TEXT NOT NULL,
    hs_codes TEXT[] DEFAULT '{}',
    origin_country TEXT NOT NULL,
    destination_country TEXT NOT NULL DEFAULT 'US',
    status TEXT,                          -- 'initiated' | 'preliminary' | 'final' | 'revoked' | 'sunset_continued'
    margin_pct NUMERIC,                   -- ad valorem dumping / subsidy margin
    initiation_date DATE,
    order_date DATE,
    sunset_date DATE,
    exporters JSONB DEFAULT '[]',         -- firm-specific rate array
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tr_case ON trade_remedies(case_number);
CREATE INDEX IF NOT EXISTS idx_tr_origin ON trade_remedies(origin_country);
CREATE INDEX IF NOT EXISTS idx_tr_type ON trade_remedies(remedy_type);
CREATE INDEX IF NOT EXISTS idx_tr_status ON trade_remedies(status);

COMMENT ON TABLE exchange_rate_cache IS 'CW33-S5: Daily exchange rate snapshots (ECB/Frankfurter primary)';
COMMENT ON TABLE trade_remedies IS 'CW33-S5: US AD/CVD + Safeguard trade remedy cases';
