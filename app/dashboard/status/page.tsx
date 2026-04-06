'use client';

import React, { useState, useEffect } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

interface Service {
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  lastIncident?: string;
}

interface Incident {
  id: string;
  service: string;
  title: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'resolved' | 'monitoring' | 'investigating';
  date: string;
  duration?: string;
}

const SERVICES: Service[] = [
  { name: 'API Gateway', description: 'Main API entry point & rate limiting', status: 'operational', uptime: 99.98, responseTime: 38, lastIncident: '14 days ago' },
  { name: 'Classification Engine', description: 'HS Code AI classification pipeline', status: 'operational', uptime: 99.91, responseTime: 142, lastIncident: '7 days ago' },
  { name: 'Screening Database', description: 'OFAC SDN / BIS / sanctions lists', status: 'operational', uptime: 99.99, responseTime: 24, lastIncident: '31 days ago' },
  { name: 'Tax Calculator', description: 'VAT, GST, US sales tax computation', status: 'degraded', uptime: 98.72, responseTime: 380, lastIncident: '2 hours ago' },
  { name: 'Document Generator', description: 'Commercial invoice & customs docs', status: 'operational', uptime: 99.85, responseTime: 210, lastIncident: '5 days ago' },
  { name: 'Exchange Rate Service', description: 'Live FX rates & historical data', status: 'operational', uptime: 99.94, responseTime: 61, lastIncident: '3 days ago' },
];

const INCIDENTS: Incident[] = [
  { id: 'INC-041', service: 'Tax Calculator', title: 'Elevated response times for EU VAT lookups', severity: 'minor', status: 'investigating', date: '2026-04-06 11:42 UTC', duration: 'Ongoing' },
  { id: 'INC-040', service: 'Classification Engine', title: 'Intermittent timeout errors (< 0.3% of requests)', severity: 'minor', status: 'resolved', date: '2026-03-30 14:15 UTC', duration: '42 min' },
  { id: 'INC-039', service: 'API Gateway', title: 'Rate limit configuration rollback caused brief rejections', severity: 'major', status: 'resolved', date: '2026-03-23 09:07 UTC', duration: '18 min' },
  { id: 'INC-038', service: 'Document Generator', title: 'PDF rendering delay for large batch exports', severity: 'minor', status: 'resolved', date: '2026-04-01 16:30 UTC', duration: '1h 12min' },
];

const STATUS_CONFIG: Record<ServiceStatus, { dot: string; label: string; bg: string }> = {
  operational: { dot: '#4ade80', label: 'Operational', bg: 'rgba(34,197,94,0.1)' },
  degraded:    { dot: '#facc15', label: 'Degraded', bg: 'rgba(234,179,8,0.1)' },
  outage:      { dot: '#f87171', label: 'Outage', bg: 'rgba(239,68,68,0.1)' },
};

const SEV_COLORS: Record<Incident['severity'], string> = {
  minor: '#facc15', major: '#fb923c', critical: '#f87171',
};

const INC_STATUS_COLORS: Record<Incident['status'], { bg: string; color: string }> = {
  resolved:      { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  monitoring:    { bg: 'rgba(234,179,8,0.15)', color: '#facc15' },
  investigating: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
};

export default function StatusPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const allOperational = SERVICES.every(s => s.status === 'operational');
  const anyOutage = SERVICES.some(s => s.status === 'outage');

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '60px 24px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>MONITORING</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>System Status</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Real-time service health and incident history.</p>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Auto-refreshes every 30s · Last: {new Date().toLocaleTimeString()}
            <span style={{ display: 'none' }}>{tick}</span>
          </div>
        </div>

        {/* Overall banner */}
        <div style={{
          background: anyOutage ? 'rgba(239,68,68,0.1)' : allOperational ? 'rgba(34,197,94,0.08)' : 'rgba(234,179,8,0.08)',
          border: `1px solid ${anyOutage ? 'rgba(239,68,68,0.3)' : allOperational ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`,
          borderRadius: 14, padding: '16px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: anyOutage ? '#f87171' : allOperational ? '#4ade80' : '#facc15', boxShadow: `0 0 8px ${anyOutage ? '#f87171' : allOperational ? '#4ade80' : '#facc15'}` }} />
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {anyOutage ? 'Service Outage Detected' : allOperational ? 'All Systems Operational' : 'Partial Service Degradation'}
          </div>
        </div>

        {/* Service cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {SERVICES.map((svc, i) => {
            const cfg = STATUS_CONFIG[svc.status];
            return (
              <div key={i} style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Status dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: `0 0 6px ${cfg.dot}` }} />
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{svc.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: cfg.bg, color: cfg.dot }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{svc.description}</div>
                </div>
                {/* Metrics */}
                <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: svc.uptime >= 99.9 ? '#4ade80' : svc.uptime >= 99 ? '#facc15' : '#f87171' }}>{svc.uptime}%</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Uptime</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: svc.responseTime < 100 ? '#4ade80' : svc.responseTime < 300 ? '#facc15' : '#f87171' }}>{svc.responseTime}ms</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Response</div>
                  </div>
                  {svc.lastIncident && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Last incident</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{svc.lastIncident}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Incidents */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Recent Incidents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {INCIDENTS.map((inc, i) => {
              const istc = INC_STATUS_COLORS[inc.status];
              return (
                <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{inc.id}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${SEV_COLORS[inc.severity]}20`, color: SEV_COLORS[inc.severity], textTransform: 'uppercase' }}>{inc.severity}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: istc.bg, color: istc.color, textTransform: 'uppercase' }}>{inc.status}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{inc.duration}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{inc.title}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    <span>{inc.service}</span>
                    <span>{inc.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
