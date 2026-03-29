-- 056_community_forum.sql
-- G-1: Community Forum 테이블 설계
-- 게시글 + 댓글 + 추천 — 유저가 버그/질문/제안을 남기는 공간
--
-- ⚠️ 실제 적용은 은태님 확인 후 수동으로 실행

-- 1. community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('bug', 'question', 'suggestion')),
  feature_slug TEXT,
  feature_category TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  upvote_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. community_comments
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. community_upvotes
CREATE TABLE IF NOT EXISTS community_upvotes (
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 4. RLS 정책
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_upvotes ENABLE ROW LEVEL SECURITY;

-- Posts: 누구나 읽기, 로그인 유저만 쓰기, 본인만 수정/삭제
CREATE POLICY "community_posts_select" ON community_posts FOR SELECT USING (true);
CREATE POLICY "community_posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_posts_update" ON community_posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "community_posts_delete" ON community_posts FOR DELETE USING (user_id = auth.uid());

-- Comments: 누구나 읽기, 로그인 유저만 쓰기, 본인만 삭제
CREATE POLICY "community_comments_select" ON community_comments FOR SELECT USING (true);
CREATE POLICY "community_comments_insert" ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_comments_delete" ON community_comments FOR DELETE USING (user_id = auth.uid());

-- Upvotes: 누구나 읽기, 로그인 유저만 쓰기/삭제
CREATE POLICY "community_upvotes_select" ON community_upvotes FOR SELECT USING (true);
CREATE POLICY "community_upvotes_insert" ON community_upvotes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "community_upvotes_delete" ON community_upvotes FOR DELETE USING (user_id = auth.uid());

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS idx_community_posts_feature ON community_posts(feature_slug);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_upvotes ON community_posts(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(feature_category);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at);
