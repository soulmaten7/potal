'use client';

/**
 * US Sales Tax Nexus Checker — shared component
 *
 * Used in:
 *   1. /features/us-sales-tax-nexus-tracking page (standalone "Try it live" widget)
 *   2. Dashboard Tariff Calculator (conditionally rendered when destinationCountry === "US")
 */

import { useState } from 'react';

const US_STATES: Array<{ code: string; name: string }> = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

interface SaleRow {
  id: number;
  state: string;
  amount: string;
  transactions: string;
}

interface TriggeredEntry {
  state: string;
  stateName: string;
  reason: string;
  amount: number;
  salesThreshold: number | null;
  exceededBy: number;
  sourceUrl?: string;
}

interface WarningEntry {
  state: string;
  stateName: string;
  message: string;
  percentToThreshold: number;
}

interface SafeEntry {
  state: string;
  stateName: string;
  amount: number;
  salesThreshold: number | null;
  percentToThreshold: number;
}

interface NexusResult {
  triggered: TriggeredEntry[];
  safe: SafeEntry[];
  warnings: WarningEntry[];
  summary: { totalStates: number; triggered: number; warning: number; safe: number };
  disclaimer: string;
  dataVersion: string;
  dataLastUpdated: string;
}

export default function UsNexusChecker({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<SaleRow[]>([
    { id: 1, state: 'CA', amount: '', transactions: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NexusResult | null>(null);
  const [error, setError] = useState('');

  const addRow = () => {
    const nextId = Math.max(0, ...rows.map(r => r.id)) + 1;
    setRows([...rows, { id: nextId, state: '', amount: '', transactions: '' }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof SaleRow, value: string) => {
    setRows(rows.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleCheck = async () => {
    setError('');
    setResult(null);

    const sales = rows
      .filter(r => r.state && r.amount)
      .map(r => ({
        state: r.state,
        amount: parseFloat(r.amount) || 0,
        ...(r.transactions ? { transactions: parseInt(r.transactions, 10) || 0 } : {}),
      }));

    if (sales.length === 0) {
      setError('Enter at least one state with a sales amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/nexus/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
        body: JSON.stringify({ sales, measurementPeriod: 'last_12_months' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || 'Nexus check failed.');
      } else {
        setResult(json.data as NexusResult);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 8, border: '2px solid #e5e7eb',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white',
  };

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: compact ? 20 : 24, border: '1px solid #e5e7eb' }}>
      {!compact && (
        <>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#02122c' }}>
            US Sales Tax Nexus Check
          </h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
            Enter your US state sales for the last 12 months. We&apos;ll tell you which states you&apos;ve
            triggered economic nexus in (sales tax registration required) and which are approaching the threshold.
          </p>
        </>
      )}

      <div style={{ marginBottom: 12 }}>
        {rows.map(row => (
          <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
            <select
              value={row.state}
              onChange={e => updateRow(row.id, 'state', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select state...</option>
              {US_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="1"
              value={row.amount}
              onChange={e => updateRow(row.id, 'amount', e.target.value)}
              placeholder="Sales amount (USD)"
              style={inputStyle}
            />
            <input
              type="number"
              min="0"
              step="1"
              value={row.transactions}
              onChange={e => updateRow(row.id, 'transactions', e.target.value)}
              placeholder="Transactions (opt.)"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              style={{
                padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                background: rows.length === 1 ? '#f9fafb' : 'white',
                color: rows.length === 1 ? '#cbd5e1' : '#64748b',
                fontSize: 14, fontWeight: 600,
                cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
              }}
              aria-label="Remove row"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={addRow}
          style={{
            padding: '10px 16px', borderRadius: 8, border: '1.5px dashed #cbd5e1',
            background: 'transparent', color: '#475569',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Add another state
        </button>
        <button
          type="button"
          onClick={handleCheck}
          disabled={loading}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: loading ? '#94a3b8' : '#02122c', color: 'white',
            fontSize: 14, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Checking...' : 'Check Nexus Exposure'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 14, borderRadius: 10, background: '#f1f5f9' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TOTAL CHECKED</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#02122c' }}>{result.summary.totalStates}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: '#fef2f2' }}>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>TRIGGERED</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{result.summary.triggered}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: '#fef3c7' }}>
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>WARNING</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{result.summary.warning}</div>
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: '#dcfce7' }}>
              <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, marginBottom: 4 }}>SAFE</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{result.summary.safe}</div>
            </div>
          </div>

          {result.triggered.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
                🔴 Nexus Triggered — Registration Required
              </div>
              {result.triggered.map(t => (
                <div key={t.state} style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                  <strong>{t.state} — {t.stateName}</strong> · ${t.amount.toLocaleString()} sales · threshold ${(t.salesThreshold || 0).toLocaleString()} · exceeded by ${t.exceededBy.toLocaleString()}
                </div>
              ))}
            </div>
          )}

          {result.warnings.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', marginBottom: 8 }}>
                🟡 Approaching Threshold
              </div>
              {result.warnings.map(w => (
                <div key={w.state} style={{ padding: '10px 14px', background: '#fef3c7', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                  <strong>{w.state} — {w.stateName}</strong> · {w.message}
                </div>
              ))}
            </div>
          )}

          {result.safe.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>
                🟢 Safe — Below Threshold
              </div>
              {result.safe.map(s => (
                <div key={s.state} style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                  <strong>{s.state} — {s.stateName}</strong> · ${s.amount.toLocaleString()} sales · {s.salesThreshold ? `${s.percentToThreshold}% of $${s.salesThreshold.toLocaleString()} threshold` : 'no state sales tax'}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
            ⚠️ {result.disclaimer}
            <br />
            <em>Data version {result.dataVersion} · updated {result.dataLastUpdated}</em>
          </div>
        </div>
      )}
    </div>
  );
}
