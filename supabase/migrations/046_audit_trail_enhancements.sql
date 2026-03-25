-- F008: Audit Trail Enhancements
-- Indexes for query performance + archive table for retention

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_actor ON data_update_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_action ON data_update_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON data_update_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_area ON data_update_log(area);

-- Archive table for retention cleanup
CREATE TABLE IF NOT EXISTS archive_audit_logs (
  LIKE data_update_log INCLUDING ALL
);
