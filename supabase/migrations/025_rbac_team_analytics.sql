-- Migration 025: RBAC, Team Management, Analytics
-- CW14: F089 RBAC + F090 Team Management + F041 Dashboard Analytics

-- 1. User Roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, seller_id)
);

-- 2. Role Permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  allowed boolean NOT NULL DEFAULT false,
  UNIQUE(role, resource, action)
);

-- 3. Team Invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_seller_id ON user_roles(seller_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_seller_id ON team_invitations(seller_id);

-- 4. Seed default role permissions
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  -- Admin: everything
  ('admin', 'billing', 'create', true), ('admin', 'billing', 'read', true),
  ('admin', 'billing', 'update', true), ('admin', 'billing', 'delete', true),
  ('admin', 'team', 'create', true), ('admin', 'team', 'read', true),
  ('admin', 'team', 'update', true), ('admin', 'team', 'delete', true),
  ('admin', 'api', 'create', true), ('admin', 'api', 'read', true),
  ('admin', 'api', 'update', true), ('admin', 'api', 'delete', true),
  ('admin', 'settings', 'create', true), ('admin', 'settings', 'read', true),
  ('admin', 'settings', 'update', true), ('admin', 'settings', 'delete', true),
  ('admin', 'analytics', 'read', true),
  ('admin', 'admin', 'read', true), ('admin', 'admin', 'create', true),
  ('admin', 'admin', 'update', true), ('admin', 'admin', 'delete', true),
  -- Manager: billing (read/update), team (CRU), api (CRU), settings (read), analytics (read)
  ('manager', 'billing', 'read', true), ('manager', 'billing', 'update', true),
  ('manager', 'team', 'create', true), ('manager', 'team', 'read', true),
  ('manager', 'team', 'update', true),
  ('manager', 'api', 'create', true), ('manager', 'api', 'read', true),
  ('manager', 'api', 'update', true),
  ('manager', 'settings', 'read', true), ('manager', 'analytics', 'read', true),
  -- Analyst: api (read/create), analytics (read), settings (read)
  ('analyst', 'api', 'read', true), ('analyst', 'api', 'create', true),
  ('analyst', 'analytics', 'read', true), ('analyst', 'settings', 'read', true),
  -- Viewer: analytics (read), settings (read)
  ('viewer', 'analytics', 'read', true), ('viewer', 'settings', 'read', true)
ON CONFLICT (role, resource, action) DO NOTHING;
