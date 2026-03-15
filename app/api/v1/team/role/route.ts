/**
 * POTAL API v1 — /api/v1/team/role
 *
 * PUT — Change team member's role (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole, type Role } from '@/app/lib/rbac';

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
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!seller) return null;
  return { userId: user.id, sellerId: seller.id };
}

export async function PUT(req: NextRequest) {
  const auth = await authenticateUser(req);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(auth.userId, auth.sellerId);
  if (role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { roleId, newRole } = body as { roleId: string; newRole: Role };

  if (!roleId || !newRole) {
    return NextResponse.json({ success: false, error: 'roleId and newRole required' }, { status: 400 });
  }

  if (!['admin', 'manager', 'analyst', 'viewer'].includes(newRole)) {
    return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('user_roles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', roleId)
    .eq('seller_id', auth.sellerId);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { roleId, role: newRole } });
}
