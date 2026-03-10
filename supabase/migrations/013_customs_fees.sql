-- Migration: 013_customs_fees.sql
-- Description: Create customs fees table
-- Created: 2026-03-07 13:38:31

CREATE TABLE IF NOT EXISTS customs_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL UNIQUE REFERENCES countries(iso_code_2),
    currency TEXT,
    processing_fee_type TEXT,
    processing_fee_rate NUMERIC(8,4),
    processing_fee_min NUMERIC(10,2),
    processing_fee_max NUMERIC(10,2),
    processing_fee_description TEXT,
    hmf_applicable BOOLEAN DEFAULT FALSE,
    hmf_rate NUMERIC(8,4),
    hmf_description TEXT,
    brokerage_min_usd NUMERIC(10,2),
    brokerage_max_usd NUMERIC(10,2),
    other_charges JSONB,
    data_confidence TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customs_fees_country_code ON customs_fees(country_code);
CREATE INDEX IF NOT EXISTS idx_customs_fees_currency ON customs_fees(currency);
CREATE INDEX IF NOT EXISTS idx_customs_fees_confidence ON customs_fees(data_confidence);

BEGIN;

INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AD', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AE', 'AED', 'Bill of Entry Fee', 90, 90, 90, 'Fixed AED90 per Bill of Entry.', TRUE, NULL, 'Port/airport inspection fees.', 30, 150, '[{"name": "Innovation charge", "description": "On transactions over AED50", "rate_or_amount": "10 AED"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AF', 'AFN', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AG', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AI', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AL', 'ALL', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AM', 'AMD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AO', 'AOA', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AR', 'ARS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AS', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AT', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AU', 'AUD', 'Import Processing Charge (IPC)', NULL, 50, 1050, 'Fixed fee per consignment, AUD50-1050.', TRUE, NULL, 'Port handling fees included.', 40, 200, '[{"name": "Inspection/storage", "description": "Port handling and storage", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AW', 'AWG', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AX', 'EUR', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('AZ', 'AZN', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BA', 'BAM', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BB', 'BBD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BD', 'BDT', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BE', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BF', 'XOF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BG', 'BGN', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BH', 'BHD', 'Processing Fee', 0.15, 15, 500, '0.15-0.25% of import value. GCC common external tariff applies.', TRUE, NULL, 'Port processing and handling fees.', 40, 200, '[{"name": "Port fees", "description": "Port processing charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BI', 'BIF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BJ', 'XOF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BL', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BM', 'BMD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BN', 'BND', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BO', 'BOB', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BQ', 'USD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BR', 'BRL', 'SISCOMEX + Broker Fee', NULL, NULL, NULL, 'Government fee plus broker charges.', TRUE, NULL, 'Port handling (THC, capatazia).', 50, 300, '[{"name": "Port charges", "description": "Terminal Handling Charges, storage", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BS', 'BSD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BT', 'BTN', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BW', 'BWP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BY', 'BYN', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('BZ', 'BZD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CA', 'CAD', 'CBSA Processing Fee', NULL, 9.95, NULL, 'Canada Post handling fee CAD$9.95.', FALSE, NULL, 'No HMF for Canadian ports.', 40, 200, '[{"name": "Border inspection fees", "description": "FPA inspection charges", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CC', 'AUD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CD', 'CDF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CF', 'XAF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CG', 'XAF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CH', 'CHF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CI', 'XOF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CK', 'NZD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CL', 'CLP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CM', 'XAF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CN', 'CNY', 'Inspection Fee', 50, 50, NULL, 'CNY50 per officer per working day.', TRUE, NULL, 'Port handling and deconsolidation fees.', 100, 400, '[{"name": "Port handling", "description": "Deconsolidation, handling orders", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CO', 'COP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CR', 'CRC', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CU', 'CUP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CV', 'CVE', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CW', 'ANG', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CX', 'AUD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CY', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('CZ', 'CZK', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('DE', 'EUR', 'Broker Fee', NULL, NULL, NULL, 'Variable broker/clearance fees.', FALSE, NULL, 'No separate fee; included in general charges.', 30, 150, '[{"name": "Postal operator fees", "description": "Courier clearance fees", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('DJ', 'DJF', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('DK', 'DKK', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('DM', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('DO', 'DOP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('DZ', 'DZD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('EC', 'USD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('EE', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('EG', 'EGP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ER', 'ERN', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ES', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ET', 'ETB', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('FI', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('FJ', 'FJD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('FK', 'FKP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('FM', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('FO', 'DKK', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('FR', 'EUR', 'Administrative Fee', 2.0, 2.0, 2.0, 'EU EUR2 per consignment for parcels under EUR150.', FALSE, NULL, 'No separate harbor fee; included in general duties.', 25, 150, '[{"name": "EU Customs Levy", "description": "Interim EUR3 levy (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GA', 'XAF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GB', 'GBP', 'Handling/Clearance Fee', NULL, 20, 100, 'Post-Brexit handling fees vary.', TRUE, NULL, 'Port/airport handling charges GBP20-100+.', 25, 100, '[{"name": "Storage/demurrage", "description": "Daily storage if not cleared promptly", "rate_or_amount": "10-50 GBP/day"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GD', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GE', 'GEL', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GF', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GG', 'GBP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GH', 'GHS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GI', 'GIP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GL', 'DKK', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GM', 'GMD', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GN', 'GNF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GP', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GQ', 'XAF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GR', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GT', 'GTQ', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GU', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GW', 'XOF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('GY', 'GYD', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('HK', 'HKD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('HN', 'HNL', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('HR', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('HT', 'HTG', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('HU', 'HUF', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ID', 'IDR', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IE', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IL', 'ILS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IM', 'GBP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IN', 'INR', 'Handling Fee', 1.0, NULL, NULL, '1% of handling and processing cost.', TRUE, NULL, 'Port/inspection fees.', 30, 200, '[{"name": "Inspection/storage", "description": "Inspection and storage fees", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IO', 'USD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IQ', 'IQD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IR', 'IRR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IS', 'ISK', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('IT', 'EUR', 'Administrative Charge', 2.0, 2.0, 2.0, 'Italy EUR2 per parcel for items under EUR150.', FALSE, NULL, 'No separate fee.', 25, 150, '[{"name": "Customs broker fees", "description": "Additional broker charges", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('JE', 'GBP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('JM', 'JMD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('JO', 'JOD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('JP', 'JPY', 'Japan Post Handling', 200, 200, 200, 'Flat fee JPY200 per parcel.', FALSE, NULL, 'No separate fee.', 30, 150, '[{"name": "Inspection fees", "description": "Variable inspection charges", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KE', 'KES', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KG', 'KGS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KH', 'KHR', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KI', 'AUD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KM', 'KMF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KN', 'XCD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KP', 'KPW', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KR', 'KRW', 'Processing Fee', 4000, 4000, 4000, 'Fixed KRW4000 for international mail.', FALSE, NULL, 'No separate fee.', 30, 120, '[{"name": "Documentation", "description": "Document processing", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KW', 'KWD', 'Processing Fee', 0.15, 15, 500, '0.15-0.25% of import value. GCC common external tariff applies.', TRUE, NULL, 'Port processing and handling fees.', 40, 200, '[{"name": "Port fees", "description": "Port processing charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KY', 'KYD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('KZ', 'KZT', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LA', 'LAK', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LB', 'LBP', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LC', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LI', 'CHF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LK', 'LKR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LR', 'LRD', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LS', 'LSL', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LT', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LU', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LV', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('LY', 'LYD', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MA', 'MAD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MC', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MD', 'MDL', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ME', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MF', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MG', 'MGA', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MH', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MK', 'MKD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ML', 'XOF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MM', 'MMK', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MN', 'MNT', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MO', 'MOP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MP', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MQ', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MR', 'MRU', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MS', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MT', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MU', 'MUR', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MV', 'MVR', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MW', 'MWK', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MX', 'MXN', 'Derecho de Trámite', NULL, NULL, NULL, 'Exempted under USMCA for qualifying goods.', FALSE, NULL, 'No separate fee.', 40, 200, '[{"name": "Documentation", "description": "Customs documents filing", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MY', 'MYR', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('MZ', 'MZN', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NA', 'NAD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NC', 'XPF', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NE', 'XOF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NF', 'AUD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NG', 'NGN', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NI', 'NIO', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NL', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NO', 'NOK', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NP', 'NPR', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NR', 'AUD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NU', 'NZD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('NZ', 'NZD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('OM', 'OMR', 'Processing Fee', 0.15, 15, 500, '0.15-0.25% of import value. GCC common external tariff applies.', TRUE, NULL, 'Port processing and handling fees.', 40, 200, '[{"name": "Port fees", "description": "Port processing charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PA', 'PAB', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PE', 'PEN', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PF', 'XPF', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PG', 'PGK', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PH', 'PHP', 'Processing/Clearance Fee', NULL, NULL, NULL, 'Variable processing fee by customs.', TRUE, NULL, 'Port handling fees common.', 30, 150, '[{"name": "Port handling", "description": "Terminal/port charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PK', 'PKR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PL', 'PLN', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PM', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PR', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PS', 'ILS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PT', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PW', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('PY', 'PYG', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('QA', 'QAR', 'Processing Fee', 0.15, 15, 500, '0.15-0.25% of import value. GCC common external tariff applies.', TRUE, NULL, 'Port processing and handling fees.', 40, 200, '[{"name": "Port fees", "description": "Port processing charges", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('RE', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('RO', 'RON', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('RS', 'RSD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('RW', 'RWF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SA', 'SAR', 'Service Fee', 0.15, 15, 130, '0.15% of import value (min SAR15, max SAR130).', TRUE, NULL, 'Port and cargo service fees.', 50, 250, '[{"name": "Cargo service fee", "description": "Port-related charges", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SB', 'SBD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SC', 'SCR', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SD', 'SDG', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SE', 'SEK', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SG', 'SGD', 'TradeNet Permit Fee', 3.19, 3.19, 3.19, 'SGD3.19 per permit application.', TRUE, NULL, 'Singapore Post handling SGD10.90.', 20, 100, '[{"name": "Handling/shipping", "description": "Service provider charges", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SH', 'SHP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SI', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SJ', 'NOK', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SK', 'EUR', 'Administrative/Handling Fee', 2.0, 2.0, NULL, 'EU EUR2 handling fee for items under EUR150. Additional EUR3 levy 2026-2028.', FALSE, NULL, 'No separate fee.', 20, 120, '[{"name": "EU interim levy", "description": "Temporary customs duty (2026-2028)", "rate_or_amount": "3 EUR"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SL', 'SLE', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SM', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SN', 'XOF', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SO', 'SOS', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SR', 'SRD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SS', 'SSP', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ST', 'STN', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SV', 'USD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SX', 'ANG', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SY', 'SYP', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('SZ', 'SZL', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TC', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TD', 'XAF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TG', 'XOF', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TH', 'THB', 'Duty Tax Processing Fee', 2.0, 200, 2000, '2% of fiscal charges (min THB200, max THB2000).', TRUE, NULL, 'Landing and storage fees.', 30, 150, '[{"name": "Storage/bonded warehouse", "description": "Warehouse charges", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TJ', 'TJS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TK', 'NZD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TL', 'USD', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TM', 'TMT', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TN', 'TND', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TO', 'TOP', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TR', 'TRY', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TT', 'TTD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TV', 'AUD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TW', 'TWD', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('TZ', 'TZS', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('UA', 'UAH', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('UG', 'UGX', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('US', 'USD', 'Merchandise Processing Fee (MPF)', 0.3464, 33.58, 651.5, 'Ad valorem rate on declared value. Min/max adjusted annually.', TRUE, 0.125, 'Ocean shipments only. 0.125% of cargo value.', 50, 500, '[{"name": "Warehouse storage", "description": "Storage fees if not cleared promptly", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('UY', 'UYU', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('UZ', 'UZS', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('VC', 'XCD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('VE', 'VES', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('VG', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('VI', 'USD', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('VN', 'VND', 'Clearance Fee', NULL, NULL, NULL, 'Variable clearance fee from brokers.', TRUE, NULL, 'Port handling fees.', 30, 150, '[{"name": "Environmental tax", "description": "Per-unit tax on certain goods", "rate_or_amount": "Variable"}]'::jsonb, 'verified')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('VU', 'VUV', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('WF', 'XPF', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('WS', 'WST', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('XK', 'EUR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('YE', 'YER', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('YT', 'EUR', 'Processing/Handling Fee', NULL, NULL, NULL, 'Variable customs processing fee.', TRUE, NULL, 'Port/harbor maintenance fee common for island nations.', 30, 150, '[{"name": "Port charges", "description": "Harbor and port handling fees", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ZA', 'ZAR', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ZM', 'ZMW', 'Administrative Fee', NULL, NULL, NULL, 'Minimal or no processing fee (LDC status).', FALSE, NULL, 'Limited port infrastructure; fees minimal.', 15, 80, '[{"name": "Port handling", "description": "Limited port facilities", "rate_or_amount": "Minimal"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;
INSERT INTO customs_fees (country_code, currency, processing_fee_type, processing_fee_rate, processing_fee_min, processing_fee_max, processing_fee_description, hmf_applicable, hmf_rate, hmf_description, brokerage_min_usd, brokerage_max_usd, other_charges, data_confidence)
VALUES ('ZW', 'ZWL', 'Customs Processing Fee', NULL, NULL, NULL, 'Variable processing and documentation fees apply.', TRUE, NULL, 'Port/airport handling fees may apply.', 30, 150, '[{"name": "Documentation/handling", "description": "Customs documentation and handling", "rate_or_amount": "Variable"}]'::jsonb, 'estimated')
ON CONFLICT (country_code) DO UPDATE SET
    currency = EXCLUDED.currency,
    processing_fee_type = EXCLUDED.processing_fee_type,
    processing_fee_rate = EXCLUDED.processing_fee_rate,
    processing_fee_min = EXCLUDED.processing_fee_min,
    processing_fee_max = EXCLUDED.processing_fee_max,
    processing_fee_description = EXCLUDED.processing_fee_description,
    hmf_applicable = EXCLUDED.hmf_applicable,
    hmf_rate = EXCLUDED.hmf_rate,
    hmf_description = EXCLUDED.hmf_description,
    brokerage_min_usd = EXCLUDED.brokerage_min_usd,
    brokerage_max_usd = EXCLUDED.brokerage_max_usd,
    other_charges = EXCLUDED.other_charges,
    data_confidence = EXCLUDED.data_confidence;

COMMIT;
