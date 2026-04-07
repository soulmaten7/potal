'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const CARRIERS = [
  { name: 'DHL Express', factor: 5000 },
  { name: 'FedEx', factor: 5000 },
  { name: 'UPS', factor: 5000 },
  { name: 'USPS', factor: 6000 },
  { name: 'DHL eCommerce', factor: 6000 },
];

export default function DimWeightPage() {
  const [length, setLength] = useState('40');
  const [width, setWidth] = useState('30');
  const [height, setHeight] = useState('20');
  const [actualWeight, setActualWeight] = useState('3');
  const [unitCm, setUnitCm] = useState(true);
  const [unitKg, setUnitKg] = useState(true);
  const [carrier, setCarrier] = useState('DHL Express');
  const [result, setResult] = useState<{ dimWeight: number; actualKg: number; billable: number; factor: number } | null>(null);

  function calculate() {
    let l = parseFloat(length) || 0;
    let w = parseFloat(width) || 0;
    let h = parseFloat(height) || 0;
    let aw = parseFloat(actualWeight) || 0;

    if (!unitCm) { l *= 2.54; w *= 2.54; h *= 2.54; }
    if (!unitKg) { aw *= 0.453592; }

    const c = CARRIERS.find(x => x.name === carrier) || CARRIERS[0];
    const dimWeight = Math.round((l * w * h) / c.factor * 100) / 100;
    const billable = Math.max(dimWeight, aw);

    setResult({ dimWeight, actualKg: Math.round(aw * 100) / 100, billable: Math.round(billable * 100) / 100, factor: c.factor });
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? accent : 'rgba(255,255,255,0.1)', color: active ? '#fff' : 'rgba(255,255,255,0.5)',
  });

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SHIPPING TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Dimensional Weight Calculator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Calculate billable weight based on package dimensions and carrier DIM factors.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Dimensions</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setUnitCm(true)} style={toggleStyle(unitCm)}>cm</button>
              <button onClick={() => setUnitCm(false)} style={toggleStyle(!unitCm)}>inch</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Length</label><input value={length} onChange={e => setLength(e.target.value)} type="number" style={inputStyle} /></div>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Width</label><input value={width} onChange={e => setWidth(e.target.value)} type="number" style={inputStyle} /></div>
            <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Height</label><input value={height} onChange={e => setHeight(e.target.value)} type="number" style={inputStyle} /></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Actual Weight</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setUnitKg(true)} style={toggleStyle(unitKg)}>kg</button>
              <button onClick={() => setUnitKg(false)} style={toggleStyle(!unitKg)}>lb</button>
            </div>
          </div>
          <input value={actualWeight} onChange={e => setActualWeight(e.target.value)} type="number" placeholder="3" style={inputStyle} />

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Carrier</label>
            <select value={carrier} onChange={e => setCarrier(e.target.value)} style={inputStyle}>
              {CARRIERS.map(c => <option key={c.name} value={c.name}>{c.name} (DIM ÷ {c.factor})</option>)}
            </select>
          </div>
        </div>

        <button onClick={calculate}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Calculate
        </button>

        {result && (
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>DIM Weight</span><span style={{ fontWeight: 600 }}>{result.dimWeight} kg</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Actual Weight</span><span style={{ fontWeight: 600 }}>{result.actualKg} kg</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>DIM Factor</span><span style={{ fontWeight: 600 }}>÷ {result.factor}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Billable Weight</span>
                <span style={{ color: accent, fontSize: 22, fontWeight: 800 }}>{result.billable} kg</span>
              </div>
            </div>
            {/* Visual comparison bar */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 80 }}>DIM</span>
                <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((result.dimWeight / result.billable) * 100, 100)}%`, background: result.dimWeight >= result.actualKg ? accent : 'rgba(255,255,255,0.2)', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 80 }}>Actual</span>
                <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min((result.actualKg / result.billable) * 100, 100)}%`, background: result.actualKg >= result.dimWeight ? accent : 'rgba(255,255,255,0.2)', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, textAlign: 'center' }}>
                {result.dimWeight > result.actualKg ? 'Billed by DIM weight (package is lightweight for its size)' : 'Billed by actual weight (package is dense)'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
