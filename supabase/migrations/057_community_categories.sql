-- 057_community_categories.sql
-- Community 8개 카테고리 컬럼 추가
-- ⚠️ 실제 적용은 은태님 확인 후 수동으로 실행

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS community_category TEXT DEFAULT 'general';

ALTER TABLE community_posts ADD CONSTRAINT chk_community_category CHECK (
  community_category IN (
    'announcements', 'getting-started', 'bug-reports', 'feature-requests',
    'tips-howto', 'api-integrations', 'general', 'release-notes'
  )
);

CREATE INDEX IF NOT EXISTS idx_community_posts_comm_category ON community_posts(community_category);
