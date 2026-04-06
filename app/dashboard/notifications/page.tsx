'use client';

import React, { useState } from 'react';

const accent = '#E8640A';
const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.25)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' };

interface Notification { id: string; icon: string; title: string; description: string; time: string; read: boolean; category: 'compliance' | 'system' | 'trade' }

const DEMO: Notification[] = [
  { id: '1', icon: '\u{1F6A8}', title: 'Sanctions List Updated', description: 'OFAC SDN list updated with 23 new entries. Your screening results may be affected.', time: '2 hours ago', read: false, category: 'compliance' },
  { id: '2', icon: '\u{1F4CA}', title: 'Monthly Usage Report Ready', description: 'Your March 2026 API usage report is available. 12,450 calls processed.', time: '1 day ago', read: false, category: 'system' },
  { id: '3', icon: '\u{26A0}\u{FE0F}', title: 'EU Tariff Rate Change', description: 'HS 6109.10 duty rate changed from 12% to 12.5% for EU imports effective April 1.', time: '2 days ago', read: false, category: 'trade' },
  { id: '4', icon: '\u{2705}', title: 'Webhook Delivery Success', description: 'All 156 webhook deliveries in the last 24h were successful. 100% delivery rate.', time: '3 days ago', read: true, category: 'system' },
  { id: '5', icon: '\u{1F512}', title: 'API Key Rotated', description: 'Production API key was rotated successfully. Old key expires in 24h.', time: '5 days ago', read: true, category: 'system' },
  { id: '6', icon: '\u{1F4DD}', title: 'Section 301 Update', description: 'New Federal Register notice: Additional tariffs on List 4A products under review.', time: '1 week ago', read: true, category: 'compliance' },
];

const FILTERS = ['All', 'Unread', 'Compliance', 'System'] as const;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All');

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Compliance') return n.category === 'compliance';
    if (filter === 'System') return n.category === 'system';
    return true;
  });

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>MANAGEMENT</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Notifications</h1>
            {unreadCount > 0 && <span style={{ padding: '2px 10px', borderRadius: 10, background: accent, color: 'white', fontSize: 12, fontWeight: 700 }}>{unreadCount}</span>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Mark all read</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: filter === f ? accent : 'rgba(255,255,255,0.08)', color: filter === f ? 'white' : 'rgba(255,255,255,0.5)' }}>{f}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>No notifications</div>}
          {filtered.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)} style={{
              ...cardStyle, padding: 16, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'flex-start',
              borderLeft: n.read ? undefined : `3px solid ${accent}`,
              opacity: n.read ? 0.7 : 1,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{n.description}</div>
              </div>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 6 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
