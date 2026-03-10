-- Migration: 011_vat_gst_rates.sql
-- Description: Create VAT/GST rates table
-- Created: 2026-03-07 13:38:17

CREATE TABLE IF NOT EXISTS vat_gst_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL UNIQUE REFERENCES countries(iso_code_2),
    standard_rate NUMERIC(5,2),
    reduced_rates JSONB,
    vat_name TEXT,
    has_vat BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vat_gst_country_code ON vat_gst_rates(country_code);
CREATE INDEX IF NOT EXISTS idx_vat_gst_has_vat ON vat_gst_rates(has_vat);
CREATE INDEX IF NOT EXISTS idx_vat_gst_standard_rate ON vat_gst_rates(standard_rate);

BEGIN;

INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AF', 0, '[]'::jsonb, 'BRT', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AL', 20.0, '[]'::jsonb, 'TVSH', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('DZ', 19.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AS', 0, '[]'::jsonb, 'None', FALSE, 'US territory. Not part of US customs territory.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AD', 4.5, '[]'::jsonb, 'IGI', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AO', 14.000000000000002, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AI', 13.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AG', 15.0, '[]'::jsonb, 'ABST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AR', 21.0, '[21]'::jsonb, 'IVA', TRUE, 'Additional perception taxes on imports.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AM', 20.0, '[20]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AW', 7.000000000000001, '[]'::jsonb, 'BBO', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AU', 10.0, '[10]'::jsonb, 'GST', TRUE, 'ChAFTA with China. GST on all imports. Duty de minimis AUD 1000.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AT', 20.0, '[10, 13]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AZ', 18.0, '[18]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BS', 12.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BH', 10.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BD', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BB', 17.5, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BY', 20.0, '[10, 20]'::jsonb, 'НДС', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BE', 21.0, '[6, 12, 21]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BZ', 12.5, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BJ', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BM', 0, '[]'::jsonb, 'None', FALSE, 'No income tax, no VAT. Import duty averages 22%.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BT', 5.0, '[]'::jsonb, 'BST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BO', 13.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BQ', 8.0, '[]'::jsonb, 'ABB', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BA', 17.0, '[]'::jsonb, 'PDV', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BW', 14.000000000000002, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BR', 17.0, '[0, 7, 12, 18]'::jsonb, 'ICMS/IPI', TRUE, 'Complex tax: II + IPI + ICMS + PIS/COFINS. Remessa Conforme program.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IO', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('VG', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BN', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BG', 20.0, '[9, 20]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BF', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BI', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KH', 10.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CM', 19.25, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CA', 5.0, '[5]'::jsonb, 'GST', TRUE, 'GST 5% federal + PST/HST varies by province (0-10%).')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CV', 15.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KY', 0, '[]'::jsonb, 'None', FALSE, 'No income tax, no VAT. Import duty is main revenue source.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CF', 19.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TD', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CL', 19.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CN', 13.0, '[]'::jsonb, '增值税', TRUE, 'Cross-border e-commerce has separate tax regime (9.1% composite).')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CX', 10.0, '[]'::jsonb, 'GST', TRUE, 'Australian territory. Same customs/GST as Australia.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CC', 10.0, '[]'::jsonb, 'GST', TRUE, 'Australian territory. Same customs/GST as Australia.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CO', 19.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KM', 10.0, '[]'::jsonb, 'TCA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CK', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CR', 13.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('HR', 25.0, '[5, 13, 25]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CU', 20.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CW', 6.0, '[]'::jsonb, 'OB', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CY', 19.0, '[5, 9, 19]'::jsonb, 'FPA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CZ', 21.0, '[10, 15, 21]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CD', 16.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('DK', 25.0, '[25]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('DJ', 10.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('DM', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('DO', 18.0, '[]'::jsonb, 'ITBIS', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('EC', 12.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('EG', 14.000000000000002, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SV', 13.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GQ', 15.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ER', 5.0, '[]'::jsonb, 'ST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('EE', 22.0, '[9, 20]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SZ', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ET', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('FK', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('FO', 25.0, '[]'::jsonb, 'MVG', TRUE, 'Danish territory. Not part of EU.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('FJ', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('FI', 25.5, '[10, 14, 24]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('FR', 20.0, '[5.5, 10, 20]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GF', 0, '[]'::jsonb, 'None', FALSE, 'French overseas department. Exempt from EU VAT but EU customs.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PF', 16.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GA', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GM', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GE', 18.0, '[18]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('DE', 19.0, '[]'::jsonb, 'VAT', TRUE, 'EU IOSS for goods ≤€150. VAT always applies.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GH', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GI', 0, '[]'::jsonb, 'None', FALSE, 'British Overseas Territory. Not part of EU customs union.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GR', 24.0, '[6, 13, 24]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GL', 0, '[]'::jsonb, 'None', FALSE, 'Not part of EU. Danish territory with separate customs.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GD', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GP', 8.5, '[]'::jsonb, 'TVA', TRUE, 'French overseas department. Reduced VAT rate.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GU', 4.0, '[]'::jsonb, 'GRT', TRUE, 'US territory. 4% GRT (Gross Receipts Tax).')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GT', 12.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GG', 0, '[]'::jsonb, 'None', FALSE, 'Crown dependency. No VAT, no customs duty on most goods.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GN', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GW', 17.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GY', 14.000000000000002, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('HT', 10.0, '[]'::jsonb, 'TCA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('HN', 15.0, '[]'::jsonb, 'ISV', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('HK', 0, '[]'::jsonb, 'None', FALSE, 'Free port. No customs duty, no VAT/GST.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('HU', 27.0, '[5, 18, 27]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IS', 24.0, '[5.5, 24]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IN', 18.0, '[0, 5, 12, 18]'::jsonb, 'GST', TRUE, 'No de minimis. IGST on all imports. BCD varies widely.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ID', 11.0, '[10]'::jsonb, 'VAT', TRUE, 'Very low de minimis (USD 3). VAT on all imports.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IR', 9.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IQ', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IE', 23.0, '[0, 13.5, 23]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IM', 20.0, '[]'::jsonb, 'VAT', TRUE, 'Crown dependency. UK VAT and customs territory.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IL', 17.0, '[17]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('IT', 22.0, '[4, 5, 10, 22]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CI', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('JM', 15.0, '[]'::jsonb, 'GCT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('JP', 10.0, '[10]'::jsonb, '消費税', TRUE, 'RCEP member. De minimis ¥10,000 for customs duty.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('JE', 5.0, '[]'::jsonb, 'GST', TRUE, 'Crown dependency. 5% GST since 2008.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('JO', 16.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KZ', 12.0, '[12]'::jsonb, 'ҚДС', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KE', 16.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KI', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('XK', 18.0, '[]'::jsonb, 'TVSH', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KW', 0, '[]'::jsonb, 'VAT', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KG', 12.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LA', 10.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LV', 21.0, '[5, 12, 21]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LB', 11.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LS', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LR', 10.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LY', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LI', 8.1, '[]'::jsonb, 'MWST', TRUE, 'Swiss customs union. Same tariff as Switzerland.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LT', 21.0, '[5, 9, 21]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LU', 17.0, '[3, 8, 17]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MO', 0, '[]'::jsonb, 'None', FALSE, 'Free port. No customs duty, no VAT/GST (like Hong Kong).')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MG', 20.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MW', 16.5, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MY', 8.0, '[6]'::jsonb, 'SST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MV', 8.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ML', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MT', 18.0, '[5, 18]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MH', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MQ', 8.5, '[]'::jsonb, 'TVA', TRUE, 'French overseas department. Reduced VAT rate.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MR', 16.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MU', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('YT', 0, '[]'::jsonb, 'None', FALSE, 'French overseas department. Exempt from EU VAT.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MX', 16.0, '[16]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('FM', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MD', 20.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MC', 20.0, '[]'::jsonb, 'TVA', TRUE, 'French customs territory. Same tariff as France/EU.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MN', 10.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ME', 21.0, '[]'::jsonb, 'PDV', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MS', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MA', 20.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MZ', 17.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MM', 5.0, '[]'::jsonb, 'CT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NA', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NR', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NP', 13.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NL', 21.0, '[9, 21]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NC', 11.0, '[]'::jsonb, 'TGC', TRUE, 'French territory. Not part of EU. Own customs/tax system.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NZ', 15.0, '[15]'::jsonb, 'GST', TRUE, 'FTA with China. GST collected at border.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NI', 15.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NE', 19.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NG', 7.5, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NU', 12.5, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NF', 10.0, '[]'::jsonb, 'GST', TRUE, 'Australian territory. Same customs/GST as Australia.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KP', 0, '[]'::jsonb, 'None', FALSE, 'Subject to international sanctions. Trade heavily restricted.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MK', 18.0, '[]'::jsonb, 'DDV', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MP', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('NO', 25.0, '[6, 15, 25]'::jsonb, 'VAT', TRUE, 'VOEC scheme: VAT at point of sale for ≤NOK 3000.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('OM', 5.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PK', 17.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PW', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PS', 16.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PA', 7.000000000000001, '[]'::jsonb, 'ITBMS', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PG', 10.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PY', 10.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PE', 18.0, '[]'::jsonb, 'IGV', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PH', 12.0, '[12]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PL', 23.0, '[5, 7, 23]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PT', 23.0, '[6, 13, 23]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PR', 11.5, '[]'::jsonb, 'IVU', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('QA', 0, '[]'::jsonb, 'VAT', FALSE, 'No VAT. Customs duty 5% on most goods.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CG', 18.5, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('RO', 19.0, '[5, 9, 19]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('RW', 18.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('RE', 8.5, '[]'::jsonb, 'TVA', TRUE, 'French overseas department. Reduced VAT. EU customs territory.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('BL', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SH', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KN', 17.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LC', 12.5, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('MF', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('PM', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('VC', 16.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('WS', 15.0, '[]'::jsonb, 'VAGST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SM', 17.0, '[]'::jsonb, 'VAT', TRUE, 'EU customs union agreement.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SA', 15.0, '[15]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SN', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('RS', 20.0, '[10, 20]'::jsonb, 'PDV', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SC', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SL', 15.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SG', 9.0, '[8]'::jsonb, 'GST', TRUE, 'Zero customs duty on most goods. GST on imports >$400 SGD.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SX', 5.0, '[]'::jsonb, 'TOT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SK', 20.0, '[10, 20]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SI', 22.0, '[9.5, 22]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SB', 10.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SO', 5.0, '[]'::jsonb, 'ST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ZA', 15.0, '[15]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('KR', 10.0, '[10]'::jsonb, '부가가치세', TRUE, 'FTA with China. De minimis $150 USD.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SS', 18.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ES', 21.0, '[4, 10, 21]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('LK', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SD', 17.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SR', 10.0, '[]'::jsonb, 'BTW', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SJ', 0, '[]'::jsonb, 'None', FALSE, 'Norwegian territory. Tax-free zone, no customs duty.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SE', 25.0, '[6, 12, 25]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('CH', 8.1, '[2.5, 3.7, 8]'::jsonb, 'VAT', TRUE, 'De minimis based on duty amount, not goods value.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('SY', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ST', 15.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TW', 5.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TJ', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TZ', 18.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TH', 7.000000000000001, '[7]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TL', 2.5, '[]'::jsonb, 'ST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TG', 18.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TK', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TO', 15.0, '[]'::jsonb, 'CT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TT', 12.5, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TN', 19.0, '[]'::jsonb, 'TVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TR', 20.0, '[18]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TM', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TC', 0, '[]'::jsonb, 'None', FALSE, 'No VAT/GST. Revenue from import duties.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('TV', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('VI', 0, '[]'::jsonb, 'None', FALSE, 'US customs territory. Same de minimis as US mainland.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('UG', 18.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('UA', 20.0, '[7, 20]'::jsonb, 'ПДВ', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AE', 5.0, '[0, 5]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('GB', 20.0, '[0, 5, 20]'::jsonb, 'VAT', TRUE, 'VAT collected at point of sale for goods ≤£135.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('US', 0, '[]'::jsonb, 'Sales Tax', TRUE, 'State sales tax varies 0-10.25%. China de minimis eliminated Aug 2025.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('UY', 22.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('UZ', 12.0, '[15]'::jsonb, 'ҚДС', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('VU', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('VE', 16.0, '[]'::jsonb, 'IVA', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('VN', 10.0, '[10]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('WF', 0, '[]'::jsonb, 'None', FALSE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('YE', 5.0, '[]'::jsonb, 'GST', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ZM', 16.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('ZW', 15.0, '[]'::jsonb, 'VAT', TRUE, '')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;
INSERT INTO vat_gst_rates (country_code, standard_rate, reduced_rates, vat_name, has_vat, notes)
VALUES ('AX', 0, '[]'::jsonb, 'None', FALSE, 'Finnish autonomy. EU customs but VAT-exempt for imports.')
ON CONFLICT (country_code) DO UPDATE SET
    standard_rate = EXCLUDED.standard_rate,
    reduced_rates = EXCLUDED.reduced_rates,
    vat_name = EXCLUDED.vat_name,
    has_vat = EXCLUDED.has_vat,
    notes = EXCLUDED.notes;

COMMIT;
