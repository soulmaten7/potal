-- Migration: 065_cw33_sanctions.sql
-- Description: CW33 Sprint 4 — Sanctions sync (OFAC/BIS/EU/UK/UN)
-- Created: 2026-04-11 KST
-- Source: regulations/us/ofac_sanctions/sdn_advanced.xml (123 MB),
--         tlc_data/sanctions/{eu,uk,un}_sanctions*, tlc_data/export_controls/bis_entity_list.json

-- ─── sanctioned_entities ─────────────────────
-- Unified sanction/denied party table aggregating 5 feeds.
CREATE TABLE IF NOT EXISTS sanctioned_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,                -- 'ofac_sdn' | 'bis_entity' | 'eu_consolidated' | 'uk_hmt' | 'un_consolidated'
    source_uid TEXT,                     -- upstream ID (e.g. OFAC sdnType uid)
    entity_type TEXT,                    -- 'individual' | 'organization' | 'vessel' | 'aircraft'
    primary_name TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    addresses JSONB DEFAULT '[]',        -- array of {country, city, street, postal}
    country_code TEXT,                   -- primary listed country (ISO alpha-2)
    nationalities TEXT[] DEFAULT '{}',
    birth_date TEXT,                     -- for individuals
    program_refs TEXT[] DEFAULT '{}',    -- e.g. ['SDGT', 'IRAN-EO13599']
    listed_on DATE,
    last_modified_on DATE,
    legal_citation TEXT,
    source_citation TEXT NOT NULL,
    data_confidence TEXT DEFAULT 'official',
    last_synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source, source_uid)
);

CREATE INDEX IF NOT EXISTS idx_sanc_source ON sanctioned_entities(source);
CREATE INDEX IF NOT EXISTS idx_sanc_primary ON sanctioned_entities(primary_name);
CREATE INDEX IF NOT EXISTS idx_sanc_entity_type ON sanctioned_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_sanc_country ON sanctioned_entities(country_code);

-- Trigram index for fuzzy name matching (requires pg_trgm)
-- Will be created separately if extension exists
-- CREATE INDEX IF NOT EXISTS idx_sanc_name_trgm ON sanctioned_entities USING GIN (primary_name gin_trgm_ops);

COMMENT ON TABLE sanctioned_entities IS 'CW33-S4: Unified sanctions / denied party feed (OFAC SDN + BIS Entity + EU + UK + UN)';
