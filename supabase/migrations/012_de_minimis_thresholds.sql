-- Migration: 012_de_minimis_thresholds.sql
-- Description: Create de minimis thresholds table
-- Created: 2026-03-07 13:38:23

CREATE TABLE IF NOT EXISTS de_minimis_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL UNIQUE REFERENCES countries(iso_code_2),
    duty_threshold_usd NUMERIC(10,2),
    tax_threshold_usd NUMERIC(10,2),
    original_threshold TEXT,
    original_currency TEXT,
    data_confidence TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_de_minimis_country_code ON de_minimis_thresholds(country_code);
CREATE INDEX IF NOT EXISTS idx_de_minimis_duty_threshold ON de_minimis_thresholds(duty_threshold_usd);
CREATE INDEX IF NOT EXISTS idx_de_minimis_tax_threshold ON de_minimis_thresholds(tax_threshold_usd);
CREATE INDEX IF NOT EXISTS idx_de_minimis_confidence ON de_minimis_thresholds(data_confidence);

BEGIN;

INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AF', 25, 25, 'Unknown (estimated)', 'AFN', 'estimated', 'South Asian country. Subject to international sanctions and insecurity. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('US', 0, 0, '$800 (suspended)', 'USD', 'verified', 'De minimis duty-free treatment suspended as of August 29, 2025 by Executive Order. All imports now subject to duties and taxes regardless of value.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CA', 20, 30, 'CAD $20 (duty); CAD $40 (tax for US/Mexico)', 'CAD', 'verified', 'Standard threshold CAD $20 for all imports. Under CUSMA, US/Mexico shipments: CAD $150 duty, CAD $40 tax. Threshold for other origins suspended July 1, 2025 for 24 months.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MX', 117, 50, 'USD $117 (duty from US/Canada under USMCA); USD $50 (VAT)', 'USD', 'verified', 'Under USMCA, duty-free for goods from US and Canada at USD 117. VAT applies above USD 50. Other origins have lower thresholds.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PR', 200, 200, 'USD $200', 'USD', 'verified', 'Puerto Rico maintains USD 200 de minimis, higher than mainland US (suspended Aug 2025). May have separate rules post-2025.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BS', 150, 150, 'USD $150 (estimated)', 'USD', 'estimated', 'Estimated based on Caribbean average. Limited public customs data available.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BB', 150, 150, 'USD $150 (estimated)', 'USD', 'estimated', 'Estimated based on Caribbean CARICOM standards. Specific threshold not publicly available.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BZ', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Central American country with limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CR', 75, 75, 'USD $75 (estimated)', 'USD', 'estimated', 'Central American country. Specific de minimis threshold not readily available. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('DM', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'Caribbean island nation. Estimated based on similar island economies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('DO', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Caribbean nation with limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SV', 75, 75, 'USD $75 (estimated)', 'USD', 'estimated', 'Central American country using USD. Estimated based on regional standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GD', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'Caribbean island nation. Estimated based on CARICOM regional standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GT', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Central American country. Specific de minimis threshold not publicly documented. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('HT', 50, 50, 'USD $50 (estimated)', 'USD', 'estimated', 'Caribbean nation with developing trade infrastructure. Estimated conservatively due to limited data.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('HN', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Central American country. Limited public de minimis information. Estimated based on regional average.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('JM', 150, 150, 'USD $150 (estimated)', 'USD', 'estimated', 'Caribbean nation. Estimated based on CARICOM member standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NI', 75, 75, 'USD $75 (estimated)', 'USD', 'estimated', 'Central American country. Specific de minimis threshold not available. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PA', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'Central American country using USD and PAB. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KN', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'Caribbean island nation. Estimated based on similar Caribbean economies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LC', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'Caribbean island nation. Estimated based on CARICOM member patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('VC', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'Caribbean island nation. Estimated based on similar island economies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TT', 150, 150, 'USD $150 (estimated)', 'USD', 'estimated', 'Caribbean nation. Estimated based on CARICOM standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AG', 150, 150, 'USD $150 (estimated)', 'USD', 'estimated', 'Caribbean island nation. Estimated based on CARICOM member standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AI', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'British Overseas Territory. Estimated based on Caribbean patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BM', 200, 200, 'USD $200 (estimated)', 'USD', 'estimated', 'British Overseas Territory with developed economy. Estimated conservatively higher.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('VG', 125, 125, 'USD $125 (estimated)', 'USD', 'estimated', 'British Overseas Territory. Estimated based on similar territories.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KY', 200, 200, 'USD $200 (estimated)', 'USD', 'estimated', 'British Overseas Territory. Estimated based on developed offshore financial center status.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MS', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'British Overseas Territory. Estimated based on Caribbean small island patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TC', 150, 150, 'USD $150 (estimated)', 'USD', 'estimated', 'British Overseas Territory. Estimated based on Caribbean patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('VI', 200, 200, 'USD $200 (estimated)', 'USD', 'estimated', 'US territory. May follow similar rules to Puerto Rico.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AW', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Constituent country of the Kingdom of the Netherlands. Estimated based on Caribbean patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CW', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Constituent country of the Kingdom of the Netherlands. Estimated based on Dutch Caribbean patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SX', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Constituent country of the Kingdom of the Netherlands. Estimated based on Caribbean patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BQ', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'Special municipalities of Netherlands. Estimated based on Dutch Caribbean standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AR', 50, 50, 'USD $50 (estimated)', 'USD', 'estimated', 'MERCOSUR member. Limited public de minimis data. Estimated conservatively due to protectionist trade policies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BO', 50, 50, 'USD $50 (estimated)', 'USD', 'estimated', 'South American country. Specific threshold not available. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BR', 50, 50, 'USD $50 (postal shipments between individuals)', 'USD', 'verified', 'MERCOSUR member. USD 50 for postal shipments. E-commerce shipments have stricter rules. Rates vary by product category.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CL', 30, 30, '10% of adjusted value (FTA provision)', 'USD/CLP', 'verified', 'Uses FTA de minimis rule (10% of adjusted value) rather than fixed threshold. Estimated at approx 10% of typical shipment.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CO', 200, 0, 'USD $200 (personal from US); USD $0 (general)', 'USD', 'verified', 'No general de minimis. USD 200 for personal shipments from United States under bilateral agreement.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('EC', 75, 75, 'USD $75 (estimated)', 'USD', 'estimated', 'South American country using USD. Limited de minimis public data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GY', 50, 50, 'USD $50 (estimated)', 'USD', 'estimated', 'South American country. Limited customs data available. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PY', 75, 75, 'USD $75 (estimated)', 'USD', 'estimated', 'MERCOSUR member. Limited public de minimis information. Estimated based on MERCOSUR patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PE', 30, 30, '10% of adjusted value (FTA provision)', 'USD/PEN', 'verified', 'Uses FTA de minimis rule (10% of adjusted value) rather than fixed threshold. Estimated at approx 10% of typical shipment.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SR', 50, 50, 'USD $50 (estimated)', 'USD', 'estimated', 'South American country with limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('UY', 75, 75, 'USD $75 (estimated)', 'USD', 'estimated', 'MERCOSUR member. Limited public de minimis data. Estimated based on regional standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('VE', 25, 25, 'USD $25 (estimated)', 'USD', 'estimated', 'Country with international sanctions and limited trade data. Estimated very conservatively due to economic crisis.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AT', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. VAT applies from first euro. From July 1, 2026: EUR 3 flat-rate duty applies to all parcels.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BE', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. VAT applies from first euro. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BG', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('HR', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CY', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CZ', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('DK', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('EE', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('FI', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('FR', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('DE', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GR', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('HU', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IE', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IT', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LV', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LT', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LU', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MT', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NL', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PL', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PT', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('RO', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SK', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SI', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ES', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SE', 160, 0, 'EUR 150 (duty); EUR 0 (VAT)', 'EUR', 'verified', 'EU member. Current EUR 150 duty de minimis. From July 1, 2026: EUR 3 flat-rate duty applies.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GB', 0, 150, 'GBP 0 (duty since Jan 2021); GBP 135 (VAT)', 'GBP', 'verified', 'No customs duty de minimis since Jan 1, 2021. VAT de minimis of GBP 135. Full removal expected by March 2029.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IS', 75, 75, 'ISK ~10,000 (estimated)', 'ISK', 'estimated', 'Nordic country. Specific de minimis threshold not publicly available. Estimated based on EEA/Nordic patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LI', 5, 5, 'CHF 5 (duty and VAT)', 'CHF', 'verified', 'Duty waived if under CHF 5; VAT waived if under CHF 5. Associated with Swiss customs.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NO', 40, 40, 'NOK 350 (both duty and VAT)', 'NOK', 'verified', 'Standard threshold NOK 350. VOEC scheme applies if annual sales > NOK 50,000 with lower VAT de minimis of NOK 3,000.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CH', 5, 5, 'CHF 5 (estimated)', 'CHF', 'estimated', 'Estimated based on Liechtenstein association. Specific de minimis threshold not readily available in current sources.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('UA', 10, 10, 'UAH 300 (postal); UAH 150 (express)', 'UAH', 'verified', 'Postal shipments: UAH 300. Express courier: UAH 150. Exempt from 20% VAT below thresholds. VAT de minimis reduced from EUR 45.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BY', 50, 50, 'Unknown (estimated)', 'BYN', 'estimated', 'Eastern European country. Specific de minimis threshold not available. Estimated conservatively. Subject to EU sanctions.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MD', 50, 50, 'Unknown (estimated)', 'MDL', 'estimated', 'Eastern European country. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AL', 75, 75, 'Unknown (estimated)', 'ALL', 'estimated', 'Balkan country. Specific de minimis threshold not available. Estimated based on similar countries.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BA', 75, 75, 'Unknown (estimated)', 'BAM', 'estimated', 'Balkan country. Specific de minimis threshold not publicly documented. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ME', 100, 100, 'EUR 100 (estimated)', 'EUR', 'estimated', 'Balkan country pegging to EUR. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MK', 75, 75, 'Unknown (estimated)', 'MKD', 'estimated', 'Balkan country. Specific de minimis threshold not available. Estimated based on similar Balkan nations.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('RS', 100, 100, 'Unknown (estimated)', 'RSD', 'estimated', 'Balkan country. Limited public de minimis information. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GE', 50, 50, 'Unknown (estimated)', 'GEL', 'estimated', 'Caucasian country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AM', 50, 50, 'Unknown (estimated)', 'AMD', 'estimated', 'Caucasian country. Specific de minimis threshold not available. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AZ', 75, 75, 'Unknown (estimated)', 'AZN', 'estimated', 'Caucasian/Central Asian country. Limited public de minimis data. Estimated based on regional standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AD', 160, 0, 'EUR 150 (estimated, follows EU pattern)', 'EUR', 'estimated', 'Microstate in Pyrenees. Not EU member but uses EUR and follows similar patterns. Estimated based on EU standards.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MC', 160, 0, 'EUR 150 (estimated, follows EU pattern)', 'EUR', 'estimated', 'Microstate. Not EU member but integrated with French customs. Estimated following EU de minimis.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SM', 160, 0, 'EUR 150 (estimated, follows EU pattern)', 'EUR', 'estimated', 'Microstate. Not EU member but integrated with Italian customs. Estimated following EU de minimis.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AX', 160, 0, 'EUR 150 (follows Finland/EU)', 'EUR', 'verified', 'Autonomous region of Finland. Follows Finnish/EU de minimis rules.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('FO', 160, 0, 'DKK ~1,200 (estimated, follows Scandinavian pattern)', 'DKK', 'estimated', 'Self-governing territory of Denmark. Estimated based on Nordic/Scandinavian patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GL', 160, 0, 'DKK ~1,200 (estimated, follows Scandinavian pattern)', 'DKK', 'estimated', 'Self-governing territory of Denmark. Estimated based on Nordic/Scandinavian patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IM', 150, 150, 'GBP 125 (estimated)', 'GBP', 'estimated', 'British Crown Dependency. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('JE', 150, 150, 'GBP 125 (estimated)', 'GBP', 'estimated', 'British Crown Dependency. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GG', 150, 150, 'GBP 125 (estimated)', 'GBP', 'estimated', 'British Crown Dependency. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GI', 150, 150, 'GBP 125 (estimated)', 'GBP', 'estimated', 'British Overseas Territory. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AU', 670, 670, 'AUD 1,000', 'AUD', 'verified', 'AUD 1,000 de minimis for both duty and GST. Exceptions: tobacco, alcohol subject to excise duty regardless.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CN', 8, 0, 'CNY 50 (personal consumption); CNY 0 (ecommerce)', 'CNY', 'verified', 'Personal consumption imports: CNY 50. E-commerce/courier shipments: no de minimis (all subject to duty/tax). VAT 13% or 9% for applicable goods.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('HK', NULL, NULL, 'No duty or import taxes', 'HKD', 'verified', 'Hong Kong does not impose customs duties or import taxes on most goods. No de minimis threshold needed.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IN', 600, 600, 'INR 50,000 (recent increase in 2025)', 'INR', 'verified', 'De minimis INR 50,000 (~USD 600) for duty exemptions. GST may still apply on courier imports at 18%.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ID', 3, 0, 'USD 3 (duty); USD 0 (tax)', 'USD', 'verified', 'Lowered from USD 75 in 2025. All imports subject to VAT. Books, garments, footwear, bags exempted from duty.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('JP', 70, 70, 'JPY 10,000', 'JPY', 'verified', 'JPY 10,000 exempts from both duty and 10% consumption tax. Under review in 2025-2026 due to exploitation by Chinese e-commerce (Temu, Shein).')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MY', 150, 150, 'MYR 500', 'MYR', 'verified', 'MYR 500 de minimis for both duty and GST/SST.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NZ', 670, 670, 'NZD 1,000 (traditional; changes in 2025)', 'NZD', 'verified', 'Historically NZD 1,000 for duty and GST. 2025 updates indicate changes with platforms now reporting import taxes. Exceptions: tobacco, alcohol.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PH', 180, 180, 'PHP 10,000', 'PHP', 'verified', 'PHP 10,000 de minimis. Both VAT and processing fees may apply above threshold for e-commerce.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SG', 290, 290, 'SGD 400', 'SGD', 'verified', 'SGD 400 for both duty and 9% GST exemption. OVR registration may change GST applicability.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KR', 150, 150, 'USD 150 (USD 200 from US under KORUS FTA)', 'USD', 'verified', 'USD 150 general threshold; USD 200 for US-origin goods under KORUS FTA. 10% VAT applies above threshold. Tobacco and consumption taxes still apply below threshold.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TW', 65, 65, 'TWD 2,000', 'TWD', 'verified', 'TWD 2,000 for both duty and GST exemption.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TH', 30, 0, 'THB 1,000 (duty); VAT applies regardless', 'THB', 'verified', 'Lowered from THB 1,500 in July 2024. 7% VAT applies on all imports regardless of value.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('VN', 0, 0, 'VND 1,000,000 (abolished Feb 2025)', 'VND', 'verified', 'De minimis exemption removed February 18, 2025. All imports now subject to 10% VAT and duties regardless of value. Formerly VND 1,000,000.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MO', NULL, NULL, 'No specific de minimis', 'MOP', 'estimated', 'Special Administrative Region of China. Limited public de minimis information available.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BD', 75, 75, 'Unknown (estimated)', 'BDT', 'estimated', 'South Asian country. Specific de minimis threshold not available. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KH', 50, 50, 'Unknown (estimated)', 'KHR', 'estimated', 'Southeast Asian country. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LA', 50, 50, 'Unknown (estimated)', 'LAK', 'estimated', 'Southeast Asian country with minimal customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MM', 50, 50, 'Unknown (estimated)', 'MMK', 'estimated', 'Southeast Asian country with limited public customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LK', 50, 50, 'Unknown (estimated)', 'LKR', 'estimated', 'South Asian country. Specific de minimis threshold not available. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NP', 50, 50, 'Unknown (estimated)', 'NPR', 'estimated', 'South Asian country with developing customs systems. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BT', 50, 50, 'Unknown (estimated)', 'BTN', 'estimated', 'Small Himalayan country. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PK', 75, 75, 'Unknown (estimated)', 'PKR', 'estimated', 'South Asian country. Specific de minimis threshold not publicly available. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MN', 50, 50, 'Unknown (estimated)', 'MNT', 'estimated', 'East Asian country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BN', 100, 100, 'Unknown (estimated)', 'BND', 'estimated', 'Southeast Asian country. Limited public de minimis information. Estimated based on ASEAN patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TL', 50, 50, 'USD 50 (estimated)', 'USD', 'estimated', 'Southeast Asian nation. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BH', 250, NULL, 'Unknown (estimated)', 'BHD', 'estimated', 'GCC member. No VAT in Bahrain. Estimated based on GCC member patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('EG', 75, 75, 'Unknown (estimated)', 'EGP', 'estimated', 'North African country. Specific de minimis threshold not available. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IL', 75, 75, 'Unknown (estimated)', 'ILS', 'estimated', 'Middle Eastern country. Specific de minimis threshold not publicly documented. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KW', 250, NULL, 'Unknown (estimated)', 'KWD', 'estimated', 'GCC member. No VAT in Kuwait. Estimated based on GCC member patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('QA', 0, 275, 'QAR 0 (non-personal); QAR 1,000 (personal)', 'QAR', 'verified', 'No de minimis for non-personal shipments. QAR 1,000 for personal shipments. No VAT in Qatar.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SA', 266, NULL, 'SAR 1,000', 'SAR', 'verified', 'GCC member. SAR 1,000 de minimis. No VAT on imports (domestic VAT only).')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TR', 100, 100, 'Unknown (estimated)', 'TRY', 'estimated', 'Middle Eastern/European country. Specific de minimis threshold not readily available. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AE', 150, 150, 'AED 300-1,000 (varies by emirate)', 'AED', 'verified', 'GCC member. Dubai: AED 300 customs duty de minimis. Abu Dhabi: AED 1,000. 5% VAT applies. Specific threshold varies by emirate.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('OM', 250, NULL, 'Unknown (estimated)', 'OMR', 'estimated', 'GCC member. No VAT in Oman. Estimated based on GCC member patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('JO', 100, 100, 'Unknown (estimated)', 'JOD', 'estimated', 'Middle Eastern country. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LB', 75, 75, 'Unknown (estimated)', 'LBP', 'estimated', 'Middle Eastern country facing economic challenges. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IQ', 50, 50, 'Unknown (estimated)', 'IQD', 'estimated', 'Middle Eastern country with developing customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IR', 50, 50, 'Unknown (estimated)', 'IRR', 'estimated', 'Middle Eastern country. Subject to international sanctions. Very limited public customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SY', 25, 25, 'Unknown (estimated)', 'SYP', 'estimated', 'Middle Eastern country facing civil conflict. Subject to international sanctions. Estimated very conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('YE', 25, 25, 'Unknown (estimated)', 'YER', 'estimated', 'Middle Eastern country facing humanitarian crisis. Limited functioning customs authority. Estimated very conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PS', 50, 50, 'Unknown (estimated)', 'ILS/USD', 'estimated', 'Palestinian territories. Limited independent customs authority. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KZ', 100, 100, 'Unknown (estimated)', 'KZT', 'estimated', 'Central Asian country. Member of Eurasian Economic Union. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KG', 100, 100, 'Unknown (estimated)', 'KGS', 'estimated', 'Central Asian country. Limited public de minimis information. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TJ', 75, 75, 'Unknown (estimated)', 'TJS', 'estimated', 'Central Asian country. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TM', 75, 75, 'Unknown (estimated)', 'TMT', 'estimated', 'Central Asian country with restricted trade policies. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('UZ', 100, 100, 'Unknown (estimated)', 'UZS', 'estimated', 'Central Asian country. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KE', 50, 50, 'USD 50', 'USD', 'verified', 'East African country. USD 50 de minimis for duty-free imports.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NG', 300, 300, 'USD 300', 'USD', 'verified', 'West African country. New de minimis policy effective September 2025. USD 300 for duty-free e-commerce imports.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ZA', 6, 6, 'ZAR 500 (traditional; changing)', 'ZAR', 'verified', 'Southern African country. Previously ZAR 500. Framework is weak; duties often applied even on small imports. Recent changes to online retail duties.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ZM', 50, 50, 'Unknown (estimated)', 'ZMW', 'estimated', 'Southern African country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ZW', 25, 25, 'Unknown (estimated)', 'ZWL', 'estimated', 'Southern African country with currency challenges. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MA', 50, 50, 'Unknown (estimated)', 'MAD', 'estimated', 'North African country. Specific de minimis threshold not publicly documented. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TN', 50, 50, 'Unknown (estimated)', 'TND', 'estimated', 'North African country. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('DZ', 50, 50, 'Unknown (estimated)', 'DZD', 'estimated', 'North African country. Limited public de minimis information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AO', 50, 50, 'Unknown (estimated)', 'AOA', 'estimated', 'Southern African country. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BW', 50, 50, 'Unknown (estimated)', 'BWP', 'estimated', 'Southern African country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BF', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BI', 50, 50, 'Unknown (estimated)', 'BIF', 'estimated', 'East/Central African country. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BJ', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CM', 50, 50, 'Unknown (estimated)', 'XAF', 'estimated', 'Central African country. Uses CFA Franc. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CF', 25, 25, 'Unknown (estimated)', 'XAF', 'estimated', 'Central African country. Uses CFA Franc. Very limited customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TD', 25, 25, 'Unknown (estimated)', 'XAF', 'estimated', 'Central African country. Uses CFA Franc. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KM', 50, 50, 'Unknown (estimated)', 'KMF', 'estimated', 'Indian Ocean island nation. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CD', 25, 25, 'Unknown (estimated)', 'CDF', 'estimated', 'Central African country. Very limited customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CG', 50, 50, 'Unknown (estimated)', 'XAF', 'estimated', 'Central African country. Uses CFA Franc. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CI', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('DJ', 50, 50, 'Unknown (estimated)', 'DJF', 'estimated', 'East African country. Strategic port. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ET', 50, 50, 'Unknown (estimated)', 'ETB', 'estimated', 'East African country. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GQ', 50, 50, 'Unknown (estimated)', 'XAF', 'estimated', 'Central African country. Uses CFA Franc. Very limited public information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ER', 25, 25, 'Unknown (estimated)', 'ERN', 'estimated', 'East African country. Subject to international isolation. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GA', 50, 50, 'Unknown (estimated)', 'XAF', 'estimated', 'Central African country. Uses CFA Franc. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GM', 50, 50, 'Unknown (estimated)', 'GMD', 'estimated', 'West African country. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GH', 75, 75, 'Unknown (estimated)', 'GHS', 'estimated', 'West African country. Limited public de minimis information. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GN', 50, 50, 'Unknown (estimated)', 'GNF', 'estimated', 'West African country. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GW', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Very limited public data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LS', 50, 50, 'Unknown (estimated)', 'LSL', 'estimated', 'Southern African country, landlocked. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LR', 50, 50, 'Unknown (estimated)', 'LRD', 'estimated', 'West African country. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('LY', 25, 25, 'Unknown (estimated)', 'LYD', 'estimated', 'North African country. Politically unstable. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MG', 50, 50, 'Unknown (estimated)', 'MGA', 'estimated', 'East African island nation. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MW', 50, 50, 'Unknown (estimated)', 'MWK', 'estimated', 'Southern African country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ML', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Security challenges. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MR', 50, 50, 'Unknown (estimated)', 'MRU', 'estimated', 'West African country. Limited public de minimis information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MU', 100, 100, 'Unknown (estimated)', 'MUR', 'estimated', 'East African island nation. Developed economy. Estimated higher than regional average.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MZ', 50, 50, 'Unknown (estimated)', 'MZN', 'estimated', 'Southern African country. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NA', 50, 50, 'Unknown (estimated)', 'NAD', 'estimated', 'Southern African country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NE', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Limited customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('RW', 50, 50, 'Unknown (estimated)', 'RWF', 'estimated', 'East/Central African country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SN', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SL', 50, 50, 'Unknown (estimated)', 'SLL', 'estimated', 'West African country. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SO', 25, 25, 'Unknown (estimated)', 'SOS', 'estimated', 'East African country. Political instability. Very limited functioning customs. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SS', 25, 25, 'Unknown (estimated)', 'SSP', 'estimated', 'East African country. Political conflict. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SD', 25, 25, 'Unknown (estimated)', 'SDG', 'estimated', 'North African country. Political instability. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SZ', 50, 50, 'Unknown (estimated)', 'SZL', 'estimated', 'Southern African country. Limited public de minimis information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TZ', 50, 50, 'Unknown (estimated)', 'TZS', 'estimated', 'East African country. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TG', 50, 50, 'Unknown (estimated)', 'XOF', 'estimated', 'West African country. Uses CFA Franc. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('UG', 50, 50, 'Unknown (estimated)', 'UGX', 'estimated', 'East African country. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CV', 50, 50, 'Unknown (estimated)', 'CVE', 'estimated', 'West African island nation. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('ST', 50, 50, 'Unknown (estimated)', 'STN', 'estimated', 'Central African island nation. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('FJ', 100, 100, 'Unknown (estimated)', 'FJD', 'estimated', 'South Pacific island nation. Limited public de minimis data. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('WS', 75, 75, 'Unknown (estimated)', 'WST', 'estimated', 'South Pacific island nation. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TO', 75, 75, 'Unknown (estimated)', 'TOP', 'estimated', 'South Pacific island nation. Limited public de minimis information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('VU', 75, 75, 'Unknown (estimated)', 'VUV', 'estimated', 'South Pacific island nation. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SB', 75, 75, 'Unknown (estimated)', 'SBD', 'estimated', 'South Pacific island nation. Limited customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PG', 50, 50, 'Unknown (estimated)', 'PGK', 'estimated', 'South Pacific country. Limited customs modernization. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KI', 50, 50, 'Unknown (estimated)', 'AUD', 'estimated', 'Micronesian island nation. Uses AUD. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MH', 100, 100, 'Unknown (estimated)', 'USD', 'estimated', 'Micronesian island nation. US-associated. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('FM', 100, 100, 'Unknown (estimated)', 'USD', 'estimated', 'Micronesian island nation. US-associated. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NR', 50, 50, 'Unknown (estimated)', 'AUD', 'estimated', 'Micronesian island nation. Uses AUD. Very limited public information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PW', 100, 100, 'Unknown (estimated)', 'USD', 'estimated', 'Micronesian island nation. US-associated. Limited de minimis public data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TV', 50, 50, 'Unknown (estimated)', 'AUD', 'estimated', 'Polynesian island nation. Uses AUD. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NU', 50, 50, 'Unknown (estimated)', 'NZD', 'estimated', 'Polynesian island nation. Associated with New Zealand. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CK', 50, 50, 'Unknown (estimated)', 'NZD', 'estimated', 'Polynesian island nation. Associated with New Zealand. Limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('TK', 50, 50, 'Unknown (estimated)', 'NZD', 'estimated', 'Polynesian territory of New Zealand. Very limited customs infrastructure. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NC', 100, 100, 'Unknown (estimated)', 'XPF', 'estimated', 'French territory in South Pacific. Uses CFP Franc. Estimated based on French patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PF', 100, 100, 'Unknown (estimated)', 'XPF', 'estimated', 'French territory in South Pacific. Uses CFP Franc. Estimated based on French patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('WF', 100, 100, 'Unknown (estimated)', 'XPF', 'estimated', 'French territory in South Pacific. Uses CFP Franc. Very limited public information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('AS', 100, 100, 'Unknown (estimated)', 'USD', 'estimated', 'US territory. Not part of US customs territory. Estimated based on US patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GU', 200, 200, 'USD $200 (estimated)', 'USD', 'estimated', 'US territory. May follow similar rules to Puerto Rico. Estimated conservatively higher.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MP', 100, 100, 'USD $100 (estimated)', 'USD', 'estimated', 'US territory. Limited public de minimis information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CC', 100, 100, 'Unknown (estimated)', 'AUD', 'estimated', 'Australian territory. Uses AUD. Estimated based on Australian patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CX', 100, 100, 'Unknown (estimated)', 'AUD', 'estimated', 'Australian territory. Uses AUD. Estimated based on Australian patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('NF', 100, 100, 'Unknown (estimated)', 'AUD', 'estimated', 'Australian territory. Uses AUD. Estimated based on Australian patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SH', 150, 150, 'Unknown (estimated)', 'GBP', 'estimated', 'British Overseas Territory in South Atlantic. Very limited customs data. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('PM', 160, 0, 'EUR 150 (estimated)', 'EUR', 'estimated', 'French territory in North Atlantic. Follows French customs patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('RE', 160, 0, 'EUR 150 (follows France)', 'EUR', 'verified', 'French overseas department. Follows French/EU de minimis rules.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('YT', 160, 0, 'EUR 150 (estimated)', 'EUR', 'estimated', 'French overseas department. Estimated to follow French/EU patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GP', 160, 0, 'EUR 150 (follows France)', 'EUR', 'verified', 'French overseas department. Follows French/EU de minimis rules.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MQ', 160, 0, 'EUR 150 (follows France)', 'EUR', 'verified', 'French overseas department. Follows French/EU de minimis rules.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('GF', 160, 0, 'EUR 150 (follows France)', 'EUR', 'verified', 'French overseas department. Follows French/EU de minimis rules.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('BL', 160, 0, 'EUR 150 (estimated)', 'EUR', 'estimated', 'French overseas collectivity. Estimated to follow French patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MF', 160, 0, 'EUR 150 (estimated)', 'EUR', 'estimated', 'French overseas collectivity. Estimated to follow French patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('IO', 150, 150, 'Unknown (estimated)', 'USD', 'estimated', 'British Overseas Territory. Very limited trade activity. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('FK', 150, 150, 'Unknown (estimated)', 'GBP', 'estimated', 'British Overseas Territory. Very limited customs data. Estimated based on UK patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SJ', 50, 50, 'Unknown (estimated)', 'NOK', 'estimated', 'Norwegian territory in Arctic. Estimated based on Norwegian patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('XK', 100, 100, 'EUR 100 (estimated)', 'EUR', 'estimated', 'Balkan country (not yet universally recognized). Uses EUR. Estimated based on regional patterns.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('MV', 75, 75, 'Unknown (estimated)', 'MVR', 'estimated', 'South Asian island nation. Limited public de minimis data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('SC', 100, 100, 'Unknown (estimated)', 'SCR', 'estimated', 'East African island nation. Developed economy. Estimated higher than regional average.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('CU', 25, 25, 'Unknown (estimated)', 'CUP', 'estimated', 'Caribbean island. Subject to international sanctions. Very limited customs data. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;
INSERT INTO de_minimis_thresholds (country_code, duty_threshold_usd, tax_threshold_usd, original_threshold, original_currency, data_confidence, notes)
VALUES ('KP', 25, 25, 'Unknown (estimated)', 'KPW', 'estimated', 'East Asian country. Subject to international sanctions. Very limited public information. Estimated conservatively.')
ON CONFLICT (country_code) DO UPDATE SET
    duty_threshold_usd = EXCLUDED.duty_threshold_usd,
    tax_threshold_usd = EXCLUDED.tax_threshold_usd,
    original_threshold = EXCLUDED.original_threshold,
    original_currency = EXCLUDED.original_currency,
    data_confidence = EXCLUDED.data_confidence,
    notes = EXCLUDED.notes;

COMMIT;
