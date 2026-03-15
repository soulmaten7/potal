/**
 * POTAL API v1 — /api/v1/team/members
 *
 * GET  — List team members (user_roles + owner)
 * DELETE — Remove team member (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole } from '@/app/lib/rbac';

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
    .select('id, user_id')
    .eq('user_id', user.id)
    .single();

  if (!seller) return null;
  return { userId: user.id, sellerId: seller.id, email: user.email };
}

export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Get team members from user_roles
  const { data: roles } = await supabase
    .from('user_roles')
    .select('id, user_id, role, created_at')
    .eq('seller_id', auth.sellerId);

  // Get user details for each member
  const members = [];

  // Add owner first
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
  const ownerUser = allUsers?.find((u: { id: string }) => u.id === auth.userId);

  members.push({
    id: 'owner',
    userId: auth.userId,
    email: ownerUser?.email || auth.email,
    name: ownerUser?.user_metadata?.full_name || ownerUser?.email?.split('@')[0] || 'Owner',
    role: 'admin' as const,
    isOwner: true,
    lastSignIn: ownerUser?.last_sign_in_at || null,
    createdAt: ownerUser?.created_at || null,
  });

  // Add team members
  for (const role of (roles || [])) {
    const memberUser = allUsers?.find((u: { id: string }) => u.id === role.user_id);
    if (memberUser && role.user_id !== auth.userId) {
      members.push({
        id: role.id,
        userId: role.user_id,
        email: memberUser.email,
        name: memberUser.user_metadata?.full_name || memberUser.email?.split('@')[0] || 'Member',
        role: role.role,
        isOwner: false,
        lastSignIn: memberUser.last_sign_in_at || null,
        createdAt: role.created_at,
      });
    }
  }

  // Get pending invitations
  const { data: invitations } = await supabase
    .from('team_invitations')
    .select('id, email, role, status, created_at, expires_at')
    .eq('seller_id', auth.sellerId)
    .eq('status', 'pending');

  return NextResponse.json({
    success: true,
    data: { members, invitations: invitations || [] },
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await authenticateUser(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can remove members
  const role = await getUserRole(auth.userId, auth.sellerId);
  if (role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const { roleId } = await req.json();
  if (!roleId) {
    return NextResponse.json({ success: false, error: 'roleId required' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', roleId)
    .eq('seller_id', auth.sellerId);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to remove member' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
