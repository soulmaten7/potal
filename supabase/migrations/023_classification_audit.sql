-- F008: HS Classification Audit Trail
-- Records every classification event for compliance and debugging

CREATE TABLE IF NOT EXISTS hs_classification_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  seller_id TEXT,
  product_name TEXT NOT NULL,
  product_category TEXT,
  hs_code_input TEXT,
  hs_code_result TEXT NOT NULL,
  hs_description TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  confidence_grade TEXT,
  classification_source TEXT NOT NULL,
  alternatives JSONB DEFAULT '[]'::jsonb,
  processing_time_ms INTEGER DEFAULT 0,
  ip_address TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_seller_id ON hs_classification_audit (seller_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON hs_classification_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_hs_code ON hs_classification_audit (hs_code_result);
CREATE INDEX IF NOT EXISTS idx_audit_source ON hs_classification_audit (classification_source);
CREATE INDEX IF NOT EXISTS idx_audit_confidence ON hs_classification_audit (confidence);

-- Auto-cleanup: partition by month or retain 90 days
-- (optional — can be added via Cron later)
COMMENT ON TABLE hs_classification_audit IS 'F008: Classification audit trail for compliance and debugging';
