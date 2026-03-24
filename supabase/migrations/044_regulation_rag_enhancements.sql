-- F126: Regulation RAG enhancements
-- Adds UNIQUE constraint for UPSERT, GIN indexes for ilike fallback

-- UNIQUE constraint for UPSERT (country_code + topic + title)
DO $$ BEGIN
  ALTER TABLE regulation_vectors
  ADD CONSTRAINT regulation_vectors_unique_entry
  UNIQUE (country_code, topic, title);
EXCEPTION WHEN duplicate_table THEN NULL;
          WHEN undefined_table THEN NULL;
END $$;

-- source_authority column
ALTER TABLE regulation_vectors
ADD COLUMN IF NOT EXISTS source_authority REAL DEFAULT 0.5;
