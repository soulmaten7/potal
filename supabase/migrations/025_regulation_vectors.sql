-- F126: Regulation Vectors table for 240-country RAG
-- Stores regulation documents with embeddings for vector similarity search

CREATE TABLE IF NOT EXISTS regulation_vectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  effective_date DATE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regulation_vectors_country ON regulation_vectors(country_code);
CREATE INDEX IF NOT EXISTS idx_regulation_vectors_topic ON regulation_vectors(topic);
CREATE INDEX IF NOT EXISTS idx_regulation_vectors_country_topic ON regulation_vectors(country_code, topic);
CREATE INDEX IF NOT EXISTS idx_regulation_vectors_effective_date ON regulation_vectors(effective_date);

-- Vector similarity index (ivfflat)
CREATE INDEX IF NOT EXISTS idx_regulation_vectors_embedding ON regulation_vectors
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_regulation_vectors(
  query_embedding vector(1536),
  match_country CHAR(2),
  match_topic TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  country_code CHAR(2),
  topic TEXT,
  title TEXT,
  content TEXT,
  source_url TEXT,
  effective_date DATE,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rv.id,
    rv.country_code,
    rv.topic,
    rv.title,
    rv.content,
    rv.source_url,
    rv.effective_date,
    1 - (rv.embedding <=> query_embedding) AS similarity
  FROM regulation_vectors rv
  WHERE rv.country_code = match_country
    AND (match_topic IS NULL OR rv.topic = match_topic)
    AND 1 - (rv.embedding <=> query_embedding) >= match_threshold
  ORDER BY rv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE regulation_vectors ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY regulation_vectors_service_all ON regulation_vectors
  FOR ALL USING (true) WITH CHECK (true);
