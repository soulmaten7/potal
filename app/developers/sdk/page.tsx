'use client';

import React, { useState } from 'react';

const accent = '#E8640A';

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-xl border border-slate-200 overflow-hidden mb-4">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-[11px] text-slate-400 font-semibold">{lang}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-[11px] px-3 py-1 rounded-md font-medium transition-colors" style={{ background: copied ? '#dcfce7' : '#f1f5f9', color: copied ? '#16a34a' : '#64748b', border: 'none', cursor: 'pointer' }}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 m-0 text-xs font-mono leading-relaxed overflow-x-auto" style={{ background: '#0d1117', color: '#e6edf3' }}>{code}</pre>
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
    <div className="min-h-screen bg-white py-16 px-5">
      <div className="max-w-7xl mx-auto">
        <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(232,100,10,0.1)', color: accent }}>DEVELOPER DOCS</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">SDK & Integration Guide</h1>
        <p className="text-slate-500 mb-8 text-[15px]">Get started with POTAL in your preferred language. All SDKs are free and open source.</p>

        <div className="flex gap-2 mb-8">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors" style={{ background: tab === t ? accent : '#f1f5f9', color: tab === t ? 'white' : '#64748b', border: 'none', cursor: 'pointer' }}>{t}</button>
          ))}
        </div>

        {tab === 'JavaScript' && (
          <>
            <h3 className="text-base font-bold text-slate-800 mb-3">Installation</h3>
            <CodeBlock code={JS_INSTALL} lang="bash" />
            <h3 className="text-base font-bold text-slate-800 mb-3">Initialization</h3>
            <CodeBlock code={JS_INIT} lang="javascript" />
            <h3 className="text-base font-bold text-slate-800 mb-3">Examples</h3>
            <CodeBlock code={JS_EXAMPLES} lang="javascript" />
          </>
        )}

        {tab === 'Python' && (
          <>
            <h3 className="text-base font-bold text-slate-800 mb-3">Installation</h3>
            <CodeBlock code={PY_INSTALL} lang="bash" />
            <h3 className="text-base font-bold text-slate-800 mb-3">Initialization</h3>
            <CodeBlock code={PY_INIT} lang="python" />
            <h3 className="text-base font-bold text-slate-800 mb-3">Examples</h3>
            <CodeBlock code={PY_EXAMPLES} lang="python" />
          </>
        )}

        {tab === 'cURL' && (
          <>
            <h3 className="text-base font-bold text-slate-800 mb-3">Examples</h3>
            <CodeBlock code={CURL_EXAMPLES} lang="bash" />
          </>
        )}
      </div>
    </div>
  );
}
