'use client';

import { useState } from 'react';
import { ENDPOINTS } from './EndpointSidebar';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'country';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

const ENDPOINT_FIELDS: Record<string, FieldDef[]> = {
  classify: [
    { key: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. cotton knitted t-shirt' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'e.g. cotton, leather, steel' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. apparel-knit' },
    { key: 'origin', label: 'Origin Country', type: 'text', placeholder: 'e.g. KR' },
    { key: 'destination_country', label: 'Destination Country', type: 'text', placeholder: 'e.g. US' },
  ],
  calculate: [
    { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g. cotton t-shirt' },
    { key: 'hsCode', label: 'HS Code', type: 'text', placeholder: 'e.g. 6109100010' },
    { key: 'price', label: 'Product Price (USD)', type: 'number', required: true, placeholder: '50' },
    { key: 'origin', label: 'Origin Country', type: 'text', required: true, placeholder: 'KR' },
    { key: 'destinationCountry', label: 'Destination Country', type: 'text', required: true, placeholder: 'US' },
    { key: 'weight_kg', label: 'Weight (kg)', type: 'number', placeholder: '0.2' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'cotton' },
  ],
  'apply-fta': [
    { key: 'hs_code', label: 'HS Code', type: 'text', required: true, placeholder: '610910' },
    { key: 'origin', label: 'Origin Country', type: 'text', required: true, placeholder: 'MX' },
    { key: 'destination', label: 'Destination Country', type: 'text', required: true, placeholder: 'US' },
    { key: 'fta_id', label: 'FTA Agreement (optional)', type: 'text', placeholder: 'USMCA (leave empty for auto-detect)' },
    { key: 'originating_content_pct', label: 'Originating Content %', type: 'number', placeholder: '70' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'cotton' },
  ],
  'check-restrictions': [
    { key: 'hsCode', label: 'HS Code', type: 'text', placeholder: '850760' },
    { key: 'productName', label: 'Product Name (if no HS)', type: 'text', placeholder: 'lithium battery' },
    { key: 'destinationCountry', label: 'Destination Country', type: 'text', required: true, placeholder: 'US' },
  ],
  compare: [
    { key: 'countries', label: 'Countries (comma-separated)', type: 'text', required: true, placeholder: 'US, DE, JP' },
  ],
  'generate-document': [
    { key: 'documentType', label: 'Document Type', type: 'select', required: true, options: [
      { value: 'commercial_invoice', label: 'Commercial Invoice' },
      { value: 'packing_list', label: 'Packing List' },
      { value: 'certificate_of_origin', label: 'Certificate of Origin' },
      { value: 'customs_declaration', label: 'Customs Declaration' },
    ]},
    { key: 'shipper_name', label: 'Shipper Name', type: 'text', required: true, placeholder: 'Acme Corp' },
    { key: 'consignee_name', label: 'Consignee Name', type: 'text', required: true, placeholder: 'Global Trade Ltd' },
    { key: 'origin', label: 'Origin', type: 'text', placeholder: 'KR' },
    { key: 'destination', label: 'Destination', type: 'text', placeholder: 'US' },
  ],
  'screen-parties': [
    { key: 'name', label: 'Party Name', type: 'text', required: true, placeholder: 'e.g. Huawei Technologies' },
    { key: 'country', label: 'Country', type: 'text', placeholder: 'CN' },
  ],
  'eccn-lookup': [
    { key: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. night vision goggles' },
    { key: 'category', label: 'Category', type: 'text', placeholder: 'e.g. optics, electronics' },
    { key: 'destination', label: 'Destination Country', type: 'text', placeholder: 'IR' },
  ],
};

interface Props {
  endpointId: string;
  onParamsChange: (params: Record<string, unknown>) => void;
}

export function EndpointPanel({ endpointId, onParamsChange }: Props) {
  const endpoint = ENDPOINTS.find(e => e.id === endpointId);
  const fields = ENDPOINT_FIELDS[endpointId] || [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!endpoint) return <div className="p-8 text-slate-400 text-center">Select an endpoint from the sidebar</div>;

  const updateField = (key: string, val: string) => {
    const next = { ...values, [key]: val };
    setValues(next);
    const params: Record<string, unknown> = {};
    for (const f of fields) {
      const v = next[f.key];
      if (!v) continue;
      if (f.type === 'number') params[f.key] = Number(v);
      else if (f.key === 'countries') params[f.key] = v.split(',').map(s => s.trim()).filter(Boolean);
      else params[f.key] = v;
    }
    onParamsChange(params);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params: Record<string, unknown> = {};
      for (const f of fields) {
        const v = values[f.key];
        if (!v) continue;
        if (f.type === 'number') params[f.key] = Number(v);
        else if (f.key === 'countries') params[f.key] = v.split(',').map(s => s.trim()).filter(Boolean);
        else params[f.key] = v;
      }
      const res = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: { 'X-Demo-Request': 'true', 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? JSON.stringify(params) : undefined,
      });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded bg-green-50 text-green-700">{endpoint.method}</span>
          <span className="font-mono text-sm text-slate-600">{endpoint.path}</span>
        </div>
        <h2 className="text-lg font-semibold mt-1">{endpoint.label}</h2>
      </div>

      {/* Parameters */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Parameters</h3>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              {f.type === 'select' ? (
                <select
                  value={values[f.key] || f.defaultValue || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">Select...</option>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={values[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm placeholder:text-slate-400"
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>

      {/* Result */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {result && (
        <div className="p-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Response</h3>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-[500px] font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
