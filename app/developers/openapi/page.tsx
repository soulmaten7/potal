'use client';

import React, { useState } from 'react';

const accent = '#E8640A';

interface Endpoint { method: 'GET' | 'POST'; path: string; description: string; params?: string; requestExample?: string; responseExample?: string }
interface Category { name: string; endpoints: Endpoint[] }

const CATEGORIES: Category[] = [
  { name: 'Classification', endpoints: [
    { method: 'POST', path: '/api/v1/classify', description: 'Classify a product into HS codes using 10-field input', params: 'productName, material, category, description, processing, composition, weight_spec, origin, destinationCountry', requestExample: '{"productName":"Cotton T-Shirt","material":"cotton","category":"apparel"}', responseExample: '{"hsCode":"610910","description":"T-shirts of cotton","confidence":0.92}' },
    { method: 'POST', path: '/api/v1/classify/eccn', description: 'Classify product under EAR Commerce Control List', params: 'productName, hsCode?, technicalSpecs?, destinationCountry?' },
    { method: 'POST', path: '/api/v1/classify/batch', description: 'Batch classify multiple products', params: 'items[]' },
    { method: 'POST', path: '/api/v1/classify/image', description: 'Classify product from uploaded image', params: 'image (multipart)' },
  ]},
  { name: 'Calculation', endpoints: [
    { method: 'POST', path: '/api/v1/calculate', description: 'Calculate total landed cost for a shipment', params: 'productName, material, price, origin, destinationCountry, category?, description?', requestExample: '{"productName":"Cotton T-Shirt","material":"cotton","price":29.99,"origin":"CN","destinationCountry":"US"}', responseExample: '{"importDuty":7.55,"vat":2.10,"totalLandedCost":42.09,"hsClassification":{...}}' },
    { method: 'POST', path: '/api/v1/calculate/compare', description: 'Compare costs across multiple destinations' },
    { method: 'POST', path: '/api/v1/calculate/ddp-vs-ddu', description: 'Compare DDP and DDU pricing' },
    { method: 'POST', path: '/api/v1/checkout', description: 'Generate checkout quote with all duties and taxes', params: 'originCountry, destinationCountry, items[]' },
  ]},
  { name: 'Compliance', endpoints: [
    { method: 'POST', path: '/api/v1/screening', description: 'Screen against sanctions and denied party lists', params: 'name, country?, lists?, minScore?', requestExample: '{"name":"John Smith","country":"IR"}', responseExample: '{"status":"clear","matches":[],"embargo":{"embargoed":false}}' },
    { method: 'POST', path: '/api/v1/restrictions', description: 'Check import restrictions for a product', params: 'destinationCountry, hsCode?, productName?' },
    { method: 'POST', path: '/api/v1/compliance/export-controls', description: 'Check dual-use and export control status' },
    { method: 'POST', path: '/api/v1/compliance/ics2', description: 'Validate ICS2 pre-arrival declaration data' },
  ]},
  { name: 'Shipping & Customs', endpoints: [
    { method: 'POST', path: '/api/v1/customs-docs/generate', description: 'Generate customs documents', params: 'doc_type, shipment' },
    { method: 'POST', path: '/api/v1/documents/pdf', description: 'Generate trade documents as PDF', params: 'type, exporter, importer, items[]' },
    { method: 'POST', path: '/api/v1/customs/type86', description: 'Check Type 86 informal entry eligibility' },
    { method: 'POST', path: '/api/v1/shipping/rates', description: 'Get shipping rate estimates' },
  ]},
  { name: 'Reference Data', endpoints: [
    { method: 'GET', path: '/api/v1/countries', description: 'List all 240 supported countries with trade data', params: 'region?, lang?' },
    { method: 'GET', path: '/api/v1/exchange-rate', description: 'Get current exchange rates' },
    { method: 'POST', path: '/api/v1/fta', description: 'Look up FTA between two countries', params: 'origin, destination, hsCode?' },
    { method: 'GET', path: '/api/v1/data-freshness', description: 'Check data source freshness timestamps' },
  ]},
];

const methodBg: Record<string, string> = { GET: 'bg-emerald-50 text-emerald-700', POST: 'bg-blue-50 text-blue-700' };

export default function OpenApiPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white py-16 px-5">
      <div className="max-w-7xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(232,100,10,0.1)', color: accent }}>DEVELOPER DOCS</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">API Reference</h1>
        <p className="text-slate-500 mb-10 text-[15px]">155+ API endpoints organized by category. All endpoints accept JSON and return JSON.</p>

        {CATEGORIES.map(cat => (
          <div key={cat.name} className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-3">{cat.name}</h2>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              {cat.endpoints.map((ep, i) => {
                const key = `${ep.method}${ep.path}`;
                const isOpen = expanded === key;
                return (
                  <div key={key}>
                    <button onClick={() => setExpanded(isOpen ? null : key)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${methodBg[ep.method]}`}>{ep.method}</span>
                      <span className="font-mono text-[13px] flex-1" style={{ color: accent }}>{ep.path}</span>
                      <span className="text-xs text-slate-400 max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap">{ep.description}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-slate-50" style={{ borderBottom: i < cat.endpoints.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div className="text-[13px] text-slate-600 mb-3">{ep.description}</div>
                        {ep.params && (
                          <div className="mb-3">
                            <span className="text-[11px] font-semibold text-slate-400">Parameters: </span>
                            <span className="text-xs font-mono text-slate-500">{ep.params}</span>
                          </div>
                        )}
                        {ep.requestExample && (
                          <div className="mb-2">
                            <div className="text-[11px] font-semibold text-slate-400 mb-1">Request</div>
                            <pre className="bg-[#0d1117] rounded-lg p-3 text-[11px] font-mono text-[#e6edf3] overflow-x-auto m-0">{ep.requestExample}</pre>
                          </div>
                        )}
                        {ep.responseExample && (
                          <div>
                            <div className="text-[11px] font-semibold text-slate-400 mb-1">Response</div>
                            <pre className="bg-[#0d1117] rounded-lg p-3 text-[11px] font-mono text-[#e6edf3] overflow-x-auto m-0">{ep.responseExample}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
