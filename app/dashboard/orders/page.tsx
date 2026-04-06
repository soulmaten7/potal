'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 };

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Synced: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
  Pending: { bg: 'rgba(250,204,21,0.15)', color: '#facc15' },
  Failed: { bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  Calculated: { bg: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
};

const MOCK_ORDERS = [
  { id: 'ORD-8842', platform: 'Shopify', customer: 'Sarah K.', country: 'DE', items: 3, total: 245.00, dutyStatus: 'Calculated', syncStatus: 'Synced' },
  { id: 'ORD-8841', platform: 'Shopify', customer: 'Tom W.', country: 'GB', items: 1, total: 89.99, dutyStatus: 'Calculated', syncStatus: 'Synced' },
  { id: 'ORD-8840', platform: 'WooCommerce', customer: 'Yuki M.', country: 'JP', items: 5, total: 410.50, dutyStatus: 'Pending', syncStatus: 'Pending' },
  { id: 'ORD-8839', platform: 'Shopify', customer: 'Liam R.', country: 'AU', items: 2, total: 156.00, dutyStatus: 'Calculated', syncStatus: 'Synced' },
  { id: 'ORD-8838', platform: 'BigCommerce', customer: 'Min-jun P.', country: 'KR', items: 1, total: 79.00, dutyStatus: 'Failed', syncStatus: 'Failed' },
  { id: 'ORD-8837', platform: 'Shopify', customer: 'Anna S.', country: 'CA', items: 4, total: 320.00, dutyStatus: 'Calculated', syncStatus: 'Synced' },
];

export default function OrdersPage() {
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [syncing, setSyncing] = useState(false);

  const filtered = MOCK_ORDERS.filter(o => (!platformFilter || o.platform === platformFilter) && (!statusFilter || o.syncStatus === statusFilter));

  function handleSync() { setSyncing(true); setTimeout(() => setSyncing(false), 2000); }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>OPERATIONS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Order Sync</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Monitor and sync orders from connected platforms with duty calculations.</p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'white', fontSize: 13 }}>
            <option value="">All Platforms</option>
            {['Shopify', 'WooCommerce', 'BigCommerce'].map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: 'white', fontSize: 13 }}>
            <option value="">All Status</option>
            {['Synced', 'Pending', 'Failed'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={handleSync} disabled={syncing} style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: syncing ? 0.6 : 1 }}>{syncing ? 'Syncing...' : 'Sync Now'}</button>
        </div>

        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              {['Order ID', 'Platform', 'Customer', 'Country', 'Items', 'Total', 'Duty', 'Sync'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace', color: accent }}>{o.id}</td>
                <td style={{ padding: '10px' }}>{o.platform}</td>
                <td style={{ padding: '10px' }}>{o.customer}</td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{o.country}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{o.items}</td>
                <td style={{ padding: '10px' }}>${o.total.toFixed(2)}</td>
                <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, ...(STATUS_COLORS[o.dutyStatus] || {}) }}>{o.dutyStatus}</span></td>
                <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, ...(STATUS_COLORS[o.syncStatus] || {}) }}>{o.syncStatus}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
