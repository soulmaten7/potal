'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };

interface Webhook { id: string; url: string; events: string[]; status: 'active' | 'paused'; lastTriggered: string; successRate: number }

const DEMO_WEBHOOKS: Webhook[] = [
  { id: '1', url: 'https://example.com/webhooks/potal', events: ['calculation.completed', 'classification.completed'], status: 'active', lastTriggered: '2 hours ago', successRate: 99.5 },
  { id: '2', url: 'https://myshop.io/api/duties', events: ['calculation.completed'], status: 'active', lastTriggered: '5 hours ago', successRate: 100 },
  { id: '3', url: 'https://old-system.net/hook', events: ['screening.completed'], status: 'paused', lastTriggered: '3 days ago', successRate: 87 },
];

const EVENTS = ['calculation.completed', 'classification.completed', 'screening.completed', 'screening.hit', 'batch.completed'];

export default function WebhooksPage() {
  const [webhooks] = useState(DEMO_WEBHOOKS);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (e: string) => setSelectedEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>INTEGRATION</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Webhooks</h1>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Add Webhook'}
          </button>
        </div>

        {showForm && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Webhook</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Endpoint URL</label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://your-app.com/webhook" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Events</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EVENTS.map(e => (
                  <button key={e} onClick={() => toggleEvent(e)} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: selectedEvents.includes(e) ? 'rgba(232,100,10,0.2)' : 'rgba(255,255,255,0.05)',
                    color: selectedEvents.includes(e) ? accent : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${selectedEvents.includes(e) ? accent : 'rgba(255,255,255,0.1)'}`,
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Signing Secret</label>
              <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                whsec_{'x'.repeat(32).replace(/./g, () => '0123456789abcdef'[Math.floor(Math.random() * 16)])}
              </div>
            </div>
            <button style={{ padding: '10px 24px', background: accent, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Create Webhook</button>
          </div>
        )}

        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Endpoint', 'Events', 'Status', 'Last Triggered', 'Success'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhooks.map(wh => (
                <tr key={wh.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: accent, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {wh.events.map(e => <span key={e} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{e.split('.')[0]}</span>)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: wh.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: wh.status === 'active' ? '#4ade80' : '#facc15' }}>{wh.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)' }}>{wh.lastTriggered}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: wh.successRate >= 99 ? '#4ade80' : '#facc15' }}>{wh.successRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
