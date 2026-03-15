'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/context/SupabaseProvider';

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  isOwner: boolean;
  lastSignIn: string | null;
  createdAt: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#dc2626', text: '#fff' },
  manager: { bg: '#d97706', text: '#fff' },
  analyst: { bg: '#2563eb', text: '#fff' },
  viewer: { bg: '#6b7280', text: '#fff' },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full access — billing, team, API keys, settings, all data',
  manager: 'Billing (read/update), team management, API usage (no delete)',
  analyst: 'Read-only + API usage — no settings changes, no key visibility',
  viewer: 'Read-only — analytics dashboards only, API keys hidden',
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function TeamPage() {
  const router = useRouter();
  const { session } = useSupabase();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'analyst' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/team/members', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.data.members);
        setInvitations(data.data.invitations);
      }
    } catch {
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      const t = setTimeout(() => router.push('/auth/login'), 1500);
      return () => clearTimeout(t);
    }
    loadTeam();
  }, [session, loadTeam, router]);

  const handleInvite = async () => {
    if (!session || !inviteEmail) return;
    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInvite(false);
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (roleId: string, newRole: string) => {
    if (!session) return;
    setError(null);
    try {
      const res = await fetch('/api/v1/team/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roleId, newRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess('Role updated');
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemove = async (roleId: string, name: string) => {
    if (!session || !confirm(`Remove ${name} from the team?`)) return;
    setError(null);
    try {
      const res = await fetch('/api/v1/team/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ roleId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess('Member removed');
      await loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const isAdmin = members.find(m => m.isOwner)?.userId === session?.user?.id;

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    padding: 24,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: '#02122c', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: 20, fontWeight: 800 }}>POTAL</Link>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>Team Management</span>
        </div>
        <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Back to Dashboard</Link>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* Title + Invite */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#02122c', margin: 0 }}>Team</h1>
            <p style={{ fontSize: 14, color: '#666', marginTop: 4 }}>Manage your team members and their access levels.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              style={{
                padding: '10px 20px',
                background: '#02122c',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Invite Member
            </button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#16a34a' }}>
            {success}
          </div>
        )}

        {/* Invite Form */}
        {showInvite && (
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#02122c' }}>Invite Team Member</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6 }}>Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as 'manager' | 'analyst' | 'viewer')}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}
                >
                  <option value="manager">Manager</option>
                  <option value="analyst">Analyst</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                style={{
                  padding: '10px 24px',
                  background: inviting ? '#94a3b8' : '#02122c',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: inviting ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>
              {ROLE_DESCRIPTIONS[inviteRole]}
            </p>
          </div>
        )}

        {/* Role Legend */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#02122c' }}>Role Permissions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {(['admin', 'manager', 'analyst', 'viewer'] as const).map(r => (
              <div key={r} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  background: ROLE_COLORS[r].bg,
                  color: ROLE_COLORS[r].text,
                  marginBottom: 8,
                }}>{r}</span>
                <p style={{ fontSize: 11, color: '#666', lineHeight: 1.5, margin: 0 }}>{ROLE_DESCRIPTIONS[r]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Members List */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#02122c' }}>
            Members ({members.length})
          </h3>

          {loading ? (
            <p style={{ color: '#999', fontSize: 14 }}>Loading team...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: 16, padding: '10px 0', borderBottom: '2px solid #e5e7eb', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <span>Member</span>
                <span>Role</span>
                <span>Last Active</span>
                <span>Joined</span>
                <span>Actions</span>
              </div>

              {members.map(m => (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', gap: 16, padding: '14px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                      {m.name}
                      {m.isOwner && <span style={{ fontSize: 10, color: '#d97706', fontWeight: 700, marginLeft: 8 }}>OWNER</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>{m.email}</div>
                  </div>
                  <div>
                    {isAdmin && !m.isOwner ? (
                      <select
                        value={m.role}
                        onChange={e => handleChangeRole(m.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          fontSize: 12,
                          background: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="analyst">Analyst</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: ROLE_COLORS[m.role]?.bg || '#6b7280',
                        color: ROLE_COLORS[m.role]?.text || '#fff',
                      }}>{m.role}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>{timeAgo(m.lastSignIn)}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</div>
                  <div>
                    {isAdmin && !m.isOwner && (
                      <button
                        onClick={() => handleRemove(m.id, m.name)}
                        style={{
                          padding: '4px 12px',
                          background: 'white',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#d97706' }}>
                Pending Invitations ({invitations.length})
              </h4>
              {invitations.map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <span style={{ fontSize: 14, color: '#333' }}>{inv.email}</span>
                    <span style={{
                      marginLeft: 8,
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: '#fef3c7',
                      color: '#92400e',
                    }}>Pending</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: ROLE_COLORS[inv.role]?.bg || '#6b7280',
                      color: ROLE_COLORS[inv.role]?.text || '#fff',
                    }}>{inv.role}</span>
                    <span style={{ fontSize: 11, color: '#999' }}>
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
