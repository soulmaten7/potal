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

interface HsClassResult {
  hsCode?: string;
  description?: string;
  section?: string;
  chapter?: string;
}

interface Hs10Result {
  hsCode?: string;
  hsCodePrecision?: 'HS10' | 'HS6';
  classificationMethod?: string;
  description?: string;
  confidence?: number;
  dutyRate?: number;
}

interface FtaResult {
  fta_available: boolean;
  fta_count?: number;
  fta_applied?: string | null;
  savings?: number;
  alternative_ftas?: Array<{ name: string; rate: number }>;
}

interface TradeRemedyCase {
  type?: string;
  rate?: number;
  rate_type?: string;
  enforcement?: string;
}

interface TradeRemedyDetail {
  subject?: boolean;
  cases?: TradeRemedyCase[];
  total_additional_duty?: number;
}

interface RestrictionItem {
  type?: string;
  description?: string;
  license_info?: string;
}

interface RestrictionsResult {
  restricted?: boolean;
  items?: RestrictionItem[];
}

interface RegulatoryWarning {
  category?: string;
  note?: string;
  effective_date?: string | null;
}

interface DetailedBreakdownItem {
  amount: number;
  calculation_basis: string;
}

interface DetailedBreakdown {
  product_price?: DetailedBreakdownItem;
  import_duty?: DetailedBreakdownItem;
  anti_dumping_duty?: DetailedBreakdownItem;
  countervailing_duty?: DetailedBreakdownItem;
  safeguard_duty?: DetailedBreakdownItem;
  vat_gst?: DetailedBreakdownItem;
  customs_processing_fee?: DetailedBreakdownItem;
  merchandise_processing_fee?: DetailedBreakdownItem;
  harbor_maintenance_fee?: DetailedBreakdownItem;
  insurance_estimate?: DetailedBreakdownItem;
  freight_estimate?: DetailedBreakdownItem;
  broker_fee_estimate?: DetailedBreakdownItem;
  total_landed_cost?: DetailedBreakdownItem;
}

interface CalcResult {
  importDuty: number;
  vat: number;
  processingFee: number;
  totalLandedCost: number;
  ablationAccuracy: number;
  // Extended data from API
  hsClassification?: HsClassResult | null;
  dutyRateSource?: string | null;
  dutyConfidenceScore?: number | null;
  ftaUtilization?: FtaResult | null;
  restrictions?: RestrictionsResult | null;
  regulatoryWarnings?: RegulatoryWarning[] | null;
  tradeRemediesDetail?: TradeRemedyDetail | null;
  detailedBreakdown?: DetailedBreakdown | null;
  deMinimisApplied?: boolean;
  dutyRate?: string | null;
  hs10Resolution?: Hs10Result | null;
}

function formatHsCode(code: string): string {
  const clean = code.replace(/\D/g, '');
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 4)}.${clean.slice(4)}`;
  if (clean.length <= 8) return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean.slice(6, 8)}.${clean.slice(8)}`;
}

const EU_SET = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
  'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
  'PL','PT','RO','SK','SI','ES','SE',
]);

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

const TOTAL_FIELDS = 10;

function CollapsibleSection({ title, defaultOpen = false, color, delay = 0, children }: {
  title: string;
  defaultOpen?: boolean;
  color: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      marginTop: 10,
      background: 'rgba(0,0,0,0.2)',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      animation: `fadeSlideIn 0.3s ease ${delay}s both`,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>{title}</span>
        <span style={{
          fontSize: 10,
          transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>&#9660;</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function formatSourceLabel(src: string): string {
  const map: Record<string, string> = {
    live_db: 'MacMap Live DB',
    db: 'Tariff DB',
    mfn: 'MFN Rate',
    agr: 'Agreement Rate',
    min: 'Minimum Rate',
    external_api: 'External API',
    hardcoded: 'Default',
    ntlc: 'National Tariff',
  };
  return map[src] || src;
}

export default function HeroCalculator() {
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
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
    if (description.trim()) count++;
    if (material) count++;
    if (category) count++;
    if (processing.trim()) count++;
    if (composition.trim()) count++;
    if (weightSpec.trim()) count++;
    if (price) count++;
    if (origin) count++;
    if (destination) count++;
    return count;
  }, [productName, description, material, category, processing, composition, weightSpec, price, origin, destination]);

  const counterColor = filledCount <= 3 ? '#ef4444' : filledCount <= 6 ? '#eab308' : '#22c55e';

  const handleCalculate = async () => {
    if (!material) {
      setError('Please select a material.');
      return;
    }
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
          ...(description.trim() ? { description: description.trim() } : {}),
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
      // Ablation-tested accuracy (466 combinations, field-validator.ts lines 452-458)
      let acc = 0;
      if (productName.trim().length >= 2) acc += 18;
      if (material) acc += 45;
      if (category) acc += 33;
      if (description.trim()) acc += 4;
      acc = Math.min(acc, 100);
      setResult({
        importDuty: duty,
        vat,
        processingFee: fee,
        totalLandedCost: tlc,
        ablationAccuracy: acc,
        hsClassification: (data.hsClassification as HsClassResult) ?? null,
        dutyRateSource: (data.dutyRateSource as string) ?? null,
        dutyConfidenceScore: typeof data.dutyConfidenceScore === 'number' ? data.dutyConfidenceScore : null,
        ftaUtilization: (data.fta_utilization as FtaResult) ?? null,
        restrictions: (data.restrictions as RestrictionsResult) ?? null,
        regulatoryWarnings: (data.regulatory_warnings as RegulatoryWarning[]) ?? null,
        tradeRemediesDetail: (data.trade_remedies_detail as TradeRemedyDetail) ?? null,
        detailedBreakdown: (data.detailedCostBreakdown as DetailedBreakdown) ?? null,
        deMinimisApplied: data.deMinimisApplied === true,
        dutyRate: (data.detailedCostBreakdown as DetailedBreakdown)?.import_duty?.calculation_basis ?? null,
        hs10Resolution: (data.hs10Resolution as Hs10Result) ?? null,
      });
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

        {/* Row 3: Description - full width textarea */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            <span>Description</span>
            <span style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Men's crew neck short sleeve basic t-shirt for casual wear..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 48 }}
            onFocus={e => e.currentTarget.style.borderColor = '#E8640A'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          />
        </div>

        {/* Row 4: Processing | Composition */}
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
          {/* === COST BREAKDOWN (always open, matches original) === */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeSlideIn 0.3s ease both',
          }}>
            {/* Classification Accuracy — ablation-tested (466 combinations) */}
            {(() => {
              const acc = result.ablationAccuracy;
              const accColor = acc >= 96 ? '#4ade80' : acc >= 70 ? '#facc15' : '#f87171';
              const accBg = acc >= 96 ? 'rgba(34,197,94,0.15)' : acc >= 70 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)';
              const accBorder = acc >= 96 ? 'rgba(34,197,94,0.3)' : acc >= 70 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)';
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Classification Accuracy</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 8,
                    background: accBg,
                    color: accColor,
                    border: `1px solid ${accBorder}`,
                  }}>
                    ~{acc}%
                  </span>
                </div>
              );
            })()}

            {[
              { label: 'Import Duty', value: result.importDuty, sub: result.dutyRate },
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
                <div>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item.label}</span>
                  {'sub' in item && item.sub && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {item.sub}{result.dutyRateSource ? ` (${formatSourceLabel(result.dutyRateSource)})` : ''}
                    </div>
                  )}
                </div>
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

          {/* === CLASSIFICATION (collapsible) === */}
          {result.hsClassification?.hsCode && (
            <CollapsibleSection title="Classification" color="#fb923c" delay={0.1}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>HS Code</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fb923c',
                      fontFamily: 'monospace',
                      background: 'rgba(251,146,60,0.12)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}>
                      {result.hs10Resolution?.hsCodePrecision === 'HS10' && result.hs10Resolution?.hsCode
                        ? formatHsCode(result.hs10Resolution.hsCode)
                        : formatHsCode(result.hsClassification.hsCode!)}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                      {result.hs10Resolution?.hsCodePrecision === 'HS10'
                        ? (destination === 'US' ? 'HTS 10-digit'
                          : EU_SET.has(destination) ? 'TARIC 10-digit'
                          : 'National 10-digit')
                        : 'HS 6-digit (international)'}
                    </span>
                  </div>
                </div>
                {(result.hs10Resolution?.hsCodePrecision === 'HS10' ? result.hs10Resolution.description : result.hsClassification.description) && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                    {result.hs10Resolution?.hsCodePrecision === 'HS10'
                      ? result.hs10Resolution.description
                      : result.hsClassification.description}
                  </div>
                )}
                {(result.hs10Resolution?.confidence ?? result.dutyConfidenceScore) != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Confidence</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color:
                      ((result.hs10Resolution?.confidence ?? result.dutyConfidenceScore) || 0) >= 0.9 ? '#4ade80' : '#facc15'
                    }}>
                      {Math.round(((result.hs10Resolution?.confidence ?? result.dutyConfidenceScore) || 0) * 100)}%
                    </span>
                  </div>
                )}
                {result.dutyRateSource && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Source</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                      {formatSourceLabel(result.dutyRateSource)}
                    </span>
                  </div>
                )}
                {result.hs10Resolution?.classificationMethod && result.hs10Resolution.hsCodePrecision === 'HS10' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Method</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                      {result.hs10Resolution.classificationMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* === TRADE AGREEMENTS (collapsible) === */}
          {result.ftaUtilization?.fta_available && (
            <CollapsibleSection title="Trade Agreements" color="#4ade80" delay={0.2}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.ftaUtilization.fta_applied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>FTA Applied</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>
                      {result.ftaUtilization.fta_applied}
                    </span>
                  </div>
                )}
                {typeof result.ftaUtilization.savings === 'number' && result.ftaUtilization.savings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Potential Savings</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                      -${result.ftaUtilization.savings.toFixed(2)}
                    </span>
                  </div>
                )}
                {result.ftaUtilization.alternative_ftas && result.ftaUtilization.alternative_ftas.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>
                      Alternative agreements:
                    </span>
                    {result.ftaUtilization.alternative_ftas.map((fta, i) => (
                      <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', paddingLeft: 8 }}>
                        {fta.name} ({(fta.rate * 100).toFixed(1)}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* === COMPLIANCE (collapsible) === */}
          {(result.restrictions?.restricted || (result.regulatoryWarnings && result.regulatoryWarnings.length > 0) || result.tradeRemediesDetail?.subject) && (
            <CollapsibleSection title="Compliance" color="#facc15" delay={0.3}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Restrictions */}
                {result.restrictions?.restricted && result.restrictions.items && result.restrictions.items.length > 0 ? (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#f87171', display: 'block', marginBottom: 4 }}>
                      Restrictions
                    </span>
                    {result.restrictions.items.map((r, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 8, marginBottom: 2 }}>
                        <span style={{ color: '#f87171' }}>{r.type}</span>
                        {r.description && <span> — {r.description}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Restrictions</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>None detected</span>
                  </div>
                )}

                {/* Trade Remedies */}
                {result.tradeRemediesDetail?.subject && result.tradeRemediesDetail.cases && result.tradeRemediesDetail.cases.length > 0 && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#facc15', display: 'block', marginBottom: 4 }}>
                      Trade Remedies
                    </span>
                    {result.tradeRemediesDetail.cases.map((c, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 8, marginBottom: 2 }}>
                        <span style={{ color: '#facc15' }}>{c.type}</span>
                        {typeof c.rate === 'number' && <span>: {(c.rate * 100).toFixed(2)}%</span>}
                      </div>
                    ))}
                    {typeof result.tradeRemediesDetail.total_additional_duty === 'number' && result.tradeRemediesDetail.total_additional_duty > 0 && (
                      <div style={{ fontSize: 11, color: '#facc15', paddingLeft: 8, marginTop: 4 }}>
                        Additional duty: ${result.tradeRemediesDetail.total_additional_duty.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {/* Regulatory Warnings */}
                {result.regulatoryWarnings && result.regulatoryWarnings.length > 0 && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#f87171', display: 'block', marginBottom: 4 }}>
                      Regulatory Warnings
                    </span>
                    {result.regulatoryWarnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 8, marginBottom: 2 }}>
                        {w.category && <span style={{ color: '#f87171' }}>{w.category}: </span>}
                        {w.note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Low accuracy hint */}
          {result.ablationAccuracy < 70 && (
            <p style={{ fontSize: 11, color: 'rgba(234,179,8,0.8)', margin: '8px 0 0', lineHeight: 1.5 }}>
              Low accuracy — add more fields for better results.
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
            Sign up free — Get API key for bulk access →
          </Link>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
