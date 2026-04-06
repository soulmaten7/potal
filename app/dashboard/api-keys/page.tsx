'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

interface ApiKey { id: string; name: string; keyMasked: string; created: string; lastUsed: string; active: boolean }

const DEMO_KEYS: ApiKey[] = [
  { id: '1', name: 'Production', keyMasked: 'pk_live_****************************a3f7', created: '2026-03-15', lastUsed: '2 min ago', active: true },
  { id: '2', name: 'Staging', keyMasked: 'pk_test_****************************b2e1', created: '2026-03-20', lastUsed: '1 day ago', active: true },
  { id: '3', name: 'Old Integration', keyMasked: 'pk_live_****************************c9d4', created: '2026-02-01', lastUsed: '30 days ago', active: false },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(DEMO_KEYS);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    const key = `pk_live_${Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    setGeneratedKey(key);
    setKeys(prev => [{ id: String(prev.length + 1), name: newKeyName.trim(), keyMasked: `${key.slice(0, 8)}${'*'.repeat(28)}${key.slice(-4)}`, created: new Date().toISOString().slice(0, 10), lastUsed: 'Never', active: true }, ...prev]);
    setNewKeyName('');
  };

  const toggleKey = (id: string) => setKeys(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>API Keys</h1>
          <button onClick={() => { setShowCreate(!showCreate); setGeneratedKey(null); }} style={{ padding: '10px 20px', background: accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {showCreate ? 'Cancel' : '+ Create New Key'}
          </button>
        </div>

        {/* Rate limit info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Plan', value: 'Forever Free', color: '#4ade80' },
            { label: 'Rate Limit', value: '100K/month', color: accent },
            { label: 'Active Keys', value: `${keys.filter(k => k.active).length}`, color: 'rgba(255,255,255,0.9)' },
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
        </div>
      </div>
    </div>
  );
}
