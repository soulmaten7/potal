'use client';

import React, { useState } from 'react';

const accent = '#E8640A';

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: 'relative', background: '#0d1117', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{lang}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ fontSize: 11, padding: '3px 10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{ padding: '14px', margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#e6edf3', overflowX: 'auto', lineHeight: 1.6 }}>{code}</pre>
    </div>
  );
}

const TABS = ['JavaScript', 'Python', 'cURL'] as const;

const JS_INSTALL = `npm install @potal/sdk`;
const JS_INIT = `import { Potal } from '@potal/sdk';

const potal = new Potal({
  apiKey: 'pk_live_your_api_key',
});`;
const JS_EXAMPLES = `// HS Code Classification
const classification = await potal.classify({
  productName: 'Cotton T-Shirt',
  material: 'cotton',
  category: 'apparel',
});

// Landed Cost Calculation
const cost = await potal.calculate({
  productName: 'Cotton T-Shirt',
  material: 'cotton',
  price: 29.99,
  origin: 'CN',
  destinationCountry: 'US',
});

// Denied Party Screening
const screening = await potal.screen({
  name: 'ABC Trading Co.',
  country: 'IR',
});`;

const PY_INSTALL = `pip install potal`;
const PY_INIT = `from potal import Potal

client = Potal(api_key="pk_live_your_api_key")`;
const PY_EXAMPLES = `# HS Code Classification
result = client.classify(
    product_name="Cotton T-Shirt",
    material="cotton",
    category="apparel",
)

# Landed Cost Calculation
cost = client.calculate(
    product_name="Cotton T-Shirt",
    material="cotton",
    price=29.99,
    origin="CN",
    destination_country="US",
)

# Denied Party Screening
screening = client.screen(
    name="ABC Trading Co.",
    country="IR",
)`;

const CURL_EXAMPLES = `# HS Code Classification
curl -X POST https://www.potal.app/api/v1/classify \\
  -H "X-API-Key: pk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName":"Cotton T-Shirt","material":"cotton","category":"apparel"}'

# Landed Cost Calculation
curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "X-API-Key: pk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"productName":"Cotton T-Shirt","price":29.99,"origin":"CN","destinationCountry":"US"}'

# Denied Party Screening
curl -X POST https://www.potal.app/api/v1/screening \\
  -H "X-API-Key: pk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"ABC Trading Co.","country":"IR"}'`;

export default function SdkPage() {
  const [tab, setTab] = useState<typeof TABS[number]>('JavaScript');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>DEVELOPER DOCS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>SDK & Integration Guide</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 15 }}>Get started with POTAL in your preferred language. All SDKs are free and open source.</p>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t ? accent : 'rgba(255,255,255,0.08)', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>{t}</button>
          ))}
        </div>

        {tab === 'JavaScript' && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Installation</h3>
            <CodeBlock code={JS_INSTALL} lang="bash" />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Initialization</h3>
            <CodeBlock code={JS_INIT} lang="javascript" />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Examples</h3>
            <CodeBlock code={JS_EXAMPLES} lang="javascript" />
          </>
        )}

        {tab === 'Python' && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Installation</h3>
            <CodeBlock code={PY_INSTALL} lang="bash" />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Initialization</h3>
            <CodeBlock code={PY_INIT} lang="python" />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Examples</h3>
            <CodeBlock code={PY_EXAMPLES} lang="python" />
          </>
        )}

        {tab === 'cURL' && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Examples</h3>
            <CodeBlock code={CURL_EXAMPLES} lang="bash" />
          </>
        )}
      </div>
    </div>
  );
}
