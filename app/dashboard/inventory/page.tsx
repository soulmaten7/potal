'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 };

const MOCK_INVENTORY = [
  { sku: 'SKU-001', name: 'Cotton T-Shirt', warehouse: 'US-West', qty: 1250, hsCode: '6109.10.00.04', origin: 'CN', synced: '2026-04-06 08:30' },
  { sku: 'SKU-002', name: 'Leather Wallet', warehouse: 'US-East', qty: 840, hsCode: '4202.31.60.00', origin: 'IT', synced: '2026-04-06 08:30' },
  { sku: 'SKU-003', name: 'Ceramic Mug', warehouse: 'US-West', qty: 3200, hsCode: '6912.00.44.00', origin: 'CN', synced: '2026-04-05 22:00' },
  { sku: 'SKU-004', name: 'Running Shoes', warehouse: 'EU-Central', qty: 560, hsCode: '6404.11.90.00', origin: 'VN', synced: '2026-04-06 08:30' },
  { sku: 'SKU-005', name: 'Bluetooth Speaker', warehouse: 'US-East', qty: 180, hsCode: '', origin: 'CN', synced: '2026-04-04 14:00' },
  { sku: 'SKU-006', name: 'Yoga Mat', warehouse: 'US-West', qty: 2100, hsCode: '9506.91.00.30', origin: 'TW', synced: '2026-04-06 08:30' },
  { sku: 'SKU-007', name: 'Stainless Water Bottle', warehouse: 'EU-Central', qty: 4500, hsCode: '', origin: 'CN', synced: '2026-04-03 10:00' },
  { sku: 'SKU-008', name: 'Phone Case (Silicone)', warehouse: 'US-East', qty: 7800, hsCode: '3926.90.99.60', origin: 'CN', synced: '2026-04-06 08:30' },
];

const WAREHOUSES = ['All', 'US-West', 'US-East', 'EU-Central'];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [warehouse, setWarehouse] = useState('All');
  const [classifying, setClassifying] = useState(false);

  const filtered = MOCK_INVENTORY.filter(item => {
    if (warehouse !== 'All' && item.warehouse !== warehouse) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unclassified = filtered.filter(i => !i.hsCode).length;

  function handleBulkClassify() { setClassifying(true); setTimeout(() => setClassifying(false), 2000); }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>OPERATIONS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Inventory Sync</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Track inventory across warehouses with HS Code classification status.</p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total SKUs', value: MOCK_INVENTORY.length, color: '#fff' },
            { label: 'Total Units', value: MOCK_INVENTORY.reduce((s, i) => s + i.qty, 0).toLocaleString(), color: '#fff' },
            { label: 'Classified', value: MOCK_INVENTORY.filter(i => i.hsCode).length, color: '#4ade80' },
            { label: 'Unclassified', value: MOCK_INVENTORY.filter(i => !i.hsCode).length, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or product..." style={{ ...inputStyle, maxWidth: 280 }} />
          <select value={warehouse} onChange={e => setWarehouse(e.target.value)} style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14 }}>
            {WAREHOUSES.map(w => <option key={w}>{w}</option>)}
          </select>
          {unclassified > 0 && (
            <button onClick={handleBulkClassify} disabled={classifying} style={{ marginLeft: 'auto', padding: '10px 20px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: classifying ? 0.6 : 1 }}>
              {classifying ? 'Classifying...' : `Auto-Classify ${unclassified} SKUs`}
            </button>
          )}
        </div>

        <div style={cardStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              {['SKU', 'Product', 'Warehouse', 'Qty', 'HS Code', 'Origin', 'Last Synced'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map(item => (
              <tr key={item.sku} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace', color: accent, fontSize: 12 }}>{item.sku}</td>
                <td style={{ padding: '10px', fontWeight: 500 }}>{item.name}</td>
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.6)' }}>{item.warehouse}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{item.qty.toLocaleString()}</td>
                <td style={{ padding: '10px' }}>
                  {item.hsCode
                    ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>{item.hsCode}</span>
                    : <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Unclassified</span>}
                </td>
                <td style={{ padding: '10px', fontWeight: 600 }}>{item.origin}</td>
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{item.synced}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
