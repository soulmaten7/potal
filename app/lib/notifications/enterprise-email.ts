// app/lib/notifications/enterprise-email.ts
// Enterprise Proposal 자동 이메일 발송 (Resend API)

const RESEND_API_KEY = process.env.RESEND_API_KEY;

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

interface EnterpriseEmailParams {
  to: string;
  contactName?: string;
  companyName: string;
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

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
