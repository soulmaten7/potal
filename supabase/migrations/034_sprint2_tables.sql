-- Migration 034: Sprint 2 tables
-- Created: 2026-03-15

CREATE TABLE IF NOT EXISTS locked_rates (id serial PRIMARY KEY, quote_id text UNIQUE NOT NULL, from_currency text NOT NULL, to_currency text NOT NULL, rate numeric NOT NULL, locked_at timestamptz DEFAULT now(), expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS idx_locked_rates_quote ON locked_rates(quote_id);

CREATE TABLE IF NOT EXISTS de_minimis_exceptions (id serial PRIMARY KEY, country_code text NOT NULL, excluded_categories text[], shipment_type text DEFAULT 'all', special_rules text, effective_date date, notes text);

CREATE TABLE IF NOT EXISTS country_regulatory_notes (id serial PRIMARY KEY, country_code text NOT NULL, category text, note_text text NOT NULL, effective_date date, source text);

CREATE TABLE IF NOT EXISTS embargo_programs (id serial PRIMARY KEY, country_code text NOT NULL, program_type text NOT NULL, program_name text, sectors text[], exceptions text[], effective_date date, description text);

CREATE TABLE IF NOT EXISTS vat_validation_cache (id serial PRIMARY KEY, vat_number text NOT NULL, country_code text NOT NULL, valid boolean, company_name text, address text, checked_at timestamptz DEFAULT now(), UNIQUE(vat_number, country_code));

CREATE TABLE IF NOT EXISTS report_schedules (id serial PRIMARY KEY, user_id uuid NOT NULL, report_type text NOT NULL, frequency text DEFAULT 'off', last_sent timestamptz, UNIQUE(user_id, report_type));
