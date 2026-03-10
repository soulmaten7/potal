-- Migration: 010_country_metadata.sql
-- Description: Create countries master reference table
-- Created: 2026-03-07 13:38:10

CREATE TABLE IF NOT EXISTS countries (
    iso_code_2 TEXT PRIMARY KEY,
    iso_code_3 TEXT UNIQUE NOT NULL,
    country_name TEXT NOT NULL,
    currency_code TEXT,
    currency_name TEXT,
    currency_symbol TEXT,
    continent TEXT,
    region TEXT,
    economic_bloc TEXT[],
    un_m49_code INTEGER,
    is_eu_member BOOLEAN DEFAULT FALSE,
    is_ldc BOOLEAN DEFAULT FALSE,
    income_level TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_countries_iso_code_3 ON countries(iso_code_3);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region);
CREATE INDEX IF NOT EXISTS idx_countries_income_level ON countries(income_level);

BEGIN;

INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AF', 'AFG', 'Afghanistan', 'AFN', 'Afghan Afghani', '؋', 'Asia', 'South Asia', '{"SAARC"}', 4, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AL', 'ALB', 'Albania', 'ALL', 'Albanian Lek', 'L', 'Europe', 'Southeast Europe', NULL, 8, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('DZ', 'DZA', 'Algeria', 'DZD', 'Algerian Dinar', 'د.ج', 'Africa', 'North Africa', '{"AU","Arab League"}', 12, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AS', 'ASM', 'American Samoa', 'USD', 'US Dollar', '$', 'Oceania', 'Polynesia', NULL, 16, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AD', 'AND', 'Andorra', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', '{"EU"}', 20, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AO', 'AGO', 'Angola', 'AOA', 'Angolan Kwanza', 'Kz', 'Africa', 'Central Africa', '{"AU","SADC"}', 24, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AI', 'AIA', 'Anguilla', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 660, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AG', 'ATG', 'Antigua and Barbuda', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 28, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AR', 'ARG', 'Argentina', 'ARS', 'Argentine Peso', '$', 'South America', 'South America', '{"MERCOSUR"}', 32, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AM', 'ARM', 'Armenia', 'AMD', 'Armenian Dram', '֏', 'Asia', 'West Asia', '{"EAEU","CIS"}', 51, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AW', 'ABW', 'Aruba', 'AWG', 'Aruban Florin', 'ƒ', 'North America', 'Caribbean', NULL, 533, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AU', 'AUS', 'Australia', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Oceania', '{"OECD"}', 36, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AT', 'AUT', 'Austria', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', '{"EU","EEA","Eurozone","OECD"}', 40, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AZ', 'AZE', 'Azerbaijan', 'AZN', 'Azerbaijani Manat', '₼', 'Asia', 'West Asia', '{"EAEU","CIS"}', 31, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BS', 'BHS', 'Bahamas', 'BSD', 'Bahamian Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 44, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BH', 'BHR', 'Bahrain', 'BHD', 'Bahraini Dinar', '.د.ب', 'Asia', 'West Asia', '{"GCC","Arab League"}', 48, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BD', 'BGD', 'Bangladesh', 'BDT', 'Bangladeshi Taka', '৳', 'Asia', 'South Asia', '{"SAARC","RCEP"}', 50, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BB', 'BRB', 'Barbados', 'BBD', 'Barbadian Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 52, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BY', 'BLR', 'Belarus', 'BYN', 'Belarusian Ruble', 'Br', 'Europe', 'Eastern Europe', '{"EAEU","CIS"}', 112, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BE', 'BEL', 'Belgium', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', '{"EU","EEA","Eurozone","OECD"}', 56, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BZ', 'BLZ', 'Belize', 'BZD', 'Belize Dollar', '$', 'North America', 'Central America', '{"CARICOM"}', 84, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BJ', 'BEN', 'Benin', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 204, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BM', 'BMU', 'Bermuda', 'BMD', 'Bermudian Dollar', '$', 'North America', 'North America', NULL, 60, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BT', 'BTN', 'Bhutan', 'BTN', 'Bhutanese Ngultrum', 'Nu.', 'Asia', 'South Asia', '{"SAARC"}', 64, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BO', 'BOL', 'Bolivia', 'BOB', 'Bolivian Boliviano', 'Bs.', 'South America', 'South America', '{"MERCOSUR"}', 68, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BQ', 'BES', 'Bonaire, Sint Eustatius and Saba', 'USD', 'US Dollar', '$', 'North America', 'Caribbean', NULL, 535, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BA', 'BIH', 'Bosnia', 'BAM', 'Bosnia and Herzegovina Convertible Mark', 'KM', 'Europe', 'Southeast Europe', NULL, 70, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BW', 'BWA', 'Botswana', 'BWP', 'Botswanan Pula', 'P', 'Africa', 'Southern Africa', '{"AU","SADC"}', 72, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BR', 'BRA', 'Brazil', 'BRL', 'Brazilian Real', 'R$', 'South America', 'South America', '{"MERCOSUR","BRICS"}', 76, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IO', 'IOT', 'British Indian Ocean Territory', 'USD', 'US Dollar', '$', 'Asia', 'South Asia', NULL, 86, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('VG', 'VGB', 'British Virgin Islands', 'USD', 'US Dollar', '$', 'North America', 'Caribbean', NULL, 92, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BN', 'BRN', 'Brunei', 'BND', 'Brunei Dollar', '$', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 96, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BG', 'BGR', 'Bulgaria', 'BGN', 'Bulgarian Lev', 'лв', 'Europe', 'Southeast Europe', '{"EU","EEA"}', 100, TRUE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BF', 'BFA', 'Burkina Faso', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 854, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BI', 'BDI', 'Burundi', 'BIF', 'Burundian Franc', 'Fr', 'Africa', 'East Africa', '{"AU","EAC"}', 108, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KH', 'KHM', 'Cambodia', 'KHR', 'Cambodian Riel', '៛', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 116, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CM', 'CMR', 'Cameroon', 'XAF', 'Central African CFA Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","CEMAC"}', 120, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CA', 'CAN', 'Canada', 'CAD', 'Canadian Dollar', '$', 'North America', 'North America', '{"OECD","USMCA"}', 124, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CV', 'CPV', 'Cape Verde', 'CVE', 'Cape Verdean Escudo', 'Esc', 'Africa', 'West Africa', '{"AU"}', 132, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KY', 'CYM', 'Cayman Islands', 'KYD', 'Cayman Islands Dollar', '$', 'North America', 'Caribbean', NULL, 136, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CF', 'CAF', 'Central African Republic', 'XAF', 'Central African CFA Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","CEMAC"}', 140, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TD', 'TCD', 'Chad', 'XAF', 'Central African CFA Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","CEMAC"}', 148, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CL', 'CHL', 'Chile', 'CLP', 'Chilean Peso', '$', 'South America', 'South America', '{"OECD"}', 152, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CN', 'CHN', 'China', 'CNY', 'Chinese Yuan Renminbi', '¥', 'Asia', 'East Asia', '{"RCEP","BRICS"}', 156, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CX', 'CXR', 'Christmas Island', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Oceania', NULL, 162, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CC', 'CCK', 'Cocos (Keeling) Islands', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Oceania', NULL, 166, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CO', 'COL', 'Colombia', 'COP', 'Colombian Peso', '$', 'South America', 'South America', NULL, 170, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KM', 'COM', 'Comoros', 'KMF', 'Comorian Franc', 'Fr', 'Africa', 'East Africa', '{"AU"}', 174, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CK', 'COK', 'Cook Islands', 'NZD', 'New Zealand Dollar', '$', 'Oceania', 'Polynesia', NULL, 184, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CR', 'CRI', 'Costa Rica', 'CRC', 'Costa Rican Colon', '₡', 'North America', 'Central America', NULL, 188, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('HR', 'HRV', 'Croatia', 'EUR', 'Euro', '€', 'Europe', 'Southeast Europe', '{"EU","EEA","Eurozone"}', 191, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CU', 'CUB', 'Cuba', 'CUP', 'Cuban Peso', '₱', 'North America', 'Caribbean', NULL, 192, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CW', 'CUW', 'Curaçao', 'ANG', 'Netherlands Antillean Guilder', 'ƒ', 'North America', 'Caribbean', NULL, 531, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CY', 'CYP', 'Cyprus', 'EUR', 'Euro', '€', 'Europe', 'Southeast Europe', '{"EU","EEA","Eurozone"}', 196, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CZ', 'CZE', 'Czech Republic', 'CZK', 'Czech Koruna', 'Kč', 'Europe', 'Central Europe', '{"EU","EEA"}', 203, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CD', 'COD', 'DR Congo', 'CDF', 'Congolese Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","SADC"}', 180, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('DK', 'DNK', 'Denmark', 'DKK', 'Danish Krone', 'kr', 'Europe', 'Northern Europe', '{"EU","EEA"}', 208, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('DJ', 'DJI', 'Djibouti', 'DJF', 'Djiboutian Franc', 'Fr', 'Africa', 'East Africa', '{"AU"}', 262, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('DM', 'DMA', 'Dominica', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 212, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('DO', 'DOM', 'Dominican Republic', 'DOP', 'Dominican Peso', 'RD$', 'North America', 'Caribbean', NULL, 214, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('EC', 'ECU', 'Ecuador', 'USD', 'US Dollar', '$', 'South America', 'South America', NULL, 218, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('EG', 'EGY', 'Egypt', 'EGP', 'Egyptian Pound', '£', 'Africa', 'North Africa', '{"AU","Arab League"}', 818, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SV', 'SLV', 'El Salvador', 'USD', 'US Dollar', '$', 'North America', 'Central America', NULL, 222, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GQ', 'GNQ', 'Equatorial Guinea', 'XAF', 'Central African CFA Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","CEMAC"}', 226, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ER', 'ERI', 'Eritrea', 'ERN', 'Eritrean Nakfa', 'Nfk', 'Africa', 'East Africa', '{"AU"}', 232, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('EE', 'EST', 'Estonia', 'EUR', 'Euro', '€', 'Europe', 'Northern Europe', '{"EU","EEA","Eurozone"}', 233, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SZ', 'SWZ', 'Eswatini', 'SZL', 'Eswatini Lilangeni', 'L', 'Africa', 'Southern Africa', '{"AU","SADC"}', 748, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ET', 'ETH', 'Ethiopia', 'ETB', 'Ethiopian Birr', 'Br', 'Africa', 'East Africa', '{"AU"}', 231, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('FK', 'FLK', 'Falkland Islands', 'FKP', 'Falkland Islands Pound', '£', 'South America', 'South America', NULL, 238, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('FO', 'FRO', 'Faroe Islands', 'DKK', 'Danish Krone', 'kr', 'Europe', 'Northern Europe', NULL, 234, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('FJ', 'FJI', 'Fiji', 'FJD', 'Fijian Dollar', '$', 'Oceania', 'Melanesia', NULL, 242, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('FI', 'FIN', 'Finland', 'EUR', 'Euro', '€', 'Europe', 'Northern Europe', '{"EU","EEA","Eurozone"}', 246, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('FR', 'FRA', 'France', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', '{"EU","EEA","Eurozone","OECD"}', 250, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GF', 'GUF', 'French Guiana', 'EUR', 'Euro', '€', 'South America', 'South America', NULL, 254, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PF', 'PYF', 'French Polynesia', 'XPF', 'CFP Franc', '₣', 'Oceania', 'Polynesia', NULL, 258, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GA', 'GAB', 'Gabon', 'XAF', 'Central African CFA Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","CEMAC"}', 266, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GM', 'GMB', 'Gambia', 'GMD', 'Gambian Dalasi', 'D', 'Africa', 'West Africa', '{"AU"}', 270, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GE', 'GEO', 'Georgia', 'GEL', 'Georgian Lari', '₾', 'Asia', 'West Asia', NULL, 268, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('DE', 'DEU', 'Germany', 'EUR', 'Euro', '€', 'Europe', 'Central Europe', '{"EU","EEA","Eurozone","OECD"}', 276, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GH', 'GHA', 'Ghana', 'GHS', 'Ghanaian Cedi', '₵', 'Africa', 'West Africa', '{"AU"}', 288, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GI', 'GIB', 'Gibraltar', 'GIP', 'Gibraltar Pound', '£', 'Europe', 'Southern Europe', NULL, 292, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GR', 'GRC', 'Greece', 'EUR', 'Euro', '€', 'Europe', 'Southern Europe', '{"EU","EEA","Eurozone"}', 300, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GL', 'GRL', 'Greenland', 'DKK', 'Danish Krone', 'kr', 'North America', 'North America', NULL, 304, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GD', 'GRD', 'Grenada', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 308, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GP', 'GLP', 'Guadeloupe', 'EUR', 'Euro', '€', 'North America', 'Caribbean', NULL, 312, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GU', 'GUM', 'Guam', 'USD', 'US Dollar', '$', 'Oceania', 'Micronesia', NULL, 316, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GT', 'GTM', 'Guatemala', 'GTQ', 'Guatemalan Quetzal', 'Q', 'North America', 'Central America', NULL, 320, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GG', 'GGY', 'Guernsey', 'GBP', 'British Pound', '£', 'Europe', 'Northern Europe', NULL, 831, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GN', 'GIN', 'Guinea', 'GNF', 'Guinean Franc', 'Fr', 'Africa', 'West Africa', '{"AU"}', 324, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GW', 'GNB', 'Guinea-Bissau', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 624, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GY', 'GUY', 'Guyana', 'GYD', 'Guyanese Dollar', '$', 'South America', 'South America', '{"CARICOM"}', 328, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('HT', 'HTI', 'Haiti', 'HTG', 'Haitian Gourde', 'G', 'North America', 'Caribbean', '{"CARICOM"}', 332, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('HN', 'HND', 'Honduras', 'HNL', 'Honduran Lempira', 'L', 'North America', 'Central America', NULL, 340, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('HK', 'HKG', 'Hong Kong', 'HKD', 'Hong Kong Dollar', '$', 'Asia', 'East Asia', NULL, 344, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('HU', 'HUN', 'Hungary', 'HUF', 'Hungarian Forint', 'Ft', 'Europe', 'Central Europe', '{"EU","EEA"}', 348, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IS', 'ISL', 'Iceland', 'ISK', 'Icelandic Króna', 'kr', 'Europe', 'Northern Europe', '{"EEA","OECD"}', 352, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IN', 'IND', 'India', 'INR', 'Indian Rupee', '₹', 'Asia', 'South Asia', '{"SAARC","RCEP","BRICS"}', 356, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ID', 'IDN', 'Indonesia', 'IDR', 'Indonesian Rupiah', 'Rp', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 360, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IR', 'IRN', 'Iran', 'IRR', 'Iranian Rial', '﷼', 'Asia', 'West Asia', '{"ECO"}', 364, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IQ', 'IRQ', 'Iraq', 'IQD', 'Iraqi Dinar', 'د.ع', 'Asia', 'West Asia', '{"OPEC","Arab League"}', 368, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IE', 'IRL', 'Ireland', 'EUR', 'Euro', '€', 'Europe', 'Northern Europe', '{"EU","EEA","Eurozone","OECD"}', 372, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IM', 'IMN', 'Isle of Man', 'GBP', 'British Pound', '£', 'Europe', 'Northern Europe', NULL, 833, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IL', 'ISR', 'Israel', 'ILS', 'Israeli Shekel', '₪', 'Asia', 'West Asia', '{"OECD"}', 376, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('IT', 'ITA', 'Italy', 'EUR', 'Euro', '€', 'Europe', 'Southern Europe', '{"EU","EEA","Eurozone","OECD"}', 380, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CI', 'CIV', 'Ivory Coast', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 384, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('JM', 'JAM', 'Jamaica', 'JMD', 'Jamaican Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 388, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('JP', 'JPN', 'Japan', 'JPY', 'Japanese Yen', '¥', 'Asia', 'East Asia', '{"OECD"}', 392, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('JE', 'JEY', 'Jersey', 'GBP', 'British Pound', '£', 'Europe', 'Northern Europe', NULL, 832, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('JO', 'JOR', 'Jordan', 'JOD', 'Jordanian Dinar', 'د.ا', 'Asia', 'West Asia', '{"Arab League"}', 400, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KZ', 'KAZ', 'Kazakhstan', 'KZT', 'Kazakhstani Tenge', '₸', 'Asia', 'Central Asia', '{"EAEU"}', 398, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KE', 'KEN', 'Kenya', 'KES', 'Kenyan Shilling', 'Sh', 'Africa', 'East Africa', '{"AU","EAC"}', 404, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KI', 'KIR', 'Kiribati', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Micronesia', NULL, 296, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('XK', 'XKX', 'Kosovo', 'EUR', 'Euro', '€', 'Europe', 'Southeast Europe', NULL, 906, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KW', 'KWT', 'Kuwait', 'KWD', 'Kuwaiti Dinar', 'د.ك', 'Asia', 'West Asia', '{"GCC","OPEC","Arab League"}', 414, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KG', 'KGZ', 'Kyrgyzstan', 'KGS', 'Kyrgyzstani Som', 'с', 'Asia', 'Central Asia', '{"EAEU"}', 417, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LA', 'LAO', 'Laos', 'LAK', 'Laotian Kip', '₭', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 418, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LV', 'LVA', 'Latvia', 'EUR', 'Euro', '€', 'Europe', 'Northern Europe', '{"EU","EEA","Eurozone"}', 428, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LB', 'LBN', 'Lebanon', 'LBP', 'Lebanese Pound', '£', 'Asia', 'West Asia', '{"Arab League"}', 422, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LS', 'LSO', 'Lesotho', 'LSL', 'Lesotho Loti', 'L', 'Africa', 'Southern Africa', '{"AU","SADC"}', 426, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LR', 'LBR', 'Liberia', 'LRD', 'Liberian Dollar', '$', 'Africa', 'West Africa', '{"AU"}', 430, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LY', 'LBY', 'Libya', 'LYD', 'Libyan Dinar', 'ل.د', 'Africa', 'North Africa', '{"AU","Arab League"}', 434, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LI', 'LIE', 'Liechtenstein', 'CHF', 'Swiss Franc', 'Fr', 'Europe', 'Western Europe', '{"EFTA","EEA"}', 438, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LT', 'LTU', 'Lithuania', 'EUR', 'Euro', '€', 'Europe', 'Northern Europe', '{"EU","EEA","Eurozone"}', 440, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LU', 'LUX', 'Luxembourg', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', '{"EU","EEA","Eurozone"}', 442, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MO', 'MAC', 'Macau', 'MOP', 'Macanese Pataca', 'P', 'Asia', 'East Asia', NULL, 446, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MG', 'MDG', 'Madagascar', 'MGA', 'Malagasy Ariary', 'Ar', 'Africa', 'East Africa', '{"AU","SADC"}', 450, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MW', 'MWI', 'Malawi', 'MWK', 'Malawian Kwacha', 'MK', 'Africa', 'Southern Africa', '{"AU","SADC"}', 454, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MY', 'MYS', 'Malaysia', 'MYR', 'Malaysian Ringgit', 'RM', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 458, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MV', 'MDV', 'Maldives', 'MVR', 'Maldivian Rufiyaa', 'Rf', 'Asia', 'South Asia', '{"SAARC"}', 462, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ML', 'MLI', 'Mali', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 466, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MT', 'MLT', 'Malta', 'EUR', 'Euro', '€', 'Europe', 'Southern Europe', '{"EU","EEA","Eurozone"}', 470, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MH', 'MHL', 'Marshall Islands', 'USD', 'US Dollar', '$', 'Oceania', 'Micronesia', NULL, 584, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MQ', 'MTQ', 'Martinique', 'EUR', 'Euro', '€', 'North America', 'Caribbean', NULL, 474, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MR', 'MRT', 'Mauritania', 'MRU', 'Mauritanian Ouguiya', 'UM', 'Africa', 'West Africa', '{"AU","Arab League"}', 478, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MU', 'MUS', 'Mauritius', 'MUR', 'Mauritian Rupee', '₨', 'Africa', 'East Africa', '{"AU"}', 480, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('YT', 'MYT', 'Mayotte', 'EUR', 'Euro', '€', 'Africa', 'East Africa', NULL, 175, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MX', 'MEX', 'Mexico', 'MXN', 'Mexican Peso', '$', 'North America', 'North America', '{"OECD","USMCA"}', 484, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('FM', 'FSM', 'Micronesia', 'USD', 'US Dollar', '$', 'Oceania', 'Micronesia', NULL, 583, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MD', 'MDA', 'Moldova', 'MDL', 'Moldovan Leu', 'L', 'Europe', 'Eastern Europe', '{"CIS"}', 498, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MC', 'MCO', 'Monaco', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', NULL, 492, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MN', 'MNG', 'Mongolia', 'MNT', 'Mongolian Tugrik', '₮', 'Asia', 'East Asia', NULL, 496, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ME', 'MNE', 'Montenegro', 'EUR', 'Euro', '€', 'Europe', 'Southeast Europe', NULL, 499, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MS', 'MSR', 'Montserrat', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 500, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MA', 'MAR', 'Morocco', 'MAD', 'Moroccan Dirham', 'د.م.', 'Africa', 'North Africa', '{"AU","Arab League"}', 504, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MZ', 'MOZ', 'Mozambique', 'MZN', 'Mozambican Metical', 'MT', 'Africa', 'Southern Africa', '{"AU","SADC"}', 508, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MM', 'MMR', 'Myanmar', 'MMK', 'Myanmar Kyat', 'K', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 104, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NA', 'NAM', 'Namibia', 'NAD', 'Namibian Dollar', '$', 'Africa', 'Southern Africa', '{"AU","SADC"}', 516, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NR', 'NRU', 'Nauru', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Micronesia', NULL, 520, FALSE, TRUE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NP', 'NPL', 'Nepal', 'NPR', 'Nepalese Rupee', '₨', 'Asia', 'South Asia', '{"SAARC"}', 524, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NL', 'NLD', 'Netherlands', 'EUR', 'Euro', '€', 'Europe', 'Western Europe', '{"EU","EEA","Eurozone","OECD"}', 528, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NC', 'NCL', 'New Caledonia', 'XPF', 'CFP Franc', '₣', 'Oceania', 'Melanesia', NULL, 540, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NZ', 'NZL', 'New Zealand', 'NZD', 'New Zealand Dollar', '$', 'Oceania', 'Oceania', '{"OECD"}', 554, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NI', 'NIC', 'Nicaragua', 'NIO', 'Nicaraguan Córdoba', 'C$', 'North America', 'Central America', NULL, 558, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NE', 'NER', 'Niger', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 562, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NG', 'NGA', 'Nigeria', 'NGN', 'Nigerian Naira', '₦', 'Africa', 'West Africa', '{"AU","OPEC"}', 566, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NU', 'NIU', 'Niue', 'NZD', 'New Zealand Dollar', '$', 'Oceania', 'Polynesia', NULL, 570, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NF', 'NFK', 'Norfolk Island', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Oceania', NULL, 574, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KP', 'PRK', 'North Korea', 'KPW', 'North Korean Won', '₩', 'Asia', 'East Asia', NULL, 408, FALSE, FALSE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MK', 'MKD', 'North Macedonia', 'MKD', 'North Macedonian Denar', 'ден', 'Europe', 'Southeast Europe', NULL, 807, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MP', 'MNP', 'Northern Mariana Islands', 'USD', 'US Dollar', '$', 'Oceania', 'Micronesia', NULL, 580, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('NO', 'NOR', 'Norway', 'NOK', 'Norwegian Krone', 'kr', 'Europe', 'Northern Europe', '{"EEA","OECD"}', 578, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('OM', 'OMN', 'Oman', 'OMR', 'Omani Rial', 'ر.ع.', 'Asia', 'West Asia', '{"GCC","Arab League"}', 512, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PK', 'PAK', 'Pakistan', 'PKR', 'Pakistani Rupee', '₨', 'Asia', 'South Asia', '{"SAARC","RCEP"}', 586, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PW', 'PLW', 'Palau', 'USD', 'US Dollar', '$', 'Oceania', 'Micronesia', NULL, 585, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PS', 'PSE', 'Palestine', 'ILS', 'Israeli Shekel', '₪', 'Asia', 'West Asia', '{"Arab League"}', 275, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PA', 'PAN', 'Panama', 'PAB', 'Panamanian Balboa', 'B/.', 'North America', 'Central America', NULL, 591, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PG', 'PNG', 'Papua New Guinea', 'PGK', 'Papua New Guinean Kina', 'K', 'Oceania', 'Melanesia', NULL, 598, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PY', 'PRY', 'Paraguay', 'PYG', 'Paraguayan Guarani', '₲', 'South America', 'South America', '{"MERCOSUR"}', 600, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PE', 'PER', 'Peru', 'PEN', 'Peruvian Sol', 'S/', 'South America', 'South America', NULL, 604, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PH', 'PHL', 'Philippines', 'PHP', 'Philippine Peso', '₱', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 608, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PL', 'POL', 'Poland', 'PLN', 'Polish Zloty', 'zł', 'Europe', 'Central Europe', '{"EU","EEA"}', 616, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PT', 'PRT', 'Portugal', 'EUR', 'Euro', '€', 'Europe', 'Southern Europe', '{"EU","EEA","Eurozone"}', 620, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PR', 'PRI', 'Puerto Rico', 'USD', 'US Dollar', '$', 'North America', 'Caribbean', NULL, 630, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('QA', 'QAT', 'Qatar', 'QAR', 'Qatari Riyal', 'ر.ق', 'Asia', 'West Asia', '{"GCC","OPEC","Arab League"}', 634, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CG', 'COG', 'Republic of Congo', 'XAF', 'Central African CFA Franc', 'Fr', 'Africa', 'Central Africa', '{"AU","CEMAC"}', 178, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('RO', 'ROU', 'Romania', 'RON', 'Romanian Leu', 'lei', 'Europe', 'Southeast Europe', '{"EU","EEA"}', 642, TRUE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('RW', 'RWA', 'Rwanda', 'RWF', 'Rwandan Franc', 'Fr', 'Africa', 'East Africa', '{"AU","EAC"}', 646, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('RE', 'REU', 'Réunion', 'EUR', 'Euro', '€', 'Africa', 'East Africa', NULL, 638, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('BL', 'BLM', 'Saint Barthélemy', 'EUR', 'Euro', '€', 'North America', 'Caribbean', NULL, 652, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SH', 'SHN', 'Saint Helena', 'SHP', 'Saint Helena Pound', '£', 'Africa', 'West Africa', NULL, 654, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KN', 'KNA', 'Saint Kitts and Nevis', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 659, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LC', 'LCA', 'Saint Lucia', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 662, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('MF', 'MAF', 'Saint Martin (French)', 'EUR', 'Euro', '€', 'North America', 'Caribbean', NULL, 663, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('PM', 'SPM', 'Saint Pierre and Miquelon', 'EUR', 'Euro', '€', 'North America', 'North America', NULL, 666, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('VC', 'VCT', 'Saint Vincent and the Grenadines', 'XCD', 'East Caribbean Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 670, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('WS', 'WSM', 'Samoa', 'WST', 'Samoan Tala', 'T', 'Oceania', 'Polynesia', NULL, 882, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SM', 'SMR', 'San Marino', 'EUR', 'Euro', '€', 'Europe', 'Southern Europe', NULL, 674, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SA', 'SAU', 'Saudi Arabia', 'SAR', 'Saudi Riyal', 'ر.س', 'Asia', 'West Asia', '{"GCC","OPEC","Arab League"}', 682, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SN', 'SEN', 'Senegal', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 686, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('RS', 'SRB', 'Serbia', 'RSD', 'Serbian Dinar', 'дин', 'Europe', 'Southeast Europe', NULL, 688, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SC', 'SYC', 'Seychelles', 'SCR', 'Seychellois Rupee', '₨', 'Africa', 'East Africa', '{"AU","SADC"}', 690, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SL', 'SLE', 'Sierra Leone', 'SLE', 'Sierra Leonean Leone', 'Le', 'Africa', 'West Africa', '{"AU"}', 694, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SG', 'SGP', 'Singapore', 'SGD', 'Singapore Dollar', '$', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 702, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SX', 'SXM', 'Sint Maarten', 'ANG', 'Netherlands Antillean Guilder', 'ƒ', 'North America', 'Caribbean', NULL, 534, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SK', 'SVK', 'Slovakia', 'EUR', 'Euro', '€', 'Europe', 'Central Europe', '{"EU","EEA","Eurozone"}', 703, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SI', 'SVN', 'Slovenia', 'EUR', 'Euro', '€', 'Europe', 'Central Europe', '{"EU","EEA","Eurozone"}', 705, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SB', 'SLB', 'Solomon Islands', 'SBD', 'Solomon Islands Dollar', '$', 'Oceania', 'Melanesia', NULL, 90, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SO', 'SOM', 'Somalia', 'SOS', 'Somali Shilling', 'Sh', 'Africa', 'East Africa', '{"AU"}', 706, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ZA', 'ZAF', 'South Africa', 'ZAR', 'South African Rand', 'R', 'Africa', 'Southern Africa', '{"AU","SADC","BRICS"}', 710, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('KR', 'KOR', 'South Korea', 'KRW', 'South Korean Won', '₩', 'Asia', 'East Asia', '{"OECD"}', 410, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SS', 'SSD', 'South Sudan', 'SSP', 'South Sudanese Pound', '£', 'Africa', 'East Africa', '{"AU"}', 728, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ES', 'ESP', 'Spain', 'EUR', 'Euro', '€', 'Europe', 'Southern Europe', '{"EU","EEA","Eurozone","OECD"}', 724, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('LK', 'LKA', 'Sri Lanka', 'LKR', 'Sri Lankan Rupee', 'Rs', 'Asia', 'South Asia', '{"SAARC"}', 144, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SD', 'SDN', 'Sudan', 'SDG', 'Sudanese Pound', '£', 'Africa', 'North Africa', '{"AU","Arab League"}', 729, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SR', 'SUR', 'Suriname', 'SRD', 'Surinamese Dollar', '$', 'South America', 'South America', '{"CARICOM"}', 740, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SJ', 'SJM', 'Svalbard and Jan Mayen', 'NOK', 'Norwegian Krone', 'kr', 'Europe', 'Northern Europe', NULL, 744, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SE', 'SWE', 'Sweden', 'SEK', 'Swedish Krona', 'kr', 'Europe', 'Northern Europe', '{"EU","EEA"}', 752, TRUE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('CH', 'CHE', 'Switzerland', 'CHF', 'Swiss Franc', 'Fr', 'Europe', 'Western Europe', '{"EFTA","EEA","OECD"}', 756, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('SY', 'SYR', 'Syria', 'SYP', 'Syrian Pound', '£', 'Asia', 'West Asia', '{"Arab League"}', 760, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ST', 'STP', 'São Tomé and Príncipe', 'STN', 'São Tomé and Príncipe Dobra', 'Db', 'Africa', 'Central Africa', '{"AU"}', 678, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TW', 'TWN', 'Taiwan', 'TWD', 'New Taiwan Dollar', '$', 'Asia', 'East Asia', '{"RCEP"}', 158, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TJ', 'TJK', 'Tajikistan', 'TJS', 'Tajikistani Somoni', 'ЅМ', 'Asia', 'Central Asia', '{"EAEU"}', 762, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TZ', 'TZA', 'Tanzania', 'TZS', 'Tanzanian Shilling', 'Sh', 'Africa', 'East Africa', '{"AU","EAC"}', 834, FALSE, FALSE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TH', 'THA', 'Thailand', 'THB', 'Thai Baht', '฿', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 764, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TL', 'TLS', 'Timor-Leste', 'USD', 'US Dollar', '$', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 626, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TG', 'TGO', 'Togo', 'XOF', 'West African CFA Franc', 'Fr', 'Africa', 'West Africa', '{"AU","WAEMU"}', 768, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TK', 'TKL', 'Tokelau', 'NZD', 'New Zealand Dollar', '$', 'Oceania', 'Polynesia', NULL, 772, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TO', 'TON', 'Tonga', 'TOP', 'Tongan Paanga', 'T$', 'Oceania', 'Polynesia', NULL, 776, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TT', 'TTO', 'Trinidad', 'TTD', 'Trinidad and Tobago Dollar', '$', 'North America', 'Caribbean', '{"CARICOM"}', 780, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TN', 'TUN', 'Tunisia', 'TND', 'Tunisian Dinar', 'د.ت', 'Africa', 'North Africa', '{"AU","Arab League"}', 788, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TR', 'TUR', 'Turkey', 'TRY', 'Turkish Lira', '₺', 'Asia', 'West Asia', '{"OECD"}', 792, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TM', 'TKM', 'Turkmenistan', 'TMT', 'Turkmenistani Manat', 'm', 'Asia', 'Central Asia', '{"EAEU"}', 795, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TC', 'TCA', 'Turks and Caicos Islands', 'USD', 'US Dollar', '$', 'North America', 'Caribbean', NULL, 796, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('TV', 'TUV', 'Tuvalu', 'AUD', 'Australian Dollar', '$', 'Oceania', 'Polynesia', NULL, 798, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('VI', 'VIR', 'US Virgin Islands', 'USD', 'US Dollar', '$', 'North America', 'Caribbean', NULL, 850, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('UG', 'UGA', 'Uganda', 'UGX', 'Ugandan Shilling', 'Sh', 'Africa', 'East Africa', '{"AU","EAC"}', 800, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('UA', 'UKR', 'Ukraine', 'UAH', 'Ukrainian Hryvnia', '₴', 'Europe', 'Eastern Europe', '{"CIS"}', 804, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AE', 'ARE', 'United Arab Emirates', 'AED', 'United Arab Emirates Dirham', 'د.إ', 'Asia', 'West Asia', '{"GCC","OPEC","Arab League"}', 784, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('GB', 'GBR', 'United Kingdom', 'GBP', 'British Pound', '£', 'Europe', 'Northern Europe', '{"OECD"}', 826, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('US', 'USA', 'United States', 'USD', 'US Dollar', '$', 'North America', 'North America', '{"OECD"}', 840, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('UY', 'URY', 'Uruguay', 'UYU', 'Uruguayan Peso', '$', 'South America', 'South America', '{"MERCOSUR"}', 858, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('UZ', 'UZB', 'Uzbekistan', 'UZS', 'Uzbekistani Som', 'сўм', 'Asia', 'Central Asia', '{"EAEU"}', 860, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('VU', 'VUT', 'Vanuatu', 'VUV', 'Vanuatu Vatu', 'Vt', 'Oceania', 'Melanesia', NULL, 548, FALSE, TRUE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('VE', 'VEN', 'Venezuela', 'VES', 'Venezuelan Bolívar', 'Bs', 'South America', 'South America', '{"OPEC"}', 862, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('VN', 'VNM', 'Vietnam', 'VND', 'Vietnamese Dong', '₫', 'Asia', 'Southeast Asia', '{"ASEAN","RCEP"}', 704, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('WF', 'WLF', 'Wallis and Futuna', 'XPF', 'CFP Franc', '₣', 'Oceania', 'Polynesia', NULL, 876, FALSE, FALSE, 'upper_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('YE', 'YEM', 'Yemen', 'YER', 'Yemeni Rial', '﷼', 'Asia', 'West Asia', '{"Arab League"}', 887, FALSE, TRUE, 'low')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ZM', 'ZMB', 'Zambia', 'ZMW', 'Zambian Kwacha', 'ZK', 'Africa', 'Southern Africa', '{"AU","SADC"}', 894, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('ZW', 'ZWE', 'Zimbabwe', 'ZWL', 'Zimbabwean Dollar', '$', 'Africa', 'Southern Africa', '{"AU","SADC"}', 716, FALSE, FALSE, 'lower_middle')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;
INSERT INTO countries (iso_code_2, iso_code_3, country_name, currency_code, currency_name, currency_symbol, continent, region, economic_bloc, un_m49_code, is_eu_member, is_ldc, income_level)
VALUES ('AX', 'ALA', 'Åland Islands', 'EUR', 'Euro', '€', 'Europe', 'Northern Europe', NULL, 248, FALSE, FALSE, 'high')
ON CONFLICT (iso_code_2) DO UPDATE SET
    iso_code_3 = EXCLUDED.iso_code_3,
    country_name = EXCLUDED.country_name,
    currency_code = EXCLUDED.currency_code,
    currency_name = EXCLUDED.currency_name,
    currency_symbol = EXCLUDED.currency_symbol,
    continent = EXCLUDED.continent,
    region = EXCLUDED.region,
    economic_bloc = EXCLUDED.economic_bloc,
    un_m49_code = EXCLUDED.un_m49_code,
    is_eu_member = EXCLUDED.is_eu_member,
    is_ldc = EXCLUDED.is_ldc,
    income_level = EXCLUDED.income_level;

COMMIT;
