'use client';

import { useState } from 'react';
import Link from 'next/link';

type TabId = 'shopify' | 'widget' | 'api';

const TABS: { id: TabId; label: string; icon: string; time: string }[] = [
  { id: 'shopify', label: 'Shopify', icon: '🛍️', time: '1 min' },
  { id: 'widget', label: 'JS Widget', icon: '🧩', time: '2 min' },
  { id: 'api', label: 'REST API', icon: '⚡', time: '3 min' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        position: 'absolute', top: 10, right: 10,
        background: copied ? '#16a34a' : '#374151',
        color: 'white', border: 'none', padding: '5px 12px',
        borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      {language && (
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
          {language}
        </div>
      )}
      <div style={{
        background: '#1e293b', borderRadius: 10, padding: '16px 18px',
        fontFamily: '"Fira Code", "SF Mono", monospace', fontSize: 13,
        lineHeight: 1.7, color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre',
      }}>
        <CopyButton text={code} />
        {code}
      </div>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: '#F59E0B',
      color: '#02122c', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, fontWeight: 800, flexShrink: 0,
    }}>
      {n}
    </div>
  );
}

function ShopifyTab() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={1} />
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Install the POTAL app</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Go to your Shopify Admin &rarr; <strong>Apps</strong> &rarr; Search &quot;POTAL&quot; in the Shopify App Store &rarr; Click <strong>Install</strong>.
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
            Or install directly: <a href="https://apps.shopify.com" target="_blank" rel="noopener noreferrer" style={{ color: '#F59E0B' }}>apps.shopify.com</a>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={2} />
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Enable the widget</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            After installing, go to <strong>Online Store</strong> &rarr; <strong>Themes</strong> &rarr; <strong>Customize</strong> &rarr; <strong>App embeds</strong> (left sidebar) &rarr; Toggle <strong>POTAL Widget</strong> on.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={3} />
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Done!</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            The POTAL widget will automatically appear on your product pages, showing customers the total landed cost (duties + taxes + shipping) for their country.
          </p>
        </div>
      </div>

      <div style={{
        background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10,
        padding: '14px 18px', fontSize: 13, color: '#166534', lineHeight: 1.6,
      }}>
        <strong>Included blocks:</strong> Product Page Widget, Cart Banner, and App Embed. You can configure each in the Theme Editor.
      </div>
    </div>
  );
}

function WidgetTab() {
  const widgetCode = `<!-- POTAL Total Landed Cost Widget -->
<script src="https://www.potal.app/widget/potal-widget.js"><\/script>

<div
  data-potal-widget
  data-api-key="YOUR_API_KEY"
  data-product-name="Premium Headphones"
  data-price="99.99"
  data-shipping="15.00"
  data-origin="US"
  data-theme="light"
></div>`;

  const initCode = `<!-- Advanced: Initialize with JavaScript -->
<script>
  PotalWidget.init({
    apiKey: 'YOUR_API_KEY',
    container: '#potal-container',
    product: {
      name: 'Premium Headphones',
      price: 99.99,
      shipping: 15.00,
      origin: 'US',
      hsCode: '8518.30'  // optional — AI auto-classifies if omitted
    },
    theme: 'light'  // 'light' | 'dark' | 'auto'
  });
<\/script>`;

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={1} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Get your API key</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px', lineHeight: 1.6 }}>
            Copy your Publishable Key from the <Link href="/dashboard" style={{ color: '#F59E0B', fontWeight: 600 }}>Dashboard &rarr; API Keys</Link> tab.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={2} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Add the widget to your page</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>
            Paste this code where you want the landed cost widget to appear (e.g., product page, cart page):
          </p>
          <CodeBlock code={widgetCode} language="html" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={3} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Customize (optional)</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>
            For dynamic products or advanced control, use the JavaScript API:
          </p>
          <CodeBlock code={initCode} language="javascript" />
        </div>
      </div>

      <div style={{
        background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 10,
        padding: '14px 18px', fontSize: 13, color: '#1e40af', lineHeight: 1.6,
      }}>
        <strong>Data attributes:</strong> <code>data-theme</code> (light/dark/auto), <code>data-origin</code> (2-letter country code), <code>data-hs-code</code> (optional). See <Link href="/developers/docs" style={{ color: '#1e40af', fontWeight: 600 }}>full docs</Link>.
      </div>
    </div>
  );
}

function ApiTab() {
  const curlCode = `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_YOUR_SECRET_KEY" \\
  -d '{
    "productName": "Premium Headphones",
    "price": 99.99,
    "shippingCost": 15.00,
    "origin": "US",
    "destination": "DE",
    "hsCode": "8518.30"
  }'`;

  const jsCode = `const response = await fetch('https://www.potal.app/api/v1/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_YOUR_SECRET_KEY',
  },
  body: JSON.stringify({
    productName: 'Premium Headphones',
    price: 99.99,
    shippingCost: 15.00,
    origin: 'US',
    destination: 'DE',
  }),
});

const data = await response.json();
console.log(data.data.totalLandedCost);`;

  const pythonCode = `import requests

response = requests.post(
    'https://www.potal.app/api/v1/calculate',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': 'sk_live_YOUR_SECRET_KEY',
    },
    json={
        'productName': 'Premium Headphones',
        'price': 99.99,
        'shippingCost': 15.00,
        'origin': 'US',
        'destination': 'DE',
    },
)

data = response.json()
print(data['data']['totalLandedCost'])`;

  const responseExample = `{
  "success": true,
  "data": {
    "totalLandedCost": 134.82,
    "breakdown": {
      "productPrice": 99.99,
      "shipping": 15.00,
      "importDuty": 2.30,
      "vat": 17.53,
      "otherFees": 0.00
    },
    "destination": "DE",
    "currency": "USD",
    "hsCode": "8518.30",
    "hsDescription": "Headphones and earphones"
  }
}`;

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={1} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Use your Secret Key</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Copy your Secret Key from the <Link href="/dashboard" style={{ color: '#F59E0B', fontWeight: 600 }}>Dashboard &rarr; API Keys</Link> tab. Use the <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>X-API-Key</code> header for authentication.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={2} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Make your first API call</h3>
          <CodeBlock code={curlCode} language="curl" />
          <CodeBlock code={jsCode} language="javascript" />
          <CodeBlock code={pythonCode} language="python" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 28 }}>
        <StepNumber n={3} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#02122c', margin: '4px 0 8px' }}>Response</h3>
          <CodeBlock code={responseExample} language="json" />
        </div>
      </div>

      <div style={{
        background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 10,
        padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.6,
      }}>
        <strong>Batch API:</strong> Calculate up to 100 products at once with <code>POST /api/v1/calculate/batch</code>. See <Link href="/developers/docs" style={{ color: '#92400e', fontWeight: 600 }}>full API docs</Link>.
      </div>
    </div>
  );
}

export default function QuickStartPage() {
  const [activeTab, setActiveTab] = useState<TabId>('shopify');

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: 'calc(100vh - 80px)',
      background: '#f8fafc',
    }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #02122c 0%, #0a2540 100%)',
        padding: '48px 20px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: '0 0 10px' }}>
          Quick Start Guide
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Add total landed cost calculations to your store in minutes
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Tab Selector */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 32,
          background: 'white', borderRadius: 14, padding: 6,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '14px 10px', borderRadius: 10, border: 'none',
                background: activeTab === tab.id ? '#02122c' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#64748b',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span>{tab.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: activeTab === tab.id ? '#94a3b8' : '#cbd5e1',
              }}>
                {tab.time}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{
          background: 'white', borderRadius: 16, padding: '32px 28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0',
        }}>
          {activeTab === 'shopify' && <ShopifyTab />}
          {activeTab === 'widget' && <WidgetTab />}
          {activeTab === 'api' && <ApiTab />}
        </div>

        {/* Bottom Links */}
        <div style={{
          display: 'flex', gap: 16, marginTop: 28,
          justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <Link href="/dashboard" style={{
            padding: '12px 28px', borderRadius: 10, background: '#02122c',
            color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700,
          }}>
            Go to Dashboard
          </Link>
          <Link href="/developers/docs" style={{
            padding: '12px 28px', borderRadius: 10, background: 'white',
            color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600,
            border: '2px solid #e2e8f0',
          }}>
            Full API Docs
          </Link>
          <Link href="/developers/playground" style={{
            padding: '12px 28px', borderRadius: 10, background: 'white',
            color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600,
            border: '2px solid #e2e8f0',
          }}>
            Widget Playground
          </Link>
        </div>
      </div>
    </div>
  );
}
