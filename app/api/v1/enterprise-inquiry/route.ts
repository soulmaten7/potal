// app/api/v1/enterprise-inquiry/route.ts
// Enterprise 문의 접수 → DB 저장 → 자동 이메일 발송 → 텔레그램 알림
// D9 Customer Acquisition — Layer 1 Full Automation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEnterpriseProposalEmail } from '@/app/lib/notifications/enterprise-email';
import { notifyNewEnterpriseLead } from '@/app/lib/notifications/telegram';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const ALLOWED_ORIGINS = [
  'https://www.potal.app',
  'https://potal.app',
  'http://localhost:3000',
];

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const { company_name, contact_email, contact_name, estimated_volume } = body;

    if (!company_name || !contact_email) {
      return NextResponse.json(
        { error: 'company_name and contact_email are required' },
        { status: 400, headers }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers }
      );
    }

    // 1. DB에 리드 저장 (UPSERT)
    const supabase = getSupabase();
    const { data: lead, error: dbError } = await supabase
      .from('enterprise_leads')
      .upsert(
        {
          company_name,
          contact_email: contact_email.toLowerCase().trim(),
          contact_name: contact_name || null,
          estimated_volume: estimated_volume || null,
          source: 'website_form',
          status: 'proposal_sent',
          proposal_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'contact_email' }
      )
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to save lead', details: dbError.message },
        { status: 500, headers }
      );
    }

    // 2. Resend API로 Capability Deck + Questionnaire 자동 발송
    const emailResult = await sendEnterpriseProposalEmail({
      to: contact_email,
      contactName: contact_name,
      companyName: company_name,
    });

    // 3. Telegram 알림
    await notifyNewEnterpriseLead(
      company_name,
      contact_email,
      contact_name,
      estimated_volume
    );

    // 4. 응답
    return NextResponse.json(
      {
        success: true,
        lead_id: lead?.id,
        email_sent: emailResult.success,
        email_error: emailResult.error || null,
        message: emailResult.success
          ? 'Proposal sent successfully'
          : 'Lead saved but email failed — manual follow-up needed',
      },
      { status: 200, headers }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500, headers }
    );
  }
}
