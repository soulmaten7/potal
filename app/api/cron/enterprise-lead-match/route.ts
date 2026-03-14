// app/api/cron/enterprise-lead-match/route.ts
// 매 30분 실행: enterprise_leads 현황 체크 + 이메일 회신 매칭
// D9 Customer Acquisition — Layer 1 Automation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyQuestionnaireReceived } from '@/app/lib/notifications/telegram';

const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // proposal_sent 상태인 리드 조회
    const { data: activeLeads, error: leadsError } = await supabase
      .from('enterprise_leads')
      .select('id, company_name, contact_email, status, proposal_sent_at, created_at')
      .eq('status', 'proposal_sent');

    if (leadsError || !activeLeads?.length) {
      return NextResponse.json({
        success: true,
        message: 'No active leads to check',
        checked: 0,
        matched: 0,
      });
    }

    // 5일 이상 미회신 리드 체크
    const now = new Date();
    const staleLeads = activeLeads.filter((lead) => {
      const sentAt = new Date(lead.proposal_sent_at || lead.created_at);
      const daysSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSent > 5;
    });

    return NextResponse.json({
      success: true,
      active_leads: activeLeads.length,
      stale_leads: staleLeads.length,
      lead_emails: activeLeads.map((l) => l.contact_email),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    );
  }
}

// POST: Make.com 또는 Resend Inbound에서 이메일 도착 알림 받기
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const fromEmail = (body.from_email || body.from || '').toLowerCase().trim();

    if (!fromEmail) {
      return NextResponse.json({ error: 'from_email required' }, { status: 400 });
    }

    // enterprise_leads에서 매칭
    const { data: lead, error: leadError } = await supabase
      .from('enterprise_leads')
      .select('*')
      .eq('contact_email', fromEmail)
      .eq('status', 'proposal_sent')
      .single();

    if (leadError || !lead) {
      return NextResponse.json({
        matched: false,
        message: 'No matching enterprise lead — classified as general inquiry',
      });
    }

    // 매칭됨 → status 업데이트
    const { error: updateError } = await supabase
      .from('enterprise_leads')
      .update({
        status: 'questionnaire_received',
        questionnaire_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update lead', details: updateError.message },
        { status: 500 }
      );
    }

    // 텔레그램 알림
    await notifyQuestionnaireReceived(lead.company_name, lead.contact_email);

    return NextResponse.json({
      matched: true,
      company_name: lead.company_name,
      contact_email: lead.contact_email,
      new_status: 'questionnaire_received',
      message: `Questionnaire reply detected from ${lead.company_name}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    );
  }
}
