'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

interface ApiKey {
  id: string;
  name: string;
  keyMasked: string;
  created: string;
  lastUsed: string;
  active: boolean;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setError('Please sign in to manage API keys.');
        setLoading(false);
        return;
      }
      const { data } = await sb.from('api_keys')
        .select('id, name, key_prefix, is_active, created_at, last_used_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      setKeys((data || []).map(k => ({
        id: k.id,
        name: k.name || 'Unnamed',
        keyMasked: `${k.key_prefix || 'pk_****'}${'*'.repeat(24)}`,
        created: k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Unknown',
        lastUsed: k.last_used_at ? formatRelative(k.last_used_at) : 'Never',
        active: k.is_active ?? true,
      })));
    } catch {
      setError('Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setError(null);
    try {
      const res = await fetch('/api/v1/sellers/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const json = await res.json();
      if (json.data?.apiKey) {
        setGeneratedKey(json.data.apiKey);
        await loadKeys();
        setNewKeyName('');
      } else {
        setError(json.error?.message || 'Failed to create key. Please sign in first.');
      }
    } catch {
      setError('Failed to create key. Please try again.');
    }
  };

  const toggleKey = async (id: string) => {
    const key = keys.find(k => k.id === id);
    if (!key) return;
    if (key.active) {
      await fetch('/api/v1/sellers/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: id }),
      });
    }
    await loadKeys();
  };

  const activeCount = keys.filter(k => k.active).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>API Keys</h1>
          <button onClick={() => { setShowCreate(!showCreate); setGeneratedKey(null); setError(null); }} style={{ padding: '10px 20px', background: accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {showCreate ? 'Cancel' : '+ Create New Key'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#f87171', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Stats — real data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Plan', value: 'Forever Free', color: '#4ade80' },
            { label: 'Rate Limit', value: '20 req/sec', color: accent },
            { label: 'Active Keys', value: loading ? '...' : `${activeCount}`, color: 'rgba(255,255,255,0.9)' },
          ].map((m, i) => (
            <div key={i} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {showCreate && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
            {!generatedKey ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Create API Key</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production)" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                  <button onClick={handleCreate} style={{ padding: '12px 24px', background: accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Generate</button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>Key Created Successfully</div>
                <div style={{ fontSize: 12, color: '#facc15', marginBottom: 12 }}>Copy this key now. It will only be shown once.</div>
                <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, color: accent, wordBreak: 'break-all', border: '1px solid rgba(232,100,10,0.3)' }}>
                  {generatedKey}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(generatedKey); }} style={{ marginTop: 12, padding: '8px 20px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Copy to Clipboard</button>
              </div>
            )}
          </div>
        )}

        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading keys...</div>
          ) : keys.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              No API keys yet. Click &quot;+ Create New Key&quot; to get started.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Name', 'Key', 'Created', 'Last Used', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{k.name}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{k.keyMasked}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{k.created}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{k.lastUsed}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => toggleKey(k.id)} style={{
                        padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: k.active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: k.active ? '#4ade80' : '#f87171',
                      }}>{k.active ? 'Active' : 'Revoked'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
