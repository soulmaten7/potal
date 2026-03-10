"use client";

import React, { useState, useCallback } from 'react';

const API_BASE = 'https://www.potal.app';

// ─── Types ──────────────────────────────────────────
interface EndpointConfig {
  id: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tag: string;
  auth: boolean;
  fields?: FieldConfig[];
  queryParams?: FieldConfig[];
  defaultBody?: Record<string, unknown>;
  exampleResponse: string;
  curlExample: string;
}

interface FieldConfig {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  example?: string;
  options?: string[];
}

// ─── Endpoint Definitions ───────────────────────────
const ENDPOINTS: EndpointConfig[] = [
  {
    id: 'calculate-single',
    method: 'POST',
    path: '/api/v1/calculate',
    summary: 'Calculate Total Landed Cost (Single)',
    description: 'Calculate the total landed cost for a single item including import duties, taxes, customs fees, and the final price the buyer will pay. Supports 240 countries with real-time exchange rates.',
    tag: 'Calculation',
    auth: true,
    fields: [
      { name: 'price', type: 'number', required: true, description: 'Product price in USD', example: '49.99' },
      { name: 'shippingPrice', type: 'number', required: false, description: 'Shipping cost in USD', default: '0', example: '8.50' },
      { name: 'origin', type: 'string', required: false, description: 'Origin country ISO code (e.g., CN, US, DE)', example: 'CN' },
      { name: 'destinationCountry', type: 'string', required: false, description: 'Destination country ISO code', default: 'US', example: 'GB' },
      { name: 'zipcode', type: 'string', required: false, description: 'US ZIP code for state sales tax calculation', example: '10001' },
      { name: 'productName', type: 'string', required: false, description: 'Product name for AI-powered HS Code classification', example: 'Cotton T-Shirt' },
      { name: 'productCategory', type: 'string', required: false, description: 'Product category for classification (electronics, apparel, footwear, etc.)', example: 'apparel' },
      { name: 'hsCode', type: 'string', required: false, description: 'HS Code for precise duty calculation (6-10 digits)', example: '6109.10' },
    ],
    defaultBody: {
      price: 49.99,
      shippingPrice: 8.50,
      origin: 'CN',
      destinationCountry: 'GB',
      productName: 'Cotton T-Shirt',
      productCategory: 'apparel',
    },
    exampleResponse: `{
  "success": true,
  "data": {
    "productPrice": 49.99,
    "shippingCost": 8.50,
    "importDuty": 7.02,
    "vat": 13.10,
    "customsFees": 0,
    "totalLandedCost": 78.61,
    "currency": "USD",
    "destinationCountry": "GB",
    "originCountry": "CN",
    "isDutyFree": false,
    "breakdown": [
      { "label": "Product Price", "amount": 49.99 },
      { "label": "Shipping", "amount": 8.50 },
      { "label": "Import Duty (12.0%)", "amount": 7.02 },
      { "label": "VAT (20.0%)", "amount": 13.10 }
    ]
  },
  "meta": {
    "timestamp": "2026-03-06T12:00:00.000Z",
    "plan": "free"
  }
}`,
    curlExample: `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "price": 49.99,
    "shippingPrice": 8.50,
    "origin": "CN",
    "destinationCountry": "GB",
    "productName": "Cotton T-Shirt"
  }'`,
  },
  {
    id: 'calculate-batch',
    method: 'POST',
    path: '/api/v1/calculate/batch',
    summary: 'Calculate Total Landed Cost (Batch)',
    description: 'Calculate TLC for multiple items in a single request. Max 100 items per request. Ideal for cart calculations or catalog pricing.',
    tag: 'Calculation',
    auth: true,
    defaultBody: {
      items: [
        { id: 'item-1', price: 49.99, shippingPrice: 8.50, origin: 'CN', destinationCountry: 'GB' },
        { id: 'item-2', price: 29.99, shippingPrice: 5.00, origin: 'US', destinationCountry: 'DE' },
      ],
      defaults: { origin: 'CN' },
    },
    exampleResponse: `{
  "success": true,
  "data": {
    "results": [
      {
        "id": "item-1",
        "result": {
          "totalLandedCost": 78.61,
          "importDuty": 7.02,
          "vat": 13.10,
          "productPrice": 49.99,
          "shippingCost": 8.50
        }
      },
      {
        "id": "item-2",
        "result": {
          "totalLandedCost": 41.64,
          "importDuty": 3.60,
          "vat": 6.65,
          "productPrice": 29.99,
          "shippingCost": 5.00
        }
      }
    ],
    "summary": {
      "total": 2,
      "success": 2,
      "failed": 0
    }
  }
}`,
    curlExample: `curl -X POST https://www.potal.app/api/v1/calculate/batch \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "items": [
      { "id": "item-1", "price": 49.99, "origin": "CN", "destinationCountry": "GB" },
      { "id": "item-2", "price": 29.99, "origin": "US", "destinationCountry": "DE" }
    ]
  }'`,
  },
  {
    id: 'countries',
    method: 'GET',
    path: '/api/v1/countries',
    summary: 'List Supported Countries',
    description: 'Get a list of all supported destination countries with VAT/GST rates, average duty rates, de minimis thresholds, and currency info. Public endpoint — no authentication required.',
    tag: 'Reference',
    auth: false,
    queryParams: [
      { name: 'region', type: 'string', required: false, description: 'Filter by region (e.g., Europe, Asia, Americas)', example: 'Europe', options: ['Europe', 'Asia', 'Americas', 'Oceania', 'Middle East', 'Africa'] },
    ],
    exampleResponse: `{
  "success": true,
  "data": {
    "countries": [
      {
        "code": "US",
        "name": "United States",
        "region": "Americas",
        "vatRate": 0,
        "vatLabel": "Sales Tax",
        "avgDutyRate": 0.037,
        "deMinimisUsd": 800,
        "currency": "USD"
      },
      {
        "code": "GB",
        "name": "United Kingdom",
        "region": "Europe",
        "vatRate": 0.20,
        "vatLabel": "VAT",
        "avgDutyRate": 0.042,
        "deMinimisUsd": 135,
        "currency": "GBP"
      }
    ],
    "total": 240,
    "totalSupported": 240
  }
}`,
    curlExample: `curl https://www.potal.app/api/v1/countries

# Filter by region
curl https://www.potal.app/api/v1/countries?region=Europe`,
  },
  {
    id: 'sellers-usage',
    method: 'GET',
    path: '/api/v1/sellers/usage',
    summary: 'Get Usage Statistics',
    description: 'Get monthly API usage statistics for the authenticated seller, including request counts and remaining quota.',
    tag: 'Account',
    auth: true,
    queryParams: [
      { name: 'month', type: 'string', required: false, description: 'Month in YYYY-MM format', default: 'current month', example: '2026-03' },
    ],
    exampleResponse: `{
  "success": true,
  "data": {
    "month": "2026-03",
    "totalRequests": 1247,
    "planLimit": 100,
    "remaining": 53,
    "plan": "free"
  }
}`,
    curlExample: `curl https://www.potal.app/api/v1/sellers/usage \\
  -H "X-API-Key: sk_live_YOUR_SECRET_KEY"

# Specific month
curl "https://www.potal.app/api/v1/sellers/usage?month=2026-03" \\
  -H "X-API-Key: sk_live_YOUR_SECRET_KEY"`,
  },
  {
    id: 'sellers-keys',
    method: 'GET',
    path: '/api/v1/sellers/keys',
    summary: 'List API Keys',
    description: 'List all API keys for the authenticated seller. Requires a secret key (sk_live_).',
    tag: 'Key Management',
    auth: true,
    exampleResponse: `{
  "success": true,
  "data": {
    "keys": [
      {
        "id": "uuid-1234",
        "prefix": "pk_live_abc1",
        "type": "publishable",
        "name": "Production Widget",
        "isActive": true,
        "rateLimitPerMinute": 60,
        "createdAt": "2026-03-01T00:00:00Z",
        "lastUsedAt": "2026-03-06T12:00:00Z"
      }
    ],
    "total": 1
  }
}`,
    curlExample: `curl https://www.potal.app/api/v1/sellers/keys \\
  -H "X-API-Key: sk_live_YOUR_SECRET_KEY"`,
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/v1/health',
    summary: 'Health Check',
    description: 'Check API service health and uptime. Public endpoint.',
    tag: 'System',
    auth: false,
    exampleResponse: `{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-03-06T12:00:00.000Z"
}`,
    curlExample: `curl https://www.potal.app/api/v1/health`,
  },
];

const TAGS = ['Calculation', 'Reference', 'Account', 'Key Management', 'System'];

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: '#10b981', text: '#ffffff' },
  POST: { bg: '#3b82f6', text: '#ffffff' },
  DELETE: { bg: '#ef4444', text: '#ffffff' },
};

// ─── Component ──────────────────────────────────────
export default function DocsPage() {
  const [apiKey, setApiKey] = useState('');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>('calculate-single');
  const [activeCodeTab, setActiveCodeTab] = useState<Record<string, string>>({});
  const [requestBodies, setRequestBodies] = useState<Record<string, string>>({});
  const [queryParamValues, setQueryParamValues] = useState<Record<string, Record<string, string>>>({});
  const [responses, setResponses] = useState<Record<string, { status: number; body: string; time: number } | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const getCodeTab = (endpointId: string) => activeCodeTab[endpointId] || 'curl';
  const setCodeTab = (endpointId: string, tab: string) => {
    setActiveCodeTab(prev => ({ ...prev, [endpointId]: tab }));
  };

  const getRequestBody = (endpoint: EndpointConfig) => {
    if (requestBodies[endpoint.id]) return requestBodies[endpoint.id];
    if (endpoint.defaultBody) return JSON.stringify(endpoint.defaultBody, null, 2);
    return '';
  };

  const setRequestBody = (endpointId: string, body: string) => {
    setRequestBodies(prev => ({ ...prev, [endpointId]: body }));
  };

  const handleTryIt = useCallback(async (endpoint: EndpointConfig) => {
    setLoading(prev => ({ ...prev, [endpoint.id]: true }));
    setResponses(prev => ({ ...prev, [endpoint.id]: null }));

    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (endpoint.auth && apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      let url = `${API_BASE}${endpoint.path}`;

      // Add query params for GET
      if (endpoint.method === 'GET' && endpoint.queryParams) {
        const params = queryParamValues[endpoint.id] || {};
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value) searchParams.set(key, value);
        }
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
      }

      const fetchOptions: RequestInit = {
        method: endpoint.method,
        headers,
      };

      if (endpoint.method === 'POST') {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = getRequestBody(endpoint);
      }

      fetchOptions.headers = headers;

      const response = await fetch(url, fetchOptions);
      const elapsed = Date.now() - startTime;
      const text = await response.text();

      let formatted: string;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        formatted = text;
      }

      setResponses(prev => ({
        ...prev,
        [endpoint.id]: { status: response.status, body: formatted, time: elapsed },
      }));
    } catch (err) {
      const elapsed = Date.now() - startTime;
      setResponses(prev => ({
        ...prev,
        [endpoint.id]: {
          status: 0,
          body: `Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          time: elapsed,
        },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpoint.id]: false }));
    }
  }, [apiKey, queryParamValues, requestBodies]);

  const getJsExample = (endpoint: EndpointConfig) => {
    if (endpoint.method === 'GET') {
      const hasParams = endpoint.queryParams && endpoint.queryParams.length > 0;
      return `const response = await fetch("${API_BASE}${endpoint.path}${hasParams ? '?region=Europe' : ''}"${endpoint.auth ? `, {
  headers: { "X-API-Key": "YOUR_API_KEY" }
}` : ''});
const data = await response.json();
console.log(data);`;
    }
    return `const response = await fetch("${API_BASE}${endpoint.path}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
  },
  body: JSON.stringify(${endpoint.defaultBody ? JSON.stringify(endpoint.defaultBody, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n') : '{}'})
});

const data = await response.json();
console.log(data);`;
  };

  const getPythonExample = (endpoint: EndpointConfig) => {
    if (endpoint.method === 'GET') {
      return `import requests

response = requests.get(
    "${API_BASE}${endpoint.path}",
    ${endpoint.auth ? `headers={"X-API-Key": "YOUR_API_KEY"},\n    ` : ''}params={"region": "Europe"}
)
data = response.json()
print(data)`;
    }
    return `import requests

response = requests.post(
    "${API_BASE}${endpoint.path}",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "YOUR_API_KEY"
    },
    json=${endpoint.defaultBody ? JSON.stringify(endpoint.defaultBody, null, 4).replace(/"/g, '"').split('\n').map((l, i) => i === 0 ? l : '    ' + l).join('\n') : '{}'}
)
data = response.json()
print(data)`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const statusColor = (status: number) => {
    if (status === 0) return '#ef4444';
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 400 && status < 500) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* ─── Hero ─────────────────────────────── */}
      <section style={{
        backgroundColor: '#02122c',
        color: 'white',
        padding: '60px 24px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '100px',
              fontSize: '12px',
              fontWeight: '600',
            }}>v1.0</span>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>REST API</span>
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            API Reference
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '600px', lineHeight: '1.6' }}>
            Interactive documentation for the POTAL Total Landed Cost API.
            Test endpoints directly from this page.
          </p>

          {/* Auth Input */}
          <div style={{
            marginTop: '24px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '600px',
          }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: '600' }}>API Key:</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key to test endpoints..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <span style={{
              fontSize: '11px',
              color: apiKey ? '#10b981' : '#6b7280',
              fontWeight: '600',
            }}>
              {apiKey ? 'Key set' : 'No key'}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Quick Info Cards ─────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '-20px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
        }}>
          {[
            { label: 'BASE URL', value: 'www.potal.app/api/v1' },
            { label: 'AUTH', value: 'X-API-Key header' },
            { label: 'FORMAT', value: 'JSON' },
            { label: 'RATE LIMIT', value: '60-120 req/min' },
          ].map(card => (
            <div key={card.label} style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px' }}>{card.label}</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#0f172a', fontWeight: '600' }}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Main Content ─────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}>
          {TAGS.map(tag => {
            const count = ENDPOINTS.filter(e => e.tag === tag).length;
            return (
              <a
                key={tag}
                href={`#tag-${tag.toLowerCase().replace(/\s/g, '-')}`}
                style={{
                  padding: '6px 14px',
                  borderRadius: '100px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {tag} <span style={{ color: '#94a3b8', marginLeft: '4px' }}>({count})</span>
              </a>
            );
          })}
        </nav>

        {/* Endpoints by Tag */}
        {TAGS.map(tag => {
          const tagEndpoints = ENDPOINTS.filter(e => e.tag === tag);
          if (tagEndpoints.length === 0) return null;

          return (
            <div key={tag} id={`tag-${tag.toLowerCase().replace(/\s/g, '-')}`} style={{ marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e2e8f0',
              }}>
                {tag}
              </h2>

              {tagEndpoints.map(endpoint => {
                const isExpanded = expandedEndpoint === endpoint.id;
                const methodColor = METHOD_COLORS[endpoint.method];
                const response = responses[endpoint.id];
                const isLoading = loading[endpoint.id];
                const codeTab = getCodeTab(endpoint.id);

                return (
                  <div
                    key={endpoint.id}
                    style={{
                      backgroundColor: 'white',
                      border: isExpanded ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      overflow: 'hidden',
                      boxShadow: isExpanded ? '0 4px 12px rgba(59,130,246,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Endpoint Header */}
                    <button
                      onClick={() => setExpandedEndpoint(isExpanded ? null : endpoint.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 20px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{
                        backgroundColor: methodColor.bg,
                        color: methodColor.text,
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        minWidth: '52px',
                        textAlign: 'center',
                        fontFamily: 'monospace',
                      }}>
                        {endpoint.method}
                      </span>
                      <code style={{
                        fontSize: '14px',
                        color: '#0f172a',
                        fontWeight: '600',
                        fontFamily: 'monospace',
                      }}>
                        {endpoint.path}
                      </code>
                      <span style={{ flex: 1, fontSize: '13px', color: '#64748b' }}>
                        {endpoint.summary}
                      </span>
                      {!endpoint.auth && (
                        <span style={{
                          fontSize: '10px',
                          color: '#10b981',
                          backgroundColor: '#f0fdf4',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          fontWeight: '600',
                        }}>
                          PUBLIC
                        </span>
                      )}
                      <span style={{
                        fontSize: '16px',
                        color: '#94a3b8',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}>
                        ▼
                      </span>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ padding: '20px' }}>
                          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                            {endpoint.description}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Left: Request */}
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Request
                              </h4>

                              {/* Auth badge */}
                              {endpoint.auth && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: '12px',
                                  padding: '8px 12px',
                                  backgroundColor: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: '#92400e',
                                }}>
                                  <span style={{ fontWeight: '600' }}>Auth Required:</span> X-API-Key header
                                </div>
                              )}

                              {/* Query Params */}
                              {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Query Parameters</div>
                                  {endpoint.queryParams.map(param => (
                                    <div key={param.name} style={{ marginBottom: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <code style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{param.name}</code>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{param.type}</span>
                                        {param.required && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '600' }}>required</span>}
                                      </div>
                                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px 0' }}>{param.description}</p>
                                      {param.options ? (
                                        <select
                                          value={(queryParamValues[endpoint.id] || {})[param.name] || ''}
                                          onChange={(e) => setQueryParamValues(prev => ({
                                            ...prev,
                                            [endpoint.id]: { ...(prev[endpoint.id] || {}), [param.name]: e.target.value },
                                          }))}
                                          style={{
                                            width: '100%',
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            backgroundColor: 'white',
                                          }}
                                        >
                                          <option value="">All (no filter)</option>
                                          {param.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          placeholder={param.example || ''}
                                          value={(queryParamValues[endpoint.id] || {})[param.name] || ''}
                                          onChange={(e) => setQueryParamValues(prev => ({
                                            ...prev,
                                            [endpoint.id]: { ...(prev[endpoint.id] || {}), [param.name]: e.target.value },
                                          }))}
                                          style={{
                                            width: '100%',
                                            padding: '6px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            boxSizing: 'border-box',
                                          }}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Fields Table */}
                              {endpoint.fields && (
                                <div style={{ marginBottom: '16px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Body Parameters</div>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: '600', color: '#475569' }}>Field</th>
                                        <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: '600', color: '#475569' }}>Type</th>
                                        <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: '600', color: '#475569' }}>Req</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {endpoint.fields.map(field => (
                                        <tr key={field.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                          <td style={{ padding: '6px 0' }}>
                                            <code style={{ color: '#0f172a', fontWeight: '500' }}>{field.name}</code>
                                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{field.description}</div>
                                          </td>
                                          <td style={{ padding: '6px 0', color: '#64748b' }}>{field.type}</td>
                                          <td style={{ padding: '6px 0', textAlign: 'center', color: field.required ? '#ef4444' : '#94a3b8' }}>
                                            {field.required ? 'Yes' : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Editable Body */}
                              {endpoint.method === 'POST' && (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Request Body</div>
                                    <button
                                      onClick={() => {
                                        if (endpoint.defaultBody) {
                                          setRequestBody(endpoint.id, JSON.stringify(endpoint.defaultBody, null, 2));
                                        }
                                      }}
                                      style={{
                                        fontSize: '10px',
                                        color: '#3b82f6',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                      }}
                                    >
                                      Reset to default
                                    </button>
                                  </div>
                                  <textarea
                                    value={getRequestBody(endpoint)}
                                    onChange={(e) => setRequestBody(endpoint.id, e.target.value)}
                                    rows={10}
                                    style={{
                                      width: '100%',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      border: '1px solid #e2e8f0',
                                      backgroundColor: '#f8fafc',
                                      fontFamily: 'monospace',
                                      fontSize: '12px',
                                      color: '#0f172a',
                                      lineHeight: '1.5',
                                      resize: 'vertical',
                                      boxSizing: 'border-box',
                                    }}
                                    spellCheck={false}
                                  />
                                </div>
                              )}

                              {/* Try It Button */}
                              <button
                                onClick={() => handleTryIt(endpoint)}
                                disabled={isLoading || (endpoint.auth && !apiKey)}
                                style={{
                                  marginTop: '12px',
                                  width: '100%',
                                  padding: '10px',
                                  backgroundColor: isLoading ? '#94a3b8' : (endpoint.auth && !apiKey) ? '#e2e8f0' : '#3b82f6',
                                  color: (endpoint.auth && !apiKey) ? '#94a3b8' : 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  cursor: isLoading || (endpoint.auth && !apiKey) ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {isLoading ? 'Sending...' : (endpoint.auth && !apiKey) ? 'Enter API key above to test' : `Send ${endpoint.method} Request`}
                              </button>

                              {/* Live Response */}
                              {response && (
                                <div style={{ marginTop: '12px' }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '8px',
                                  }}>
                                    <span style={{
                                      fontWeight: '700',
                                      fontSize: '12px',
                                      color: statusColor(response.status),
                                    }}>
                                      {response.status === 0 ? 'ERROR' : response.status}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{response.time}ms</span>
                                  </div>
                                  <pre style={{
                                    backgroundColor: response.status >= 200 && response.status < 300 ? '#f0fdf4' : '#fef2f2',
                                    border: `1px solid ${response.status >= 200 && response.status < 300 ? '#bbf7d0' : '#fecaca'}`,
                                    borderRadius: '8px',
                                    padding: '12px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    color: '#0f172a',
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    margin: 0,
                                    lineHeight: '1.4',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}>
                                    {response.body}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Right: Example Response + Code Samples */}
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Code Examples
                              </h4>

                              {/* Code Tabs */}
                              <div style={{ display: 'flex', gap: '2px', marginBottom: '0', backgroundColor: '#f1f5f9', borderRadius: '8px 8px 0 0', padding: '4px' }}>
                                {['curl', 'javascript', 'python'].map(tab => (
                                  <button
                                    key={tab}
                                    onClick={() => setCodeTab(endpoint.id, tab)}
                                    style={{
                                      flex: 1,
                                      padding: '6px 12px',
                                      backgroundColor: codeTab === tab ? 'white' : 'transparent',
                                      color: codeTab === tab ? '#0f172a' : '#64748b',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: codeTab === tab ? '600' : '400',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    {tab === 'curl' ? 'cURL' : tab === 'javascript' ? 'JavaScript' : 'Python'}
                                  </button>
                                ))}
                              </div>

                              {/* Code Block */}
                              <div style={{ position: 'relative' }}>
                                <pre style={{
                                  backgroundColor: '#1e293b',
                                  borderRadius: '0 0 8px 8px',
                                  padding: '16px',
                                  fontSize: '12px',
                                  fontFamily: 'monospace',
                                  color: '#e2e8f0',
                                  overflow: 'auto',
                                  maxHeight: '280px',
                                  margin: 0,
                                  lineHeight: '1.5',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}>
                                  {codeTab === 'curl' && endpoint.curlExample}
                                  {codeTab === 'javascript' && getJsExample(endpoint)}
                                  {codeTab === 'python' && getPythonExample(endpoint)}
                                </pre>
                                <button
                                  onClick={() => {
                                    const code = codeTab === 'curl' ? endpoint.curlExample :
                                      codeTab === 'javascript' ? getJsExample(endpoint) : getPythonExample(endpoint);
                                    handleCopy(code);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    padding: '4px 10px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: '#94a3b8',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                  }}
                                >
                                  Copy
                                </button>
                              </div>

                              {/* Example Response */}
                              <div style={{ marginTop: '20px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Example Response
                                </h4>
                                <pre style={{
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '16px',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  color: '#0f172a',
                                  overflow: 'auto',
                                  maxHeight: '300px',
                                  margin: 0,
                                  lineHeight: '1.4',
                                  whiteSpace: 'pre-wrap',
                                }}>
                                  {endpoint.exampleResponse}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ─── Error Codes ───────────────────────── */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
            Error Codes
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                { status: '400', code: 'BAD_REQUEST', desc: 'Invalid request parameters or malformed JSON body' },
                { status: '401', code: 'UNAUTHORIZED', desc: 'Missing or invalid API key in X-API-Key header' },
                { status: '403', code: 'FORBIDDEN', desc: 'API key does not have permission for this operation' },
                { status: '429', code: 'RATE_LIMITED', desc: 'Rate limit exceeded. Check X-RateLimit-* response headers' },
                { status: '500', code: 'INTERNAL_ERROR', desc: 'Unexpected server error. Contact support if persistent' },
              ].map(err => (
                <tr key={err.status} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: '700',
                      color: parseInt(err.status) >= 500 ? '#ef4444' : parseInt(err.status) >= 400 ? '#f59e0b' : '#94a3b8',
                    }}>
                      {err.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', fontFamily: 'monospace', color: '#0f172a', fontWeight: '500', fontSize: '12px' }}>{err.code}</td>
                  <td style={{ padding: '10px 0', color: '#64748b' }}>{err.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Rate Limits ────────────────────────── */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '40px',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
            Rate Limits & Plans
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Plan</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Price</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Monthly Calls</th>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: '600', color: '#475569' }}>Rate Limit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { plan: 'Free', price: '$0', calls: '100', rate: '30 req/min' },
                { plan: 'Basic', price: '$20/mo', calls: '2,000', rate: '60 req/min' },
                { plan: 'Pro', price: '$80/mo', calls: '10,000', rate: '120 req/min' },
                { plan: 'Enterprise', price: '$300/mo', calls: '50,000+', rate: 'Unlimited' },
              ].map(plan => (
                <tr key={plan.plan} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', fontWeight: '600', color: '#0f172a' }}>{plan.plan}</td>
                  <td style={{ padding: '10px 0', color: '#3b82f6', fontWeight: '600' }}>{plan.price}</td>
                  <td style={{ padding: '10px 0', color: '#475569' }}>{plan.calls}</td>
                  <td style={{ padding: '10px 0', color: '#64748b' }}>{plan.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', marginBottom: 0 }}>
            Rate limit headers: <code style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>X-RateLimit-Limit</code>, <code style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>X-RateLimit-Remaining</code>, <code style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>Retry-After</code>
          </p>
        </div>

        {/* ─── OpenAPI Spec Link ──────────────────── */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>OpenAPI 3.0 Specification</div>
            <div style={{ fontSize: '12px', color: '#0284c7' }}>Import into Swagger UI, Postman, or any OpenAPI-compatible tool.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="/api/v1/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: 'white',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              View JSON Spec
            </a>
            <a
              href="/developers/playground"
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#0284c7',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                border: '1px solid #bae6fd',
              }}
            >
              Widget Playground
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
