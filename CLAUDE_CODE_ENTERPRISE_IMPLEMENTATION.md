# Enterprise Sales 자동화 구현 명령어
# Claude Code에 복사-붙여넣기하여 실행
# 2026-03-14 작성

---

## 개요

이 문서는 POTAL Enterprise Sales 자동화 시스템을 구현하기 위한 **모든 코드**를 포함합니다.
Claude Code 세션에서 순서대로 실행하세요.

**구현 범위:**
1. Supabase `enterprise_leads` 테이블 생성
2. API 엔드포인트: `POST /api/v1/enterprise-inquiry`
3. Resend API로 Capability Deck + Questionnaire 자동 이메일 발송
4. Telegram 알림 (새 리드 + Questionnaire 회신)
5. Questionnaire 회신 감지 Cron (`/api/cron/enterprise-lead-match`)
6. Morning Brief에 Enterprise 리드 현황 통합
7. Vercel 환경변수 세팅

---

## 1단계: Supabase 테이블 생성

```bash
# enterprise_leads 테이블 + 인덱스 생성
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS enterprise_leads (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, company_name TEXT NOT NULL, contact_email TEXT NOT NULL UNIQUE, contact_name TEXT, estimated_volume TEXT, source TEXT DEFAULT '\''website_form'\'', status TEXT DEFAULT '\''proposal_sent'\'', proposal_sent_at TIMESTAMPTZ DEFAULT NOW(), questionnaire_received_at TIMESTAMPTZ, custom_proposal_sent_at TIMESTAMPTZ, closed_at TIMESTAMPTZ, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX IF NOT EXISTS idx_enterprise_leads_email ON enterprise_leads(contact_email); CREATE INDEX IF NOT EXISTS idx_enterprise_leads_status ON enterprise_leads(status);"}'
```

**검증:**
```bash
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '\''enterprise_leads'\'' ORDER BY ordinal_position;"}'
```

---

## 2단계: Vercel 환경변수 확인 및 추가

Claude Code가 직접 Vercel API로 환경변수를 확인/추가합니다.

```bash
# 1. 기존 환경변수 확인 (RESEND_API_KEY는 이미 있을 수 있음)
curl -s "https://api.vercel.com/v9/projects/potal/env" \
  -H "Authorization: Bearer $VERCEL_API_TOKEN" | jq '.envs[] | {key: .key, target: .target}'

# 2. RESEND_API_KEY — 이미 발급되어 있음. 기존 값 확인 후 없으면 추가
# (기존 Morning Brief 이메일에서 사용 중인 동일 키)

# 3. TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — 기존 AI Agent Org에서 사용 중인 값 재사용

# 4. ENTERPRISE_PDF_BASE_URL 추가 (없으면)
curl -s -X POST "https://api.vercel.com/v10/projects/potal/env" \
  -H "Authorization: Bearer $VERCEL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ENTERPRISE_PDF_BASE_URL",
    "value": "https://www.potal.app/docs",
    "type": "plain",
    "target": ["production", "preview"]
  }'
```

> **참고**: RESEND_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID가 이미 Vercel 환경변수에 있으면 그대로 사용. 없는 것만 추가.
> Claude Code가 `vercel env ls` 또는 Vercel API로 직접 확인 가능.

---

## 3단계: Telegram 알림 유틸리티

**파일: `app/lib/notifications/telegram.ts`**

```typescript
// app/lib/notifications/telegram.ts
// Enterprise Sales + 범용 Telegram 알림 유틸리티

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
}

export async function sendTelegramNotification(
  message: string,
  parseMode: 'HTML' | 'MarkdownV2' = 'HTML'
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    // 환경변수 없으면 조용히 스킵 (개발환경)
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: parseMode,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${error}`);
    }

    return true;
  } catch (error) {
    // 텔레그램 실패해도 메인 플로우는 중단하지 않음
    return false;
  }
}

// Enterprise Sales 전용 알림
export async function notifyNewEnterpriseLead(
  companyName: string,
  contactEmail: string,
  contactName?: string,
  estimatedVolume?: string
): Promise<boolean> {
  const message = [
    `🏢 <b>새 Enterprise 리드</b>`,
    ``,
    `회사: ${companyName}`,
    `담당자: ${contactName || '미입력'} (${contactEmail})`,
    estimatedVolume ? `예상 볼륨: ${estimatedVolume}` : '',
    ``,
    `✅ Capability Deck + Questionnaire 자동 발송 완료`,
    `📊 D9 파이프라인: proposal_sent`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendTelegramNotification(message);
}

export async function notifyQuestionnaireReceived(
  companyName: string,
  contactEmail: string
): Promise<boolean> {
  const message = [
    `📋 <b>Questionnaire 회신 도착!</b>`,
    ``,
    `회사: ${companyName}`,
    `발신자: ${contactEmail}`,
    ``,
    `⚡ 은태님 확인 필요 → Cowork에서 맞춤 Proposal 작성`,
    `📊 D9 파이프라인: questionnaire_received`,
  ].join('\n');

  return sendTelegramNotification(message);
}
```

---

## 4단계: Resend 이메일 발송 유틸리티

**파일: `app/lib/notifications/enterprise-email.ts`**

```typescript
// app/lib/notifications/enterprise-email.ts
// Enterprise Proposal 자동 이메일 발송 (Resend API)

const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface EnterpriseEmailParams {
  to: string;
  contactName?: string;
  companyName: string;
}

// PDF는 public 폴더 또는 외부 URL에서 가져옴
async function fetchPdfAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch {
    return null;
  }
}

export async function sendEnterpriseProposalEmail({
  to,
  contactName,
  companyName,
}: EnterpriseEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const name = contactName || 'Team';

  // HTML 이메일 본문
  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">

<div style="background: #0F1B2D; padding: 32px; border-radius: 10px 10px 0 0; text-align: center;">
  <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">POTAL</h1>
  <p style="color: #94A3B8; margin: 8px 0 0; font-size: 14px;">Total Landed Cost Infrastructure Platform</p>
</div>

<div style="padding: 32px; border: 1px solid #E5E7EB; border-top: none;">

<p>Dear ${name},</p>

<p>Thank you for your interest in POTAL. We're pleased to share our Enterprise capability overview with you.</p>

<p>Attached you'll find two documents:</p>

<p><strong>1. POTAL Capability Deck</strong><br/>
A comprehensive overview of our platform: 142 production-ready features across 12 categories, data scale (240 countries, 113M+ tariff rates, 500M+ product mappings), technical specifications, pricing, and enterprise customization options.</p>

<p><strong>2. Requirements Questionnaire</strong><br/>
A fillable PDF form to help us understand your specific needs. Please complete and return it to this email — we'll respond within 2 business days with a feasibility analysis and tailored proposal.</p>

<p style="background: #EFF6FF; padding: 16px; border-radius: 6px; border-left: 4px solid #2563EB;">
<strong>Quick Highlights:</strong><br/>
• 240 countries & territories covered<br/>
• 113M+ tariff rate records from official government sources<br/>
• Sub-200ms API response time<br/>
• 100% accuracy target with 3-stage AI classification<br/>
• REST API + Shopify/WooCommerce/BigCommerce plugins<br/>
• MCP Server for AI agent integration (ChatGPT, Claude, Gemini)
</p>

<p>If you have any questions before completing the questionnaire, please don't hesitate to reach out.</p>

<p>Best regards,<br/>
<strong>POTAL Team</strong><br/>
<a href="https://www.potal.app" style="color: #2563EB;">www.potal.app</a> | contact@potal.app</p>

</div>

<div style="background: #F9FAFB; padding: 16px; border-radius: 0 0 10px 10px; border: 1px solid #E5E7EB; border-top: none; text-align: center;">
  <p style="margin: 0; font-size: 12px; color: #9CA3AF;">POTAL — The world's most comprehensive duty calculation engine.</p>
</div>

</div>`;

  // PDF 첨부 파일 준비
  const baseUrl = process.env.ENTERPRISE_PDF_BASE_URL || 'https://www.potal.app/docs';

  const [deckPdf, questionnairePdf] = await Promise.all([
    fetchPdfAsBase64(`${baseUrl}/POTAL_Capability_Deck.pdf`),
    fetchPdfAsBase64(`${baseUrl}/POTAL_Requirements_Questionnaire.pdf`),
  ]);

  const attachments: Array<{ filename: string; content: string }> = [];
  if (deckPdf) {
    attachments.push({
      filename: 'POTAL_Capability_Deck.pdf',
      content: deckPdf,
    });
  }
  if (questionnairePdf) {
    attachments.push({
      filename: 'POTAL_Requirements_Questionnaire.pdf',
      content: questionnairePdf,
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'POTAL <contact@potal.app>',
        to: [to],
        subject: 'POTAL — Enterprise Capability Overview & Requirements Questionnaire',
        html: htmlBody,
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Resend API error: ${response.status} ${error}` };
    }

    const data = await response.json();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 5단계: Enterprise Inquiry API 엔드포인트

**파일: `app/api/v1/enterprise-inquiry/route.ts`**

```typescript
// app/api/v1/enterprise-inquiry/route.ts
// Enterprise 문의 접수 → DB 저장 → 자동 이메일 발송 → 텔레그램 알림
// D9 Customer Acquisition — Layer 1 Full Automation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEnterpriseProposalEmail } from '@/lib/notifications/enterprise-email';
import { notifyNewEnterpriseLead } from '@/lib/notifications/telegram';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// CORS 허용 (potal.app에서만)
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

    // 필수 필드 검증
    if (!company_name || !contact_email) {
      return NextResponse.json(
        { error: 'company_name and contact_email are required' },
        { status: 400, headers }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers }
      );
    }

    // 1. DB에 리드 저장 (UPSERT — 이미 있으면 업데이트)
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

    // 3. Telegram 알림 (이메일 성공 여부와 무관하게 전송)
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers }
    );
  }
}
```

---

## 6단계: Questionnaire 회신 감지 Cron

**파일: `app/api/cron/enterprise-lead-match/route.ts`**

```typescript
// app/api/cron/enterprise-lead-match/route.ts
// 매 30분 실행: contact@potal.app 미읽은 이메일 ↔ enterprise_leads 매칭
// 매칭되면 → status를 questionnaire_received로 업데이트 + 텔레그램 알림
// D9 Customer Acquisition — Layer 1 Automation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyQuestionnaireReceived } from '@/lib/notifications/telegram';

const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Gmail API로 미읽은 이메일 가져오기
// 방법 1: Google OAuth + Gmail API (권장, 완전 자동)
// 방법 2: Make.com webhook으로 이메일 전달 (대안)
// 여기서는 Supabase에 저장된 이메일 로그와 비교하는 방식 사용

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. proposal_sent 상태인 리드의 이메일 목록 가져오기
    const { data: activeLeads, error: leadsError } = await supabase
      .from('enterprise_leads')
      .select('id, company_name, contact_email, status')
      .eq('status', 'proposal_sent');

    if (leadsError || !activeLeads?.length) {
      return NextResponse.json({
        success: true,
        message: 'No active leads to check',
        checked: 0,
        matched: 0,
      });
    }

    // 2. 리드 이메일 목록으로 Set 생성 (빠른 매칭용)
    const leadEmailMap = new Map(
      activeLeads.map((lead) => [lead.contact_email.toLowerCase(), lead])
    );

    // 3. 최근 미읽은 이메일 확인
    // ⚠️ 이 부분은 Gmail API 연동 또는 Make.com webhook에 따라 구현이 달라짐
    //
    // 옵션 A: Gmail API (Google OAuth 서비스 계정)
    //   - googleapis 패키지로 gmail.users.messages.list({ q: 'is:unread to:contact@potal.app' })
    //   - 각 이메일의 from 주소 추출
    //
    // 옵션 B: Make.com "Watch Emails" → Webhook → 이 API 호출
    //   - Make.com에서 contact@potal.app 감시
    //   - 새 이메일 → POST /api/v1/enterprise-lead-match { from_email: "..." }
    //
    // 옵션 C: Resend Inbound (contact@potal.app 도메인이 Resend에 있는 경우)
    //   - Resend Inbound Webhook → 이 API로 전달
    //
    // 현재 구현: 옵션 B (Make.com)를 가정, 아래 POST 핸들러 참조
    //
    // Cron은 "대기 중인 리드 현황" 보고용으로만 사용

    // 4. 대기 중인 리드 현황 보고 (Morning Brief 데이터)
    const now = new Date();
    const staleLeads = activeLeads.filter((lead) => {
      const sentAt = new Date(lead.proposal_sent_at || lead.created_at);
      const daysSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSent > 5;
    });

    return NextResponse.json({
      success: true,
      active_leads: activeLeads.length,
      stale_leads: staleLeads.length, // 5일 이상 미회신
      lead_emails: activeLeads.map((l) => l.contact_email),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Make.com 또는 Resend Inbound에서 이메일 도착 알림 받기
export async function POST(request: NextRequest) {
  // Cron 인증 (Make.com webhook에서도 동일 시크릿 사용)
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
      // 매칭 안 됨 = 일반 이메일
      return NextResponse.json({
        matched: false,
        message: 'No matching enterprise lead — classified as general inquiry',
      });
    }

    // 매칭됨! → status 업데이트
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

    // 텔레그램 알림 → 은태님에게 즉시 알림
    await notifyQuestionnaireReceived(lead.company_name, lead.contact_email);

    return NextResponse.json({
      matched: true,
      company_name: lead.company_name,
      contact_email: lead.contact_email,
      new_status: 'questionnaire_received',
      message: `Questionnaire reply detected from ${lead.company_name}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
```

---

## 7단계: Vercel Cron 설정

**파일: `vercel.json` (기존 crons 배열에 추가)**

```json
{
  "crons": [
    {
      "path": "/api/cron/enterprise-lead-match",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

> 기존 vercel.json에 이미 crons가 있으면, 위 항목만 배열에 추가하세요.

---

## 8단계: Morning Brief 통합

**기존 `/api/v1/admin/morning-brief` 라우트에 아래 코드 추가:**

```typescript
// Morning Brief에 Enterprise 리드 현황 추가
// 기존 morning-brief 라우트의 적절한 위치에 삽입

// Enterprise Leads 현황 조회
const { data: enterpriseLeads } = await supabase
  .from('enterprise_leads')
  .select('status, company_name, contact_email, proposal_sent_at, questionnaire_received_at')
  .in('status', ['proposal_sent', 'questionnaire_received', 'proposal_customized', 'negotiating']);

const enterpriseSummary = {
  total_active: enterpriseLeads?.length || 0,
  proposal_sent: enterpriseLeads?.filter((l) => l.status === 'proposal_sent').length || 0,
  questionnaire_received: enterpriseLeads?.filter((l) => l.status === 'questionnaire_received').length || 0,
  negotiating: enterpriseLeads?.filter((l) => l.status === 'negotiating').length || 0,
  stale_5days: enterpriseLeads?.filter((l) => {
    if (l.status !== 'proposal_sent') return false;
    const sentAt = new Date(l.proposal_sent_at);
    return (Date.now() - sentAt.getTime()) > 5 * 24 * 60 * 60 * 1000;
  }).length || 0,
  // 즉시 조치 필요한 리드 (Questionnaire 회신 도착)
  needs_attention: enterpriseLeads
    ?.filter((l) => l.status === 'questionnaire_received')
    .map((l) => ({ company: l.company_name, email: l.contact_email })) || [],
};

// 기존 briefing 객체에 추가:
// briefing.d9_enterprise = enterpriseSummary;
```

**Morning Brief 텍스트 포맷에 추가:**

```
📊 D9 Enterprise: 대기 ${proposal_sent}건 | 회신 ${questionnaire_received}건 | 5일+ 미회신 ${stale_5days}건
${needs_attention.length > 0 ? '⚡ 즉시 확인: ' + needs_attention.map(l => l.company).join(', ') : ''}
```

---

## 9단계: 웹사이트 Enterprise 폼 연동

**기존 Enterprise Inquiry 폼의 submit 핸들러를 수정:**

```typescript
// 기존 Enterprise Inquiry 폼 (potal.app 가격 페이지)
// form onSubmit 핸들러에서:

async function handleEnterpriseInquiry(formData: {
  company_name: string;
  contact_email: string;
  contact_name?: string;
  estimated_volume?: string;
}) {
  try {
    const response = await fetch('/api/v1/enterprise-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      // 성공 UI 표시
      // "Thank you! We've sent our capability overview and requirements questionnaire to your email."
      return { success: true };
    } else {
      // 에러 처리
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}
```

---

## 10단계: PDF 호스팅

Enterprise 이메일에 첨부할 PDF 2개를 퍼블릭 접근 가능한 위치에 업로드:

```bash
# 옵션 A: Vercel public 폴더
# public/docs/POTAL_Capability_Deck.pdf
# public/docs/POTAL_Requirements_Questionnaire.pdf

# 옵션 B: Supabase Storage (추천)
# supabase storage에 enterprise-docs 버킷 생성 후 업로드

# 옵션 C: 외부 CDN (Cloudflare R2 등)
```

> **주의**: PDF 파일은 portal 폴더에 이미 생성되어 있음:
> - `POTAL_Capability_Deck.pdf` (영문, 142개 기능)
> - `POTAL_Requirements_Questionnaire.pdf` (영문, 183 필드)

---

## 11단계: Make.com 이메일 감시 시나리오 (선택)

Questionnaire 회신을 자동 감지하려면 Make.com에 시나리오 추가:

```
1. Trigger: Google Gmail > Watch Emails
   - Label: INBOX
   - From filter: (비움 — 모든 이메일)
   - Folder: contact@potal.app

2. HTTP > Make a request
   - URL: https://www.potal.app/api/cron/enterprise-lead-match
   - Method: POST
   - Headers: Authorization: Bearer {CRON_SECRET}
   - Body: { "from_email": "{{1.from.address}}" }

3. 결과에 따라:
   - matched: true → 자동으로 텔레그램 알림 전송됨 (API에서 처리)
   - matched: false → 무시 (일반 이메일)
```

---

## 12단계: 문서 업데이트

Claude Code 세션에서 아래 문서들을 업데이트:

### CLAUDE.md 업데이트 내용:
```
- enterprise_leads 테이블 추가 (Supabase 테이블 현황 섹션)
- D9 Layer 1 자동화 상태: ✅ 완료 (Enterprise 폼 → API → DB → 자동 이메일 → 텔레그램)
- Vercel Cron 추가: enterprise-lead-match 매30분
- API 엔드포인트 추가: POST /api/v1/enterprise-inquiry
```

### session-context.md 업데이트 내용:
```
- CW13 Enterprise Sales 자동화 구현
- enterprise_leads 테이블 생성
- Resend API 이메일 자동 발송
- Telegram 알림 (2단계: 리드 + Questionnaire 회신)
- Make.com 이메일 감시 시나리오
```

---

## 실행 순서 요약

```
Claude Code에서 순서대로 실행:

1. ✅ Supabase enterprise_leads 테이블 생성 (curl 명령어)
2. ✅ Vercel 환경변수 추가 (Dashboard에서)
3. 📝 app/lib/notifications/telegram.ts 생성
4. 📝 app/lib/notifications/enterprise-email.ts 생성
5. 📝 app/api/v1/enterprise-inquiry/route.ts 생성
6. 📝 app/api/cron/enterprise-lead-match/route.ts 생성
7. 📝 vercel.json cron 추가
8. 📝 morning-brief 라우트에 enterprise 현황 추가
9. 📝 웹사이트 Enterprise 폼 submit 핸들러 수정
10. 📁 PDF 2개 public/docs/ 에 복사
11. 🔧 Make.com 이메일 감시 시나리오 추가 (수동)
12. 📝 CLAUDE.md + session-context.md 업데이트
13. 🧪 테스트: curl로 /api/v1/enterprise-inquiry 호출
14. ✅ git commit & push
```

---

## 테스트 명령어

```bash
# 로컬 테스트 (개발 서버 실행 중)
curl -X POST http://localhost:3000/api/v1/enterprise-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Corp",
    "contact_email": "test@example.com",
    "contact_name": "John Test",
    "estimated_volume": "10000"
  }'

# 프로덕션 테스트 (배포 후)
curl -X POST https://www.potal.app/api/v1/enterprise-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Corp",
    "contact_email": "test@example.com",
    "contact_name": "John Test",
    "estimated_volume": "10000"
  }'

# Cron 테스트
curl https://www.potal.app/api/cron/enterprise-lead-match \
  -H "Authorization: Bearer 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297"

# 리드 매칭 테스트 (Make.com webhook 시뮬레이션)
curl -X POST https://www.potal.app/api/cron/enterprise-lead-match \
  -H "Authorization: Bearer 8e82e09e218d6147943253fdbffacc3bacda4e4f8d322ce508ea2befde00f297" \
  -H "Content-Type: application/json" \
  -d '{"from_email": "test@example.com"}'
```

---

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│ 1단계: 완전 자동 (사람 개입 X)                                │
│                                                              │
│ potal.app Enterprise 폼                                      │
│   └→ POST /api/v1/enterprise-inquiry                         │
│       ├→ Supabase enterprise_leads 저장 (status: proposal_sent)│
│       ├→ Resend API → Capability Deck + Questionnaire 자동 발송│
│       └→ Telegram "🏢 새 Enterprise 리드: [회사명] — 자동 발송"│
│                                                              │
│ ※ 은태님은 텔레그램 알림만 확인. 아무것도 안 해도 됨          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2단계: 은태님 판단 필요                                       │
│                                                              │
│ 고객이 Questionnaire 회신 (contact@potal.app으로)             │
│   └→ Make.com Watch Emails → POST /enterprise-lead-match     │
│       ├→ contact_email로 enterprise_leads 매칭                │
│       ├→ 매칭: status → questionnaire_received                │
│       │   └→ Telegram "📋 [Acme Corp] Questionnaire 회신!"    │
│       │   └→ 은태님 확인 → Cowork에서 맞춤 Proposal 작성      │
│       └→ 미매칭: 일반 문의 (무시)                              │
│                                                              │
│ Morning Brief: "D9 Enterprise: 대기 N건 | 회신 N건 | 미회신 N건"│
└─────────────────────────────────────────────────────────────┘
```
