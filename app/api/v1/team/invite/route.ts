/**
 * POTAL API v1 — /api/v1/team/invite
 *
 * POST — Send team invitation email (admin/manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole, type Role } from '@/app/lib/rbac';
import { randomBytes } from 'crypto';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.potal.app';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function authenticateUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  );

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;

  const svc = getServiceClient();
  const { data: seller } = await svc
    .from('sellers')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single();

  if (!seller) return null;
  return { userId: user.id, sellerId: seller.id, companyName: seller.company_name, email: user.email };
}

export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(auth.userId, auth.sellerId);
  if (!role || !['admin', 'manager'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin or Manager access required' }, { status: 403 });
  }

  const body = await req.json();
  const { email, role: inviteRole } = body as { email: string; role: Role };

  if (!email || !inviteRole) {
    return NextResponse.json({ success: false, error: 'email and role required' }, { status: 400 });
  }

  if (!['admin', 'manager', 'analyst', 'viewer'].includes(inviteRole)) {
    return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
  }

  // Managers can't invite admins
  if (role === 'manager' && inviteRole === 'admin') {
    return NextResponse.json({ success: false, error: 'Managers cannot invite admins' }, { status: 403 });
  }

  const supabase = getServiceClient();
  const token = randomBytes(32).toString('hex');

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from('team_invitations')
    .select('id')
    .eq('seller_id', auth.sellerId)
    .eq('email', email)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return NextResponse.json({ success: false, error: 'Invitation already pending for this email' }, { status: 409 });
  }

  // Create invitation
  const { error: insertError } = await supabase
    .from('team_invitations')
    .insert({
      seller_id: auth.sellerId,
      email,
      role: inviteRole,
      invited_by: auth.userId,
      token,
    });

  if (insertError) {
    return NextResponse.json({ success: false, error: 'Failed to create invitation' }, { status: 500 });
  }

  // Send invitation email via Resend
  if (RESEND_API_KEY) {
    const inviteUrl = `${BASE_URL}/auth/accept-invite?token=${token}`;
    const companyLabel = auth.companyName || 'a POTAL team';

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'POTAL <noreply@potal.app>',
          to: [email],
          subject: `You're invited to join ${companyLabel} on POTAL`,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 700; color: #02122c; margin: 0;">POTAL</h1>
                <p style="font-size: 13px; color: #888; margin-top: 4px;">Total Landed Cost Platform</p>
              </div>
              <div style="background: #f8fafc; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
                <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px;">You've been invited!</h2>
                <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 8px;">
                  <strong>${auth.email}</strong> has invited you to join <strong>${companyLabel}</strong> as a <strong>${inviteRole}</strong>.
                </p>
                <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px;">
                  Click the button below to accept and set up your account.
                </p>
                <a href="${inviteUrl}" style="display: inline-block; background: #02122c; color: white; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none;">
                  Accept Invitation
                </a>
                <p style="font-size: 12px; color: #999; margin-top: 24px;">
                  This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
              </div>
            </div>
          `,
        }),
      });
    } catch {
      // Email send failed but invitation is created — not a fatal error
    }
  }

  return NextResponse.json({
    success: true,
    data: { email, role: inviteRole, status: 'pending' },
  });
}
