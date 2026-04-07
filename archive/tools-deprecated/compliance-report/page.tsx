'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

interface FlaggedItem {
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  count?: number;
}

interface ReportResult {
  complianceScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  totalScreenings?: number;
  flaggedCount?: number;
  clearedCount?: number;
  flaggedItems?: FlaggedItem[];
  recommendations?: string[];
  summary?: string;
  reportType?: string;
  dateRange?: { from: string; to: string };
  generatedAt?: string;
}

const REPORT_TYPES = [
  { value: 'screening_audit', label: 'Screening Audit', desc: 'Denied party & sanctions screening history' },
  { value: 'export_control_audit', label: 'Export Control Audit', desc: 'ECCN classifications & license checks' },
  { value: 'full_compliance', label: 'Full Compliance Report', desc: 'Comprehensive compliance overview' },
];

export default function ComplianceReportPage() {
  const [companyName, setCompanyName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('full_compliance');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!companyName.trim()) { setError('Please enter a company name.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/v1/reports/compliance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          reportType,
          dateRange: {
            from: dateFrom || undefined,
            to: dateTo || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Report generation failed.'); return; }
      setResult(json.data ?? json);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  const scoreColor = (score?: number) => {
    if (score === undefined) return 'rgba(255,255,255,0.6)';
    if (score >= 85) return '#4ade80';
    if (score >= 65) return '#facc15';
    return '#f87171';
  };

  const riskColor: Record<string, string> = {
    low: '#4ade80', medium: '#facc15', high: '#f87171', critical: '#ef4444',
  };

  const severityColor: Record<string, string> = {
    high: '#f87171', medium: '#fbbf24', low: '#a3a3a3',
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>COMPLIANCE TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Compliance Reports</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>
          Generate compliance audit reports with screening history, export control checks, and risk assessment.
        </p>

        {/* Report type selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>Report Type</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REPORT_TYPES.map(rt => (
              <button key={rt.value} onClick={() => setReportType(rt.value)} style={{
                padding: '12px 16px', borderRadius: 10, border: `1px solid ${reportType === rt.value ? 'rgba(232,100,10,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: reportType === rt.value ? 'rgba(232,100,10,0.12)' : 'rgba(0,0,0,0.2)',
                color: 'white', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: reportType === rt.value ? accent : 'white' }}>{rt.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{rt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Company Name *</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Trading Co." style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Date From</label>
              <input value={dateFrom} onChange={e => setDateFrom(e.target.value)} type="date" style={selectStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Date To</label>
              <input value={dateTo} onChange={e => setDateTo(e.target.value)} type="date" style={selectStyle} />
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !companyName.trim()} style={{
          width: '100%', padding: '14px', background: loading ? 'rgba(232,100,10,0.5)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Generating Report...' : 'Generate Compliance Report'}
        </button>

        {error && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#fca5a5' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 24 }}>
            {/* Score + Risk header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Compliance Score</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor(result.complianceScore), lineHeight: 1 }}>
                  {result.complianceScore ?? '—'}
                </div>
                {result.complianceScore !== undefined && <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>/100</div>}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Risk Level</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: riskColor[result.riskLevel || 'low'], textTransform: 'uppercase' }}>
                  {result.riskLevel || '—'}
                </div>
                {result.flaggedCount !== undefined && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                    {result.flaggedCount} flagged / {result.totalScreenings ?? 0} total
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            {(result.totalScreenings !== undefined || result.flaggedCount !== undefined || result.clearedCount !== undefined) && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Checks', value: result.totalScreenings, color: 'rgba(255,255,255,0.7)' },
                  { label: 'Cleared', value: result.clearedCount, color: '#4ade80' },
                  { label: 'Flagged', value: result.flaggedCount, color: '#f87171' },
                ].map(stat => stat.value !== undefined && (
                  <div key={stat.label} style={{ flex: 1, minWidth: 100, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div style={{ background: 'rgba(232,100,10,0.06)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(232,100,10,0.15)', marginBottom: 14, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                {result.summary}
              </div>
            )}

            {/* Flagged items */}
            {result.flaggedItems && result.flaggedItems.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>Flagged Items</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.flaggedItems.map((item, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 16px', border: `1px solid ${severityColor[item.severity]}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{item.description}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{item.category}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {item.count !== undefined && <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{item.count}x</span>}
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: `${severityColor[item.severity]}20`, color: severityColor[item.severity], textTransform: 'uppercase' }}>
                          {item.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Recommendations</div>
                {result.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {result.generatedAt && (
              <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                Report generated: {result.generatedAt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
