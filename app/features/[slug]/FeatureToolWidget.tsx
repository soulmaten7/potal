'use client';

import { useState } from 'react';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  defaultValue?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface ToolConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  fields: FieldConfig[];
  submitLabel?: string;
}

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' }, { value: 'CN', label: 'China' },
  { value: 'GB', label: 'United Kingdom' }, { value: 'DE', label: 'Germany' },
  { value: 'JP', label: 'Japan' }, { value: 'KR', label: 'South Korea' },
  { value: 'FR', label: 'France' }, { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' }, { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' }, { value: 'MX', label: 'Mexico' },
  { value: 'IT', label: 'Italy' }, { value: 'ES', label: 'Spain' },
  { value: 'NL', label: 'Netherlands' }, { value: 'SG', label: 'Singapore' },
  { value: 'TH', label: 'Thailand' }, { value: 'VN', label: 'Vietnam' },
];

// Map feature slugs to their tool configurations
const TOOL_CONFIGS: Record<string, ToolConfig> = {
  'hs-code-classification': {
    endpoint: '/api/v1/classify',
    method: 'POST',
    fields: [
      { name: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g. Bluetooth wireless headphones', required: true },
      { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Plastic, silicone, lithium battery' },
      { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Consumer electronics' },
      { name: 'originCountry', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN' },
    ],
  },
  'duty-rate-calculation': {
    endpoint: '/api/v1/calculate',
    method: 'POST',
    fields: [
      { name: 'price', label: 'Product Price (USD)', type: 'number', placeholder: 'e.g. 49.99', required: true },
      { name: 'origin', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN', required: true },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
      { name: 'hsCode', label: 'HS Code (optional)', type: 'text', placeholder: 'e.g. 8518.30' },
    ],
  },
  'tax-calculation-vat-gst': {
    endpoint: '/api/v1/calculate',
    method: 'POST',
    fields: [
      { name: 'price', label: 'Product Price (USD)', type: 'number', placeholder: 'e.g. 100', required: true },
      { name: 'origin', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN' },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'GB', required: true },
    ],
  },
  'sanctions-screening': {
    endpoint: '/api/v1/screening',
    method: 'POST',
    fields: [
      { name: 'name', label: 'Entity Name', type: 'text', placeholder: 'e.g. Huawei Technologies', required: true },
      { name: 'country', label: 'Country', type: 'select', options: COUNTRY_OPTIONS },
      { name: 'type', label: 'Entity Type', type: 'select', options: [{ value: 'individual', label: 'Individual' }, { value: 'entity', label: 'Organization' }], defaultValue: 'entity' },
    ],
  },
  'fta-detection': {
    endpoint: '/api/v1/fta',
    method: 'GET',
    fields: [
      { name: 'origin', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'KR', required: true },
      { name: 'destination', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
      { name: 'hsCode', label: 'HS Code (optional)', type: 'text', placeholder: 'e.g. 8471.30' },
    ],
  },
  'de-minimis-rules': {
    endpoint: '/api/v1/de-minimis/check',
    method: 'POST',
    fields: [
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
      { name: 'price', label: 'Product Value (USD)', type: 'number', placeholder: 'e.g. 150', required: true },
    ],
  },
  'currency-exchange': {
    endpoint: '/api/v1/exchange-rate',
    method: 'GET',
    fields: [
      { name: 'from', label: 'From Currency', type: 'text', placeholder: 'USD', defaultValue: 'USD', required: true },
      { name: 'to', label: 'To Currency', type: 'text', placeholder: 'EUR', defaultValue: 'EUR', required: true },
      { name: 'amount', label: 'Amount', type: 'number', placeholder: '100', defaultValue: '100', required: true },
    ],
  },
  'export-control-classification': {
    endpoint: '/api/v1/export-controls/classify',
    method: 'POST',
    fields: [
      { name: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g. Thermal imaging camera', required: true },
      { name: 'originCountry', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US' },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN' },
    ],
  },
  'anti-dumping-duties': {
    endpoint: '/api/v1/trade-remedies',
    method: 'POST',
    fields: [
      { name: 'hsCode', label: 'HS Code', type: 'text', placeholder: 'e.g. 7208.51', required: true },
      { name: 'originCountry', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN', required: true },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
    ],
  },
  'ddp-ddu-comparison': {
    endpoint: '/api/v1/calculate',
    method: 'POST',
    fields: [
      { name: 'price', label: 'Product Price (USD)', type: 'number', placeholder: 'e.g. 200', required: true },
      { name: 'origin', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN', required: true },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'DE', required: true },
    ],
  },
  'vat-gst-registration-check': {
    endpoint: '/api/v1/vat/validate',
    method: 'POST',
    fields: [
      { name: 'vatNumber', label: 'VAT Number', type: 'text', placeholder: 'e.g. DE123456789', required: true },
    ],
  },
  'country-trade-data': {
    endpoint: '/api/v1/countries',
    method: 'GET',
    fields: [
      { name: 'code', label: 'Country Code', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
    ],
    submitLabel: 'Look Up',
  },
  'shipping-cost-estimation': {
    endpoint: '/api/v1/shipping/estimate',
    method: 'POST',
    fields: [
      { name: 'originCountry', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN', required: true },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
      { name: 'weightKg', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 2.5', required: true },
    ],
  },
  'ioss-vat-calculation': {
    endpoint: '/api/v1/ioss/check',
    method: 'POST',
    fields: [
      { name: 'price', label: 'Product Value (EUR)', type: 'number', placeholder: 'e.g. 89.99', required: true },
      { name: 'destinationCountry', label: 'EU Destination', type: 'select', options: [
        { value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' }, { value: 'IT', label: 'Italy' },
        { value: 'ES', label: 'Spain' }, { value: 'NL', label: 'Netherlands' }, { value: 'BE', label: 'Belgium' },
      ], defaultValue: 'DE', required: true },
    ],
  },
  'compliance-check': {
    endpoint: '/api/v1/compliance/check',
    method: 'POST',
    fields: [
      { name: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g. Electronic components', required: true },
      { name: 'originCountry', label: 'Origin Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'CN', required: true },
      { name: 'destinationCountry', label: 'Destination Country', type: 'select', options: COUNTRY_OPTIONS, defaultValue: 'US', required: true },
    ],
  },
};

export default function FeatureToolWidget({ slug }: { slug: string }) {
  const config = TOOL_CONFIGS[slug];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    config?.fields.forEach(f => { if (f.defaultValue) initial[f.name] = f.defaultValue; });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  if (!config) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let res: Response;
      if (config.method === 'GET') {
        const params = new URLSearchParams();
        config.fields.forEach(f => {
          const v = values[f.name];
          if (v) params.set(f.name, v);
        });
        res = await fetch(`${config.endpoint}?${params}`, {
          headers: { 'X-Demo-Request': 'true' },
        });
      } else {
        const body: Record<string, unknown> = {};
        config.fields.forEach(f => {
          const v = values[f.name];
          if (v) body[f.name] = f.type === 'number' ? parseFloat(v) : v;
        });
        res = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Demo-Request': 'true' },
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (!res.ok || json.success === false) {
        setError(json.error?.message || json.error || 'Request failed');
      } else {
        setResult(json.data ?? json);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '2px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  return (
    <section id="try-it" className="mb-10">
      <h2 className="text-lg font-bold text-[#02122c] mb-4">Try it live</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {config.fields.map(field => (
            <div key={field.name}>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                {field.label}{field.required && ' *'}
              </label>
              {field.type === 'select' ? (
                <select
                  value={values[field.name] || ''}
                  onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                  style={{ ...inputStyle, background: 'white', cursor: 'pointer' }}
                >
                  <option value="">Select...</option>
                  {field.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={values[field.name] || ''}
                  onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#F59E0B'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: loading ? '#94a3b8' : '#02122c', color: 'white',
            fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : (config.submitLabel || 'Try it')}
        </button>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 16 }}>
            <div className="text-xs font-bold text-slate-500 mb-2">Response</div>
            <pre style={{
              background: '#0a1628', color: '#86efac', borderRadius: 12, padding: 16,
              overflow: 'auto', maxHeight: 400, fontSize: 12, lineHeight: 1.6,
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3">
          Demo mode — 10 requests/min. <a href="/auth/signup" className="text-amber-600 font-semibold hover:underline">Sign up free</a> for unlimited access.
        </p>
      </div>
    </section>
  );
}
