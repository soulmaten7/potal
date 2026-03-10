-- Migration: 015_lookup_functions.sql
-- Description: Create helper functions for landed cost calculations
-- Created: 2026-03-07 13:38:51

-- Function to get all components needed for TLC calculation
CREATE OR REPLACE FUNCTION lookup_landed_cost_components(
    p_hs_code TEXT,
    p_origin TEXT,
    p_destination TEXT
)
RETURNS TABLE (
    destination_country_code TEXT,
    destination_country_name TEXT,
    origin_country_code TEXT,
    origin_country_name TEXT,
    vat_standard_rate NUMERIC,
    vat_has_vat BOOLEAN,
    vat_name TEXT,
    duty_threshold_usd NUMERIC,
    tax_threshold_usd NUMERIC,
    de_minimis_notes TEXT,
    customs_processing_fee_type TEXT,
    customs_processing_fee_rate NUMERIC,
    customs_processing_fee_min NUMERIC,
    customs_processing_fee_max NUMERIC,
    customs_hmf_applicable BOOLEAN,
    customs_hmf_rate NUMERIC,
    customs_brokerage_min_usd NUMERIC,
    customs_brokerage_max_usd NUMERIC,
    shared_fta_abbreviation TEXT,
    shared_fta_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c_dest.iso_code_2 AS destination_country_code,
        c_dest.country_name AS destination_country_name,
        c_orig.iso_code_2 AS origin_country_code,
        c_orig.country_name AS origin_country_name,
        vat.standard_rate AS vat_standard_rate,
        vat.has_vat AS vat_has_vat,
        vat.vat_name AS vat_name,
        dm.duty_threshold_usd AS duty_threshold_usd,
        dm.tax_threshold_usd AS tax_threshold_usd,
        dm.notes AS de_minimis_notes,
        cf.processing_fee_type AS customs_processing_fee_type,
        cf.processing_fee_rate AS customs_processing_fee_rate,
        cf.processing_fee_min AS customs_processing_fee_min,
        cf.processing_fee_max AS customs_processing_fee_max,
        cf.hmf_applicable AS customs_hmf_applicable,
        cf.hmf_rate AS customs_hmf_rate,
        cf.brokerage_min_usd AS customs_brokerage_min_usd,
        cf.brokerage_max_usd AS customs_brokerage_max_usd,
        fa.fta_abbreviation AS shared_fta_abbreviation,
        fa_ref.fta_type AS shared_fta_type
    FROM countries c_dest
    LEFT JOIN countries c_orig ON c_orig.iso_code_2 = p_origin
    LEFT JOIN vat_gst_rates vat ON vat.country_code = c_dest.iso_code_2
    LEFT JOIN de_minimis_thresholds dm ON dm.country_code = c_dest.iso_code_2
    LEFT JOIN customs_fees cf ON cf.country_code = c_dest.iso_code_2
    LEFT JOIN fta_country_pairs fa ON (fa.country_a = p_origin AND fa.country_b = c_dest.iso_code_2)
        OR (fa.country_b = p_origin AND fa.country_a = c_dest.iso_code_2)
    LEFT JOIN fta_agreements fa_ref ON fa_ref.fta_abbreviation = fa.fta_abbreviation
    WHERE c_dest.iso_code_2 = p_destination;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if two countries share an FTA
CREATE OR REPLACE FUNCTION check_fta_between_countries(
    p_country_a TEXT,
    p_country_b TEXT
)
RETURNS TABLE (
    fta_abbreviation TEXT,
    fta_name TEXT,
    fta_type TEXT,
    year_entered_force INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.fta_abbreviation,
        fa_ref.fta_name,
        fa_ref.fta_type,
        fa_ref.year_entered_force
    FROM fta_country_pairs fa
    LEFT JOIN fta_agreements fa_ref ON fa_ref.fta_abbreviation = fa.fta_abbreviation
    WHERE (fa.country_a = p_country_a AND fa.country_b = p_country_b)
        OR (fa.country_b = p_country_a AND fa.country_a = p_country_b);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all FTAs a country is part of
CREATE OR REPLACE FUNCTION get_country_ftas(
    p_country_code TEXT
)
RETURNS TABLE (
    fta_abbreviation TEXT,
    fta_name TEXT,
    fta_type TEXT,
    year_entered_force INTEGER,
    status TEXT,
    member_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fa.fta_abbreviation,
        fa.fta_name,
        fa.fta_type,
        fa.year_entered_force,
        fa.status,
        array_length(fa.member_countries, 1)::INTEGER AS member_count
    FROM fta_agreements fa
    WHERE fa.member_countries::text LIKE '%' || p_country_code || '%';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate effective tariff between origin and destination
-- Returns 0% if FTA exists, otherwise returns the standard MFN rate (placeholder for future tariff data)
CREATE OR REPLACE FUNCTION get_effective_tariff_rate(
    p_hs_code TEXT,
    p_origin TEXT,
    p_destination TEXT
)
RETURNS NUMERIC AS $$
DECLARE
    v_has_fta BOOLEAN;
BEGIN
    -- Check if countries share an FTA
    SELECT EXISTS(
        SELECT 1 FROM fta_country_pairs
        WHERE (country_a = p_origin AND country_b = p_destination)
            OR (country_b = p_origin AND country_a = p_destination)
    ) INTO v_has_fta;
    
    IF v_has_fta THEN
        RETURN 0.00;
    ELSE
        -- Return placeholder for MFN rate (would need tariff schedule data)
        -- For now, return NULL to indicate data not available
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMIT;
