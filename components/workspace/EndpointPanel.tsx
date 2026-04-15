'use client';

import { useState } from 'react';
import { ENDPOINTS } from './EndpointSidebar';
import { HsCodeCalculator } from '@/components/playground/HsCodeCalculator';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'country';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

// CW37-Gap4: Compute endpoints have NO duplicate fields — HsCodeCalculator provides
// productName, material, category, origin, destination, weight, price, composition, processing
// Parameters section shows only scenario-specific extra fields
const ENDPOINT_FIELDS: Record<string, FieldDef[]> = {
  classify: [
    // All fields from HsCodeCalculator — no extra params needed
  ],
  calculate: [
    { key: 'shippingPrice', label: 'Shipping Cost (USD)', type: 'number', placeholder: '15' },
    { key: 'shippingTerms', label: 'Incoterms', type: 'select', options: [
      { value: 'DDP', label: 'DDP (Delivered Duty Paid)' },
      { value: 'DDU', label: 'DDU (Delivered Duty Unpaid)' },
      { value: 'CIF', label: 'CIF' }, { value: 'FOB', label: 'FOB' }, { value: 'EXW', label: 'EXW' },
    ]},
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '1' },
  ],
  'apply-fta': [
    { key: 'fta_id', label: 'FTA Agreement (optional)', type: 'text', placeholder: 'USMCA (leave empty for auto-detect)' },
    { key: 'originating_content_pct', label: 'Originating Content %', type: 'number', placeholder: '70' },
    { key: 'product_value', label: 'Product Value (USD)', type: 'number', placeholder: '500' },
  ],
  'check-restrictions': [
    // destination from Calculator; no extra fields
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
  const [calcFields, setCalcFields] = useState<Record<string, string>>({});
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
      // CW37-Gap4: Merge HsCodeCalculator fields + scenario-specific params
      const params: Record<string, unknown> = {};
      // From Calculator (10 fields)
      if (endpoint.group === 'compute') {
        if (calcFields.productName) params.productName = calcFields.productName;
        if (calcFields.material) params.material = calcFields.material;
        if (calcFields.category) params.category = calcFields.category;
        if (calcFields.originCountry) params.origin = calcFields.originCountry;
        if (calcFields.destinationCountry) params.destinationCountry = calcFields.destinationCountry;
        if (calcFields.hsCode) params.hsCode = calcFields.hsCode;
        if (calcFields.weightSpec) params.weight_kg = Number(calcFields.weightSpec) || undefined;
        if (calcFields.price) params.price = Number(calcFields.price) || undefined;
        if (calcFields.processing) params.productForm = calcFields.processing;
        if (calcFields.composition) params.composition = calcFields.composition;
        if (calcFields.description) params.description = calcFields.description;
        // apply-fta uses hs_code not hsCode
        if (endpointId === 'apply-fta') {
          params.hs_code = params.hsCode || calcFields.hsCode || '';
          params.destination = params.destinationCountry;
        }
      }
      // From scenario-specific fields
      for (const f of fields) {
        const v = values[f.key];
        if (!v) continue;
        if (f.type === 'number') params[f.key] = Number(v);
        else if (f.key === 'countries') params[f.key] = v.split(',').map(s => s.trim()).filter(Boolean);
        else params[f.key] = v;
      }
      const allParams = { ...params };
      onParamsChange(allParams);
      const res = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: { 'X-Demo-Request': 'true', 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? JSON.stringify(allParams) : undefined,
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

      {/* CW37-Gap4: HsCodeCalculator 10-field embed for compute endpoints */}
      {endpoint.group === 'compute' && (
        <div className="p-4 border-b border-slate-200">
          <HsCodeCalculator
            embedded
            onResult={(hsCode) => {
              setCalcFields(prev => ({ ...prev, hsCode }));
            }}
            onFieldsChange={(f) => {
              setCalcFields(f as unknown as Record<string, string>);
            }}
          />
        </div>
      )}

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
