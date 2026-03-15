/**
 * POTAL RBAC — Role-Based Access Control
 *
 * 4 roles: admin, manager, analyst, viewer
 * Resources: billing, team, api, settings, analytics, admin
 * Actions: create, read, update, delete
 */

import { createClient } from '@supabase/supabase-js';

export type Role = 'admin' | 'manager' | 'analyst' | 'viewer';
export type Resource = 'billing' | 'team' | 'api' | 'settings' | 'analytics' | 'admin';
export type Action = 'create' | 'read' | 'update' | 'delete';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Get user's role for a seller org. Returns 'admin' for org owner, null if no role. */
export async function getUserRole(userId: string, sellerId: string): Promise<Role | null> {
  const supabase = getServiceClient();

  // Check if user is the seller owner (always admin)
  const { data: seller } = await supabase
    .from('sellers')
    .select('user_id')
    .eq('id', sellerId)
    .single();

  if (seller?.user_id === userId) return 'admin';

  // Check user_roles table
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('seller_id', sellerId)
    .single();

  return (role?.role as Role) || null;
}

/** Check if a role has permission for resource+action */
export async function hasPermission(role: Role, resource: Resource, action: Action): Promise<boolean> {
  if (role === 'admin') return true; // Admin has all permissions

  const supabase = getServiceClient();
  const { data } = await supabase
    .from('role_permissions')
    .select('allowed')
    .eq('role', role)
    .eq('resource', resource)
    .eq('action', action)
    .single();

  return data?.allowed === true;
}

/** Get all permissions for a role */
export async function getRolePermissions(role: Role): Promise<Record<string, boolean>> {
  if (role === 'admin') {
    return { '*': true };
  }

  const supabase = getServiceClient();
  const { data } = await supabase
    .from('role_permissions')
    .select('resource, action, allowed')
    .eq('role', role);

  const perms: Record<string, boolean> = {};
  for (const p of data || []) {
    perms[`${p.resource}:${p.action}`] = p.allowed;
  }
  return perms;
}

/** Inline permission map for client-side (no DB call needed) */
export const ROLE_PERMISSIONS: Record<Role, { resources: Resource[]; canDelete: boolean; canManageTeam: boolean; canViewKeys: boolean }> = {
  admin: { resources: ['billing', 'team', 'api', 'settings', 'analytics', 'admin'], canDelete: true, canManageTeam: true, canViewKeys: true },
  manager: { resources: ['billing', 'team', 'api', 'settings', 'analytics'], canDelete: false, canManageTeam: true, canViewKeys: true },
  analyst: { resources: ['api', 'analytics', 'settings'], canDelete: false, canManageTeam: false, canViewKeys: false },
  viewer: { resources: ['analytics', 'settings'], canDelete: false, canManageTeam: false, canViewKeys: false },
};

/** Dashboard tabs visible per role */
export const ROLE_VISIBLE_TABS: Record<Role, string[]> = {
  admin: ['overview', 'keys', 'classify', 'calculator', 'fta', 'sanctions', 'documents', 'batch', 'widget', 'integrations', 'usage', 'countries', 'platforms', 'analytics', 'logs', 'settings', 'billing', 'team'],
  manager: ['overview', 'keys', 'classify', 'calculator', 'fta', 'sanctions', 'documents', 'batch', 'widget', 'integrations', 'usage', 'countries', 'platforms', 'analytics', 'logs', 'settings', 'billing', 'team'],
  analyst: ['overview', 'classify', 'calculator', 'fta', 'sanctions', 'documents', 'batch', 'usage', 'countries', 'platforms', 'analytics', 'logs'],
  viewer: ['overview', 'usage', 'countries', 'platforms', 'analytics'],
};
