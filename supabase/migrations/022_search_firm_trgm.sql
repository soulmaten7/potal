-- Search firm names in trade_remedy_duties using pg_trgm similarity
-- Requires pg_trgm extension (already enabled for product_hs_mappings)
CREATE OR REPLACE FUNCTION search_firm_trgm(
  query_name TEXT,
  case_ids TEXT[],
  min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE(firm_name TEXT, similarity FLOAT)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT d.firm_name::TEXT,
         similarity(d.firm_name, query_name)::FLOAT AS similarity
  FROM trade_remedy_duties d
  WHERE d.case_id = ANY(case_ids)
    AND d.firm_name IS NOT NULL
    AND d.firm_name != ''
    AND similarity(d.firm_name, query_name) >= min_similarity
  ORDER BY similarity DESC
  LIMIT 1;
$$;
