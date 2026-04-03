'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

// HS Code 21 Section 기반 Material → 허용 Category 매핑
const MATERIAL_TO_CATEGORIES: Record<string, string[]> = {
  cotton:         ['apparel', 'footwear', 'accessories', 'other'],
  polyester:      ['apparel', 'footwear', 'accessories', 'sporting_goods', 'other'],
  wool:           ['apparel', 'accessories', 'other'],
  silk:           ['apparel', 'accessories', 'other'],
  linen:          ['apparel', 'furniture', 'accessories', 'other'],
  denim:          ['apparel', 'accessories', 'other'],
  nylon:          ['apparel', 'footwear', 'accessories', 'sporting_goods', 'other'],
  leather:        ['apparel', 'footwear', 'accessories', 'automotive', 'other'],
  plastic:        ['toys', 'electronics', 'automotive', 'industrial', 'other'],
  rubber:         ['footwear', 'toys', 'automotive', 'sporting_goods', 'industrial', 'other'],
  aluminum:       ['electronics', 'automotive', 'industrial', 'sporting_goods', 'furniture', 'other'],
  steel:          ['automotive', 'industrial', 'electronics', 'sporting_goods', 'other'],
  wood:           ['furniture', 'toys', 'other'],
  glass:          ['industrial', 'electronics', 'other'],
  ceramic:        ['industrial', 'other'],
  paper:          ['books', 'other'],
  gold:           ['jewelry', 'accessories', 'other'],
  silver:         ['jewelry', 'accessories', 'other'],
  copper:         ['electronics', 'industrial', 'other'],
  zinc:           ['industrial', 'other'],
  titanium:       ['industrial', 'electronics', 'sporting_goods', 'other'],
  'carbon-fiber': ['automotive', 'sporting_goods', 'industrial', 'other'],
  'lithium-ion':  ['electronics', 'automotive', 'industrial', 'other'],
  other:          ['apparel','electronics','footwear','accessories','cosmetics','food','furniture','toys','books','automotive','jewelry','sporting_goods','industrial','other'],
};

const ALL_MATERIALS = [
  'cotton','polyester','wool','silk','linen','denim','nylon','leather',
  'plastic','rubber','aluminum','steel','copper','zinc','titanium',
  'carbon-fiber','lithium-ion',
  'wood','glass','ceramic','paper','gold','silver','other',
];
const ALL_CATEGORIES = ['apparel','electronics','footwear','accessories','cosmetics','food','furniture','toys','books','automotive','jewelry','sporting_goods','industrial','other'];

const COUNTRIES = [
  { code: 'CN', name: 'China' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
];

function formatMaterial(m: string): string {
  return m.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

interface CalcResult {
  importDuty: number;
  vat: number;
  processingFee: number;
  totalLandedCost: number;
  confidence: number; // 0-1 from API (confidenceScore)
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 10,
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.55)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const TOTAL_FIELDS = 9;

export default function HeroCalculator() {
  const [productName, setProductName] = useState('');
  const [material, setMaterial] = useState('');
  const [category, setCategory] = useState('');
  const [processing, setProcessing] = useState('');
  const [composition, setComposition] = useState('');
  const [weightSpec, setWeightSpec] = useState('');
  const [price, setPrice] = useState('');
  const [origin, setOrigin] = useState('CN');
  const [destination, setDestination] = useState('US');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');

  // Field counter
  const filledCount = useMemo(() => {
    let count = 0;
    if (productName.trim()) count++;
    if (material) count++;
    if (category) count++;
    if (processing.trim()) count++;
    if (composition.trim()) count++;
    if (weightSpec.trim()) count++;
    if (price) count++;
    if (origin) count++;
    if (destination) count++;
    return count;
  }, [productName, material, category, processing, composition, weightSpec, price, origin, destination]);

  const counterColor = filledCount <= 3 ? '#ef4444' : filledCount <= 6 ? '#eab308' : '#22c55e';

  const handleCalculate = async () => {
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/v1/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Request': 'true',
        },
        body: JSON.stringify({
          ...(productName.trim() ? { productName: productName.trim() } : {}),
          material,
          productCategory: category,
          ...(processing.trim() ? { processing: processing.trim() } : {}),
          ...(composition.trim() ? { composition: composition.trim() } : {}),
          ...(weightSpec.trim() ? { weight_spec: weightSpec.trim() } : {}),
          price: priceNum,
          origin,
          destinationCountry: destination,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError('Unable to calculate. Try with more details.');
        return;
      }
      const data = json.data as Record<string, unknown>;
      const duty = typeof data.importDuty === 'number' ? data.importDuty : 0;
      const vat = typeof data.vat === 'number' ? data.vat
        : typeof data.salesTax === 'number' ? data.salesTax : 0;
      const tlc = typeof data.totalLandedCost === 'number' ? data.totalLandedCost : priceNum + duty + vat;
      const fee = Math.max(0, Math.round((tlc - priceNum - duty - vat) * 100) / 100);
      const conf = typeof data.confidenceScore === 'number' ? data.confidenceScore : 0;
      setResult({ importDuty: duty, vat, processingFee: fee, totalLandedCost: tlc, confidence: conf });
    } catch {
      setError('Unable to calculate. Try with more details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 20,
      padding: 32,
      color: 'white',
    }}>
      {/* Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(232,100,10,0.2)',
          color: '#E8640A',
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}>
          LIVE DEMO
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
          Try it now — no signup required
        </h3>
      </div>

      {/* Field counter with dots */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fields Filled
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: counterColor }}>
            {filledCount} / {TOTAL_FIELDS}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: TOTAL_FIELDS }, (_, i) => (
            <div key={i} style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < filledCount ? counterColor : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Inputs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Row 1: Product Name - full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Product Name</label>
          <input
            type="text"
            placeholder="e.g. Cotton T-Shirt, Running Shoes..."
            value={productName}
            onChange={e => setProductName(e.target.value)}
            style={{ ...inputStyle }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        {/* Row 2: Material | Category */}
        <div>
          <label style={labelStyle}>Material</label>
          <select
            value={material}
            onChange={e => {
              const newMat = e.target.value;
              setMaterial(newMat);
              const allowed = MATERIAL_TO_CATEGORIES[newMat] || ALL_CATEGORIES;
              setCategory(allowed[0]);
            }}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            <option value="" disabled style={{ background: '#0a1e3d', color: 'rgba(255,255,255,0.4)' }}>
              Select material...
            </option>
            {ALL_MATERIALS.map(m => (
              <option key={m} value={m} style={{ background: '#0a1e3d', color: 'white' }}>
                {formatMaterial(m)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={category}
            disabled={!material}
            onChange={e => setCategory(e.target.value)}
            style={{
              ...inputStyle,
              cursor: material ? 'pointer' : 'not-allowed',
              opacity: material ? 1 : 0.35,
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            {!material ? (
              <option value="" style={{ background: '#0a1e3d', color: 'rgba(255,255,255,0.4)' }}>
                Select material first...
              </option>
            ) : (
              (MATERIAL_TO_CATEGORIES[material] || ALL_CATEGORIES).map(c => (
                <option key={c} value={c} style={{ background: '#0a1e3d', color: 'white' }}>
                  {c.replace('_', ' ')}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Row 3: Processing | Composition */}
        <div>
          <label style={labelStyle}>
            <span>Processing</span>
            <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <input
            type="text"
            placeholder="e.g. knitted, woven, forged..."
            value={processing}
            onChange={e => setProcessing(e.target.value)}
            style={{ ...inputStyle }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <span>Composition</span>
            <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 100% cotton, 80/20 poly-spandex..."
            value={composition}
            onChange={e => setComposition(e.target.value)}
            style={{ ...inputStyle }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        {/* Row 4: Weight/Spec | Price */}
        <div>
          <label style={labelStyle}>
            <span>Weight / Spec</span>
            <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 200g, 5kg, 2.5mm thickness..."
            value={weightSpec}
            onChange={e => setWeightSpec(e.target.value)}
            style={{ ...inputStyle }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        <div>
          <label style={labelStyle}>Price (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 49.99"
            value={price}
            onChange={e => setPrice(e.target.value)}
            style={{ ...inputStyle }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        {/* Row 5: Origin | Destination */}
        <div>
          <label style={labelStyle}>Origin Country</label>
          <select
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: '#0a1e3d', color: 'white' }}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Destination</label>
          <select
            value={destination}
            onChange={e => setDestination(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code} style={{ background: '#0a1e3d', color: 'white' }}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculate button */}
      <button
        onClick={handleCalculate}
        disabled={loading || !material || !price}
        style={{
          width: '100%',
          padding: '13px 0',
          background: (loading || !material || !price) ? 'rgba(232,100,10,0.5)' : '#E8640A',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 15,
          cursor: (loading || !material || !price) ? 'default' : 'pointer',
          transition: 'background 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onMouseEnter={e => { if (!loading && material && price) e.currentTarget.style.background = '#f97316'; }}
        onMouseLeave={e => { if (!loading && material && price) e.currentTarget.style.background = '#E8640A'; }}
      >
        {loading ? (
          <>
            <span style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            Calculating...
          </>
        ) : 'Calculate'}
      </button>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10,
          fontSize: 13,
          color: '#fca5a5',
        }}>
          {error}
        </div>
      )}

      {/* Result breakdown */}
      {result && (
        <div style={{ marginTop: 18 }}>
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {/* Confidence badge — real API confidence */}
            {(() => {
              const confPct = Math.round(result.confidence * 100);
              const confColor = confPct >= 90 ? '#4ade80' : confPct >= 70 ? '#facc15' : '#f87171';
              const confBg = confPct >= 90 ? 'rgba(34,197,94,0.15)' : confPct >= 70 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)';
              const confBorder = confPct >= 90 ? 'rgba(34,197,94,0.3)' : confPct >= 70 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)';
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Classification Confidence</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 8,
                    background: confBg,
                    color: confColor,
                    border: `1px solid ${confBorder}`,
                  }}>
                    {confPct}%
                  </span>
                </div>
              );
            })()}

            {[
              { label: 'Import Duty', value: result.importDuty },
              { label: 'VAT / GST', value: result.vat },
              ...(result.processingFee > 0 ? [{ label: 'Processing Fee', value: result.processingFee }] : []),
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                fontSize: 14,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  ${item.value.toFixed(2)}
                </span>
              </div>
            ))}
            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '13px 16px',
              fontSize: 15,
              background: 'rgba(232,100,10,0.1)',
            }}>
              <span style={{ fontWeight: 700, color: 'white' }}>Total Landed Cost</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#E8640A' }}>
                ${result.totalLandedCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Low confidence hint */}
          {result.confidence < 0.7 && (
            <p style={{ fontSize: 11, color: 'rgba(234,179,8,0.8)', margin: '8px 0 0', lineHeight: 1.5 }}>
              Low confidence — try adding more details or checking your inputs.
            </p>
          )}

          {/* Disclaimer + CTA */}
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '8px 0 14px', lineHeight: 1.5 }}>
            * Preview estimate. Sign up free for exact calculation with HS Code.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '11px 0',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10,
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            Get exact calculation →
          </Link>
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
