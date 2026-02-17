/**
 * Contact Form API — /api/contact
 *
 * Supabase에 문의 내용 저장.
 *
 * ⚠️ Supabase에 `contact_messages` 테이블이 필요합니다.
 * 아래 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:
 *
 * CREATE TABLE IF NOT EXISTS public.contact_messages (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   type TEXT NOT NULL DEFAULT 'general',
 *   name TEXT NOT NULL,
 *   email TEXT NOT NULL,
 *   message TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 *
 * -- RLS: 누구나 INSERT 가능 (문의 폼), SELECT는 불가
 * ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Anyone can insert contact messages"
 *   ON public.contact_messages FOR INSERT
 *   WITH CHECK (true);
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { type, name, email, message } = await request.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Supabase가 설정되어 있으면 DB에 저장
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('contact_messages')
        .insert({ type: type || 'general', name, email, message });

      if (error) {
        console.error('❌ [Contact] Supabase insert error:', error.message);
        // 테이블이 없어도 성공으로 처리 (MVP — 로그만 기록)
      } else {
        console.log(`📬 [Contact] Saved: ${type} from ${email}`);
      }
    } else {
      // Supabase 미설정 → 콘솔 로그만
      console.log(`📬 [Contact] (no DB) ${type} | ${name} <${email}> | ${message.slice(0, 100)}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ [Contact] Route error:', err);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
