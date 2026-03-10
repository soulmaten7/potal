-- Migration: 014_fta_agreements.sql
-- Description: Create FTA agreements and country pairs tables
-- Created: 2026-03-07 13:38:39

CREATE TABLE IF NOT EXISTS fta_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fta_name TEXT NOT NULL,
    fta_abbreviation TEXT NOT NULL UNIQUE,
    fta_type TEXT,
    year_entered_force INTEGER,
    status TEXT,
    member_countries JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fta_abbreviation ON fta_agreements(fta_abbreviation);
CREATE INDEX IF NOT EXISTS idx_fta_type ON fta_agreements(fta_type);
CREATE INDEX IF NOT EXISTS idx_fta_status ON fta_agreements(status);

CREATE TABLE IF NOT EXISTS fta_country_pairs (
    country_a TEXT NOT NULL,
    country_b TEXT NOT NULL,
    fta_abbreviation TEXT NOT NULL REFERENCES fta_agreements(fta_abbreviation),
    PRIMARY KEY (country_a, country_b, fta_abbreviation)
);

CREATE INDEX IF NOT EXISTS idx_fta_pair_country_a ON fta_country_pairs(country_a);
CREATE INDEX IF NOT EXISTS idx_fta_pair_country_b ON fta_country_pairs(country_b);
CREATE INDEX IF NOT EXISTS idx_fta_pair_abbrev ON fta_country_pairs(fta_abbreviation);

BEGIN;

INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Regional Comprehensive Economic Partnership', 'RCEP', 'multilateral', 2022, 'active', '["AU", "BN", "KH", "CN", "ID", "JP", "KR", "LA", "MY", "MM", "NZ", "PH", "SG", "TH", "VN"]'::jsonb, 'Entered into force on 1 January 2022 for 10 members. Korea joined 1 Feb 2022, Malaysia 18 Mar 2022, Indonesia 2 Jan 2023, Philippines 2 Jun 2023. Myanmar and Philippines have not ratified.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Comprehensive and Progressive Agreement for Trans-Pacific Partnership', 'CPTPP', 'multilateral', 2018, 'active', '["AU", "BN", "CA", "CL", "JP", "MY", "MX", "NZ", "PE", "SG", "GB", "VN"]'::jsonb, '11 original signatories (2018). UK joined as first accession member. Uruguay, UAE, Philippines and Indonesia are meeting criteria to join.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('United States-Mexico-Canada Agreement', 'USMCA', 'trilateral', 2020, 'active', '["US", "MX", "CA"]'::jsonb, 'Entered into force on 1 July 2020. Replaced NAFTA (1994).')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('African Continental Free Trade Area', 'AfCFTA', 'multilateral', 2021, 'active', '["DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "SZ", "TZ", "TG", "TN", "UG", "ZM", "ZW"]'::jsonb, 'Signed 21 March 2018, entered into force 30 May 2019. Trading commenced 1 January 2021. 49 countries have ratified as of December 2025.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('European Union Single Market and Customs Union', 'EU', 'customs_union', 1993, 'active', '["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]'::jsonb, '27 member states as of 2020 (UK left in 2020). Economic and political union with full customs union.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('European Free Trade Association', 'EFTA', 'multilateral', 1960, 'active', '["IS", "LI", "NO", "CH"]'::jsonb, 'Four member states. Iceland, Liechtenstein, and Norway are also part of EEA. Switzerland has bilateral agreements with EU.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('European Economic Area', 'EEA', 'multilateral', 1994, 'active', '["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO"]'::jsonb, 'Links EU (27 states) with EFTA states (3: Iceland, Liechtenstein, Norway). Creates single internal market.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Southern Common Market', 'Mercosur', 'customs_union', 1995, 'active', '["AR", "BR", "PY", "UY", "BO"]'::jsonb, 'Established 1991 (Treaty of Asunción), entered into force 1995. Bolivia became full member 8 July 2024. Venezuela suspended since December 2016. Associate members: CL, CO, EC, GY, PA, PE, SR.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('ASEAN Free Trade Area', 'AFTA', 'multilateral', 1992, 'active', '["BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Common Effective Preferential Tariff (CEPT) agreement signed 1992. Original 6 members expanded to 10. ASEAN Trade in Goods Agreement (ATIGA) replaced AFTA in 2010.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Gulf Cooperation Council Customs Union', 'GCC', 'customs_union', 2003, 'active', '["BH", "KW", "OM", "QA", "SA", "AE"]'::jsonb, 'GCC formed 1981. Common external tariff established. Full customs union operational. Six member states.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Pacific Alliance', 'PA', 'multilateral', 2011, 'active', '["CL", "CO", "MX", "PE"]'::jsonb, 'Established 28 April 2011. Four founding members. Costa Rica and Panama are candidate members. 55 observer states.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('EU-Japan Economic Partnership Agreement', 'EU-Japan EPA', 'bilateral', 2019, 'active', '["EU", "JP"]'::jsonb, 'Covers 600+ million people. Signed 17 July 2018, entered into force 1 February 2019. Largest trade bloc agreement at the time.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('EU-South Korea Free Trade Agreement', 'EU-SK FTA', 'bilateral', 2015, 'active', '["EU", "KR"]'::jsonb, 'Signed 6 October 2010. Provisionally applied from 1 July 2011. Entered into force 13 December 2015. EU''s first FTA with Asian country.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('EU-Canada Comprehensive Economic and Trade Agreement', 'CETA', 'bilateral', 2017, 'active', '["EU", "CA"]'::jsonb, 'Provisionally applied 21 September 2017. Full entry into force pending completion of EU member state ratifications. Removes 98% of tariffs.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('EU-United Kingdom Trade and Cooperation Agreement', 'TCA', 'bilateral', 2021, 'active', '["EU", "GB"]'::jsonb, 'Signed 30 December 2020. Provisionally applied 1 January 2021. Formally entered into force 1 May 2021. Governs post-Brexit trade.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('United States-South Korea Free Trade Agreement', 'KORUS FTA', 'bilateral', 2012, 'active', '["US", "KR"]'::jsonb, 'Signed 6 June 2007 (renegotiated December 2010). Entered into force 15 March 2012. Eliminates most tariffs on manufactured goods and agricultural products.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('United States-Australia Free Trade Agreement', 'US-Australia FTA', 'bilateral', 2005, 'active', '["US", "AU"]'::jsonb, 'Signed 18 May 2004. Entered into force 1 January 2005. Made 97% of Australia''s non-agricultural exports duty free.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('United States-Israel Free Trade Agreement', 'US-Israel FTA', 'bilateral', 1985, 'active', '["US", "IL"]'::jsonb, 'Signed 22 April 1985. Entered into force 1 September 1985. First FTA signed by United States. Eliminates all duties and most restrictions on goods.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('China-ASEAN Free Trade Area', 'ACFTA', 'multilateral', 2010, 'active', '["CN", "BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Framework signed 4 November 2002. Full implementation January 2010. ACFTA 3.0 negotiations started November 2022. Covers 1.9 billion people.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Republic of Korea-ASEAN Free Trade Agreement', 'AKFTA', 'multilateral', 2010, 'active', '["KR", "BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Framework Agreement signed 2005. Three component agreements signed 2006-2009. Entered into force 1 January 2010. Eliminates tariffs on 80% of goods.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Japan-ASEAN Comprehensive Economic Partnership', 'AJCEP', 'multilateral', 2008, 'active', '["JP", "BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Framework signed 8 October 2003. Signed 14 April 2008. Entered into force 1 December 2008. Covers 752+ million people.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('India-ASEAN Free Trade Area', 'AIFTA', 'multilateral', 2010, 'active', '["IN", "BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Framework signed 8 October 2003. Trade in Goods Agreement signed 13 August 2009, entered into force 1 January 2010. Trade in Services/Investment 2015. Covers 1.8 billion people.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('China-Australia Free Trade Agreement', 'ChAFTA', 'bilateral', 2015, 'active', '["CN", "AU"]'::jsonb, 'Signed 17 June 2015. Entered into force 20 December 2015. First bilateral FTA between China and developed country. 95% of Australian exports tariff free.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('United Kingdom-Japan Comprehensive Economic Partnership Agreement', 'UK-Japan CEPA', 'bilateral', 2021, 'active', '["GB", "JP"]'::jsonb, 'Signed 23 October 2020. Entered into force 1 January 2021. Goes further than EU-Japan EPA in digital trade and financial services.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('United Kingdom-Australia Free Trade Agreement', 'UK-Australia FTA', 'bilateral', 2023, 'active', '["GB", "AU"]'::jsonb, 'Signed 17 December 2021. Entered into force 31 May 2023. First ''new'' UK FTA post-Brexit. Eliminates tariffs on 99% of Australian exports.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Australia-New Zealand Closer Economic Relations Trade Agreement', 'CER', 'bilateral', 1983, 'active', '["AU", "NZ"]'::jsonb, 'Signed 1983. Considered world''s most comprehensive bilateral FTA. All tariffs eliminated by 1 July 1990. Covers goods, services, investment. Two-way trade $32.76 billion (2024).')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Thailand-Australia Free Trade Agreement', 'TAFTA', 'bilateral', 2005, 'active', '["TH", "AU"]'::jsonb, 'Entered into force 1 January 2005. Thailand''s first comprehensive FTA and first with developed country. All tariffs phase to zero by 2020-2025.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('ASEAN-Hong Kong, China Free Trade Agreement', 'AHKFTA', 'multilateral', 2021, 'active', '["HK", "BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Signed 12 November 2017. Entered into force 12 February 2021. Includes goods, services, investment, and e-commerce provisions. First protocol amended January 2024.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('India-Singapore Comprehensive Economic Cooperation Agreement', 'CECA', 'bilateral', 2005, 'active', '["IN", "SG"]'::jsonb, 'Signed 29 June 2005. More than 3,000 tariffs zeroed. Covers goods, services, investment, and double taxation avoidance. Bilateral trade $35.6B (2023-24).')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('Eurasian Economic Union', 'EAEU', 'customs_union', 2015, 'active', '["RU", "BY", "KZ", "KG", "AM"]'::jsonb, 'Established by Treaty 2014. Entered into force 1 January 2015. Five member states. Russia, Belarus, Kazakhstan founding members. Armenia joined 2 January 2015, Kyrgyzstan 6 August 2015.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;
INSERT INTO fta_agreements (fta_name, fta_abbreviation, fta_type, year_entered_force, status, member_countries, notes)
VALUES ('ASEAN Trade in Goods Agreement', 'ATIGA', 'multilateral', 2010, 'active', '["BN", "ID", "MY", "PH", "SG", "TH", "VN", "LA", "MM", "KH"]'::jsonb, 'Signed February 2009. Entered into force 17 May 2010. Replaced AFTA. As of 2025, tariffs on 98.86% of products fully eliminated. ATIGA Upgrade signed October 2025.')
ON CONFLICT (fta_abbreviation) DO UPDATE SET
    fta_name = EXCLUDED.fta_name,
    fta_type = EXCLUDED.fta_type,
    year_entered_force = EXCLUDED.year_entered_force,
    status = EXCLUDED.status,
    member_countries = EXCLUDED.member_countries,
    notes = EXCLUDED.notes;

COMMIT;

BEGIN;

INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'BN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'KH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'CN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'ID', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'JP', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'KR', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'CN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'JP', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KR', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'CN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'ID', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'JP', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'KR', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KH', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'ID', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'JP', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'KR', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'JP', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KR', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'KR', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'LA', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MY', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'NZ', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'PH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'RCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'BN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'CA', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'CL', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'JP', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'MY', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'MX', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'CA', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'CL', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'JP', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MX', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'CL', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'JP', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'MY', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'MX', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CA', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'JP', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'MY', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'MX', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'MY', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'MX', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MX', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'NZ', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'PE', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NZ', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PE', 'SG', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PE', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PE', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'GB', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GB', 'VN', 'CPTPP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('US', 'MX', 'USMCA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('US', 'CA', 'USMCA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'CA', 'USMCA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'AO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'BJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'BW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'BF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'BI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'CM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DZ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'BJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'BW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'BF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'BI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'CM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AO', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'BW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'BF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'BI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'CM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BJ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'BF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'BI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'CM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BW', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'BI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'CM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BF', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'CM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BI', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'CV', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CM', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'CF', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CV', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'TD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CF', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'KM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TD', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'CG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KM', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'CD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CG', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'CI', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CD', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'DJ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CI', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'EG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DJ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'GQ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EG', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ER', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GQ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'ET', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ER', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'GA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ET', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'GM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GA', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'GH', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GM', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'GN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GH', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'GW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GN', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'KE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GW', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'LS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KE', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'LR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LS', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'LY', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LR', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'MG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LY', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'MW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MG', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'ML', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MW', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'MR', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ML', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'MU', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MR', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'MA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MU', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'MZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MA', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'NA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MZ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'NE', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NA', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'NG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NE', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'RW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NG', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'ST', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RW', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ST', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'SC', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SN', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'SL', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SC', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'SO', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SL', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'ZA', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SO', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'SS', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZA', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'SD', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SS', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'SZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SD', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SZ', 'TZ', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SZ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SZ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SZ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SZ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SZ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TZ', 'TG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TZ', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TZ', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TZ', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TZ', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TG', 'TN', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TG', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TG', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TG', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TN', 'UG', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TN', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TN', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('UG', 'ZM', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('UG', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ZM', 'ZW', 'AfCFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'BE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'BG', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'HR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'CY', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'CZ', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'DK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'BG', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'HR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'CY', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'CZ', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'DK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'HR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'CY', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'CZ', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'DK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'CY', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'CZ', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'DK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'CZ', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'DK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'DK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'EE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'FI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'FR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'DE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'GR', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'HU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'IE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'IT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LV', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'LT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'LU', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'MT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'NL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'PL', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'PT', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'RO', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'SK', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'SI', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'ES', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ES', 'SE', 'EU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IS', 'LI', 'EFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IS', 'NO', 'EFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IS', 'CH', 'EFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LI', 'NO', 'EFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LI', 'CH', 'EFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NO', 'CH', 'EFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'BE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'BG', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'HR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'CY', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'CZ', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'DK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AT', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'BG', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'HR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'CY', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'CZ', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'DK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BE', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'HR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'CY', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'CZ', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'DK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BG', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'CY', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'CZ', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'DK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HR', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'CZ', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'DK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CY', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'DK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CZ', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'EE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DK', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'FI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EE', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'FR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FI', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'DE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('FR', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'GR', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('DE', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'HU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GR', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'IE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HU', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'IT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IE', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LV', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IT', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'LT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LV', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'LU', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LT', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'MT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LU', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'NL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MT', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'PL', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('NL', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'PT', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PL', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'RO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PT', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'SK', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RO', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'SI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SK', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'ES', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SI', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ES', 'SE', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ES', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ES', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ES', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SE', 'IS', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SE', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SE', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IS', 'LI', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IS', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LI', 'NO', 'EEA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AR', 'BR', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AR', 'PY', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AR', 'UY', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AR', 'BO', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BR', 'PY', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BR', 'UY', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BR', 'BO', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PY', 'UY', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PY', 'BO', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('UY', 'BO', 'Mercosur')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'AFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BH', 'KW', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BH', 'OM', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BH', 'QA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BH', 'SA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BH', 'AE', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KW', 'OM', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KW', 'QA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KW', 'SA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KW', 'AE', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('OM', 'QA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('OM', 'SA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('OM', 'AE', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('QA', 'SA', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('QA', 'AE', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SA', 'AE', 'GCC')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'CO', 'PA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'MX', 'PA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CL', 'PE', 'PA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CO', 'MX', 'PA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CO', 'PE', 'PA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MX', 'PE', 'PA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EU', 'JP', 'EU-Japan EPA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EU', 'KR', 'EU-SK FTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EU', 'CA', 'CETA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('EU', 'GB', 'TCA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('US', 'KR', 'KORUS FTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('US', 'AU', 'US-Australia FTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('US', 'IL', 'US-Israel FTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'BN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'ID', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'MY', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'PH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'SG', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'TH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'ACFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'BN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'ID', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'MY', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'PH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'SG', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'TH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KR', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'AKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'BN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'ID', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'MY', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'PH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'SG', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'TH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('JP', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'AJCEP')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'BN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'ID', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'MY', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'PH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'SG', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'TH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'AIFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('CN', 'AU', 'ChAFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GB', 'JP', 'UK-Japan CEPA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('GB', 'AU', 'UK-Australia FTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('AU', 'NZ', 'CER')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'AU', 'TAFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'BN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'ID', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'MY', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'PH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'SG', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'TH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('HK', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'AHKFTA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('IN', 'SG', 'CECA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RU', 'BY', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RU', 'KZ', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RU', 'KG', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('RU', 'AM', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BY', 'KZ', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BY', 'KG', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BY', 'AM', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KZ', 'KG', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KZ', 'AM', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('KG', 'AM', 'EAEU')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'ID', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MY', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'PH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'SG', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'TH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'VN', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('BN', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MY', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'PH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'SG', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'TH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'VN', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('ID', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'PH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'SG', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'TH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'VN', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MY', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'SG', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'TH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'VN', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('PH', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'TH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'VN', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('SG', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'VN', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('TH', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'LA', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('VN', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'MM', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('LA', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;
INSERT INTO fta_country_pairs (country_a, country_b, fta_abbreviation)
VALUES ('MM', 'KH', 'ATIGA')
ON CONFLICT (country_a, country_b, fta_abbreviation) DO NOTHING;

COMMIT;
