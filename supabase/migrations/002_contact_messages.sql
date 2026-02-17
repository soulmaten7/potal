-- Contact Messages Table
-- POTAL 문의 폼 데이터 저장

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'general',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 누구나 INSERT 가능 (문의 폼), SELECT/UPDATE/DELETE는 불가
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);
