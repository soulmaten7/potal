'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const CATEGORIES = [
  { value: 'general', label: 'General Goods', riskFactor: 1.0 },
  { value: 'electronics', label: 'Electronics', riskFactor: 1.4 },
  { value: 'fragile', label: 'Fragile / Glass', riskFactor: 1.8 },
  { value: 'luxury', label: 'Luxury / Jewelry', riskFactor: 2.0 },
  { value: 'perishable', label: 'Perishable', riskFactor: 1.6 },
  { value: 'hazardous', label: 'Hazardous / Chemicals', riskFactor: 2.2 },
];

const SHIPPING_METHODS = [
  { value: 'express', label: 'Express Air', riskFactor: 0.8 },
  { value: 'air', label: 'Standard Air', riskFactor: 0.9 },
  { value: 'sea', label: 'Ocean Freight', riskFactor: 1.2 },
  { value: 'ground', label: 'Ground', riskFactor: 1.0 },
];

const REGION_RISK: Record<string, number> = {
  US: 0.9, CA: 0.9, GB: 0.9, DE: 0.9, JP: 0.85, KR: 0.9, AU: 0.95,
  CN: 1.1, IN: 1.2, BR: 1.3, MX: 1.15, NG: 1.5, RU: 1.4, default: 1.1,
};

interface Plan { name: string; rate: number; premium: number; coverage: number; deductible: number; features: string[] }

export default function InsurancePage() {
  const [value, setValue] = useState('1000');
  const [destination, setDestination] = useState('US');
  const [shipping, setShipping] = useState('express');
  const [category, setCategory] = useState('general');
  const [plans, setPlans] = useState<Plan[] | null>(null);

  function calculate() {
    const v = parseFloat(value) || 0;
    if (v <= 0) return;
    const catFactor = CATEGORIES.find(c => c.value === category)?.riskFactor || 1;
    const shipFactor = SHIPPING_METHODS.find(s => s.value === shipping)?.riskFactor || 1;
    const regionFactor = REGION_RISK[destination] || REGION_RISK.default;
    const baseRate = 0.012;

    const basicRate = baseRate * catFactor * shipFactor * regionFactor;
    const standardRate = basicRate * 1.5;
    const premiumRate = basicRate * 2.2;

    setPlans([
      { name: 'Basic', rate: basicRate, premium: Math.round(v * basicRate * 100) / 100, coverage: v, deductible: Math.round(v * 0.05), features: ['Loss & damage coverage', 'Standard claim process (10-15 days)'] },
      { name: 'Standard', rate: standardRate, premium: Math.round(v * standardRate * 100) / 100, coverage: v * 1.1, deductible: Math.round(v * 0.02), features: ['Loss, damage & theft coverage', 'Priority claims (5-7 days)', 'Customs delay coverage'] },
      { name: 'Premium', rate: premiumRate, premium: Math.round(v * premiumRate * 100) / 100, coverage: v * 1.2, deductible: 0, features: ['All-risk coverage', 'Express claims (48h)', 'Customs delay & confiscation', 'Zero deductible', 'Return shipping coverage'] },
    ]);
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SHIPPING TOOL</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Shipping Insurance Calculator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Estimate insurance premiums and compare coverage plans for international shipments.</p>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Shipment Value (USD)</label>
              <input value={value} onChange={e => setValue(e.target.value)} type="number" placeholder="1000" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Destination</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle}>
                {Object.keys(REGION_RISK).filter(k => k !== 'default').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Shipping Method</label>
              <select value={shipping} onChange={e => setShipping(e.target.value)} style={inputStyle}>
                {SHIPPING_METHODS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Goods Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button onClick={calculate}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: accent, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Calculate Premiums
        </button>

        {plans && (
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {plans.map((plan, i) => (
              <div key={plan.name} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, border: i === 1 ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                {i === 1 && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 8 }}>RECOMMENDED</div>}
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
                <div style={{ color: accent, fontSize: 28, fontWeight: 800, marginBottom: 4 }}>${plan.premium.toFixed(2)}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>{(plan.rate * 100).toFixed(2)}% of value</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Coverage: ${plan.coverage.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Deductible: ${plan.deductible}</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
                  {plan.features.map((f, j) => <div key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>✓ {f}</div>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
