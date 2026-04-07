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

const methodColor: Record<string, string> = { GET: '#4ade80', POST: '#60a5fa' };

export default function OpenApiPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER DOCS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>API Reference</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>155+ API endpoints organized by category. All endpoints accept JSON and return JSON.</p>

        {CATEGORIES.map(cat => (
          <div key={cat.name} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'rgba(255,255,255,0.8)' }}>{cat.name}</h2>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              {cat.endpoints.map((ep, i) => {
                const key = `${ep.method}${ep.path}`;
                const isOpen = expanded === key;
                return (
                  <div key={key}>
                    <button onClick={() => setExpanded(isOpen ? null : key)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', color: 'white', textAlign: 'left',
                    }}>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace', background: `${methodColor[ep.method]}20`, color: methodColor[ep.method], flexShrink: 0 }}>{ep.method}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: accent, flex: 1 }}>{ep.path}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.description}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '12px 16px 16px', borderBottom: i < cat.endpoints.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{ep.description}</div>
                        {ep.params && (
                          <div style={{ marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Parameters: </span>
                            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)' }}>{ep.params}</span>
                          </div>
                        )}
                        {ep.requestExample && (
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Request</div>
                            <pre style={{ background: '#0d1117', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto', margin: 0 }}>{ep.requestExample}</pre>
                          </div>
                        )}
                        {ep.responseExample && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Response</div>
                            <pre style={{ background: '#0d1117', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto', margin: 0 }}>{ep.responseExample}</pre>
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
