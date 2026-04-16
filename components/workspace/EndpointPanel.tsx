'use client';

import { useState } from 'react';
import { ENDPOINTS } from './EndpointSidebar';
import { HsCodeCalculator } from '@/components/playground/HsCodeCalculator';
import { COUNTRY_OPTIONS } from '@/lib/playground/dropdown-options';
import { EXAMPLE_RESPONSES, type ExampleResponse } from '@/lib/workspace/example-responses';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

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
    // product_value removed — Calculator's price+currency provides this
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
    // origin, destination removed — Calculator's originCountry + destinationCountry provides these
  ],
  'screen-parties': [
    { key: 'name', label: 'Party Name', type: 'text', required: true, placeholder: 'e.g. Huawei Technologies' },
    { key: 'country', label: 'Country', type: 'country' },
    { key: 'threshold', label: 'Match Threshold', type: 'number', placeholder: '0.8 (default)' },
  ],
  'eccn-lookup': [
    { key: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'e.g. night vision goggles' },
    { key: 'category', label: 'ECCN Category', type: 'select', options: [
      { value: '0', label: '0 — Nuclear & Miscellaneous' },
      { value: '1', label: '1 — Materials, Chemicals' },
      { value: '2', label: '2 — Materials Processing' },
      { value: '3', label: '3 — Electronics' },
      { value: '4', label: '4 — Computers' },
      { value: '5', label: '5 — Telecommunications & Security' },
      { value: '6', label: '6 — Sensors & Lasers' },
      { value: '7', label: '7 — Navigation & Avionics' },
      { value: '8', label: '8 — Marine' },
      { value: '9', label: '9 — Aerospace & Propulsion' },
    ]},
    { key: 'destination', label: 'Destination Country', type: 'country' },
  ],
};

interface Props {
  endpointId: string;
  onParamsChange: (params: Record<string, unknown>) => void;
  onResult?: (result: Record<string, unknown> | null) => void;
}

export function EndpointPanel({ endpointId, onParamsChange, onResult }: Props) {
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
        if (calcFields.weightSpec) {
          params.weight_kg = Number(calcFields.weightSpec) || undefined;
          if (calcFields.weightUnit) params.weight_unit = calcFields.weightUnit;
        }
        if (calcFields.price) {
          params.price = Number(calcFields.price) || undefined;
          if (calcFields.currency) params.currency = calcFields.currency;
        }
        if (calcFields.processing) params.productForm = calcFields.processing;
        if (calcFields.composition) params.composition = calcFields.composition;
        if (calcFields.description) params.description = calcFields.description;
        // apply-fta uses hs_code not hsCode
        if (endpointId === 'apply-fta') {
          params.hs_code = params.hsCode || calcFields.hsCode || '';
          params.destination = params.destinationCountry;
          // product_value from Calculator's price
          if (calcFields.price) params.product_value = Number(calcFields.price) || undefined;
        }
        // generate-document maps Calculator countries to origin/destination keys
        if (endpointId === 'generate-document') {
          if (calcFields.originCountry) params.origin = calcFields.originCountry;
          if (calcFields.destinationCountry) params.destination = calcFields.destinationCountry;
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

      // CW38-HF7: generate-document requires nested { doc_type, shipment } structure
      let bodyPayload = allParams;
      if (endpointId === 'generate-document') {
        bodyPayload = {
          doc_type: allParams.documentType || 'commercial_invoice',
          shipment: {
            shipper: { name: allParams.shipper_name || 'Exporter Co', country: allParams.origin || '' },
            consignee: { name: allParams.consignee_name || 'Importer Inc', country: allParams.destinationCountry || allParams.destination || '' },
            destination: allParams.destinationCountry || allParams.destination || '',
            items: [{
              hs_code: allParams.hsCode || '',
              description: allParams.productName || '',
              value: Number(allParams.price) || 50,
              quantity: 1,
              weight: Number(allParams.weight_kg) || 0.5,
              origin: allParams.origin || '',
            }],
            incoterms: 'DDP',
            currency: allParams.currency || 'USD',
          },
        };
      }

      const res = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: { 'X-Demo-Request': 'true', 'Content-Type': 'application/json' },
        body: endpoint.method === 'POST' ? JSON.stringify(bodyPayload) : undefined,
      });
      const json = await res.json();
      setResult(json);
      if (onResult) onResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const [centerTab, setCenterTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');

  // Build merged body for Body tab preview
  const bodyPreview = (() => {
    const merged: Record<string, unknown> = {};
    if (endpoint.group === 'compute') {
      if (calcFields.productName) merged.productName = calcFields.productName;
      if (calcFields.material) merged.material = calcFields.material;
      if (calcFields.originCountry) merged.origin = calcFields.originCountry;
      if (calcFields.destinationCountry) merged.destinationCountry = calcFields.destinationCountry;
      if (calcFields.hsCode) merged.hsCode = calcFields.hsCode;
      if (calcFields.weightSpec) {
        merged.weight_kg = Number(calcFields.weightSpec) || undefined;
        if (calcFields.weightUnit) merged.weight_unit = calcFields.weightUnit;
      }
      if (calcFields.price) {
        merged.price = Number(calcFields.price) || undefined;
        if (calcFields.currency) merged.currency = calcFields.currency;
      }
    }
    for (const f of fields) { const v = values[f.key]; if (v) merged[f.key] = f.type === 'number' ? Number(v) : v; }
    // CW38-HF7: Show nested structure for generate-document
    if (endpointId === 'generate-document') {
      return {
        doc_type: merged.documentType || 'commercial_invoice',
        shipment: {
          shipper: { name: merged.shipper_name || '' },
          consignee: { name: merged.consignee_name || '' },
          destination: merged.destinationCountry || '',
          items: [{ hs_code: merged.hsCode || '', description: merged.productName || '', value: merged.price || 0, quantity: 1, weight: merged.weight_kg || 0, origin: merged.origin || '' }],
          currency: merged.currency || 'USD',
        },
      };
    }
    return merged;
  })();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header: Breadcrumb + method + path */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Workspace', href: '/workspace/export' },
          { label: endpoint.group === 'compute' ? 'Compute' : endpoint.group === 'screening' ? 'Screening' : 'Guides' },
          { label: endpoint.label },
        ]} />
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-1 rounded bg-green-50 text-green-700">{endpoint.method}</span>
          <span className="font-mono text-sm text-slate-600">{endpoint.path}</span>
        </div>
        <h2 className="text-lg font-semibold mt-1">{endpoint.label}</h2>
      </div>

      {/* CW38: 5-tab bar (RapidAPI pattern) */}
      <div className="flex border-b border-slate-200 bg-white px-4 flex-shrink-0">
        {(['params', 'headers', 'body', 'auth'] as const).map(tab => (
          <button key={tab} onClick={() => setCenterTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors ${
              centerTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}>
            {tab === 'params' ? `Params` : tab === 'headers' ? 'Headers (3)' : tab === 'body' ? 'Body' : 'Auth'}
          </button>
        ))}
      </div>

      {/* ═══ Params tab ═══ */}
      {centerTab === 'params' && (
      <div className="p-4 border-b border-slate-200">

        {/* CW37-Gap6: Product Details (10 fields) inline for Compute endpoints */}
        {endpoint.group === 'compute' && (
          <div className="mb-4">
            <HsCodeCalculator
              embedded
              hideClassifyButton={true}
              onResult={(hsCode) => { setCalcFields(prev => ({ ...prev, hsCode })); }}
              onFieldsChange={(f) => { setCalcFields(f as unknown as Record<string, string>); }}
            />
          </div>
        )}
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
              ) : f.type === 'country' ? (
                <select
                  value={values[f.key] || ''}
                  onChange={e => updateField(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                >
                  <option value="">Select country...</option>
                  <optgroup label="Popular">
                    {COUNTRY_OPTIONS.filter(c => c.group === 'popular').map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="All Countries">
                    {COUNTRY_OPTIONS.filter(c => !c.group).map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
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
      )}

      {/* ═══ Headers tab ═══ */}
      {centerTab === 'headers' && (
        <div className="p-4 border-b border-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-400"><th className="pb-2">Header</th><th className="pb-2">Value</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-100"><td className="py-2 font-mono text-slate-600">X-API-Key</td><td className="py-2"><input type="text" defaultValue="YOUR_API_KEY" className="w-full px-2 py-1 border border-slate-200 rounded text-sm font-mono" /></td></tr>
              <tr className="border-t border-slate-100"><td className="py-2 font-mono text-slate-600">Content-Type</td><td className="py-2 text-slate-400 font-mono">application/json</td></tr>
              <tr className="border-t border-slate-100"><td className="py-2 font-mono text-slate-600">Accept</td><td className="py-2 text-slate-400 font-mono">application/json</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Body tab ═══ */}
      {centerTab === 'body' && (
        <div className="p-4 border-b border-slate-200">
          <p className="text-xs text-slate-400 mb-2">Auto-generated from Parameters. Read-only.</p>
          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-mono text-slate-700 overflow-auto max-h-[400px]">
            {JSON.stringify(bodyPreview, null, 2)}
          </pre>
        </div>
      )}

      {/* ═══ Auth tab ═══ */}
      {centerTab === 'auth' && (
        <div className="p-4 border-b border-slate-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">API Key Authentication</h4>
            <p className="text-sm text-blue-700 mb-3">POTAL uses API Key authentication. Include your key in the <code className="bg-blue-100 px-1 rounded">X-API-Key</code> header.</p>
            <p className="text-sm text-blue-600">No API key yet? <a href="/dashboard/api-keys" className="underline font-semibold">Get your free API key</a></p>
            <p className="text-xs text-blue-400 mt-2">Demo mode: Add <code className="bg-blue-100 px-1 rounded">X-Demo-Request: true</code> header (10 req/min, no key needed)</p>
          </div>
        </div>
      )}

      {/* ═══ Response Area ═══ */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {result ? (
        /* Live result from API call */
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Response</h3>
            <CopyJsonButton json={result} />
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-[500px] font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
          {/* Collapsed examples for reference after run */}
          <ExampleResponsesCollapsed endpointId={endpointId} />
        </div>
      ) : (
        /* Before run: show examples in Response area */
        <ExampleResponsesPanel endpointId={endpointId} />
      )}
    </div>
  );
}

/* ─── Copy JSON Button ─── */
function CopyJsonButton({ json }: { json: unknown }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-[11px] px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors font-medium">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

/* ─── Example Responses Panel (shown before Run) ─── */
function ExampleResponsesPanel({ endpointId }: { endpointId: string }) {
  const examples = EXAMPLE_RESPONSES[endpointId];
  const [selected, setSelected] = useState(0);
  if (!examples || examples.length === 0) return null;

  const successExamples = examples.filter((e: ExampleResponse) => e.status === 200);
  const errorExamples = examples.filter((e: ExampleResponse) => e.status === 400);
  const ex = examples[selected];

  return (
    <div className="border-t border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Example Responses</h3>
        <CopyJsonButton json={ex.value} />
      </div>

      {/* Status code groups */}
      <div className="flex flex-wrap gap-4 mb-3">
        {successExamples.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-green-100 text-green-700">200</span>
            <div className="flex gap-1">
              {successExamples.map((e: ExampleResponse) => {
                const idx = examples.indexOf(e);
                return (
                  <button key={e.name} onClick={() => setSelected(idx)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      selected === idx ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}>
                    {e.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {errorExamples.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-700">400</span>
            <div className="flex gap-1">
              {errorExamples.map((e: ExampleResponse) => {
                const idx = examples.indexOf(e);
                return (
                  <button key={e.name} onClick={() => setSelected(idx)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      selected === idx ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}>
                    {e.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected example */}
      <p className="text-[12px] text-slate-500 mb-2">{ex.summary}</p>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-[12px] overflow-auto max-h-[500px] font-mono">
        {JSON.stringify(ex.value, null, 2)}
      </pre>
    </div>
  );
}

/* ─── Collapsed Examples (shown after Run for reference) ─── */
function ExampleResponsesCollapsed({ endpointId }: { endpointId: string }) {
  const examples = EXAMPLE_RESPONSES[endpointId];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  if (!examples || examples.length === 0) return null;

  const ex = examples[selected];

  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)} className="mt-4">
      <summary className="text-[12px] text-slate-400 cursor-pointer hover:text-slate-600 select-none">
        Example Responses ({examples.length})
      </summary>
      <div className="mt-2">
        <div className="flex gap-1 flex-wrap mb-2">
          {examples.map((e: ExampleResponse, i: number) => (
            <button key={e.name} onClick={() => setSelected(i)}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                selected === i
                  ? (e.status === 200 ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                  : (e.status === 200 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100')
              }`}>
              {e.status} {e.name}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] text-slate-400">{ex.summary}</p>
          <CopyJsonButton json={ex.value} />
        </div>
        <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] font-mono text-slate-600 overflow-auto max-h-[300px]">
          {JSON.stringify(ex.value, null, 2)}
        </pre>
      </div>
    </details>
  );
}
