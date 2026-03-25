-- F143: Support Chat Enhancements — Chat logs, feedback, FAQ analytics

-- Chat logs
CREATE TABLE IF NOT EXISTS support_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL DEFAULT 'anonymous',
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai',
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_chat_logs_session ON support_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_logs_created ON support_chat_logs(created_at DESC);

-- Chat feedback
CREATE TABLE IF NOT EXISTS support_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES support_chat_logs(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ analytics
CREATE TABLE IF NOT EXISTS support_faq_analytics (
  faq_id TEXT PRIMARY KEY,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE support_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_faq_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_access_chat_logs" ON support_chat_logs FOR ALL USING (true);
CREATE POLICY "service_access_chat_feedback" ON support_chat_feedback FOR ALL USING (true);
CREATE POLICY "service_access_faq_analytics" ON support_faq_analytics FOR ALL USING (true);
