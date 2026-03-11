"use client";

import React, { useState, useEffect } from 'react';

const SIDEBAR_LINKS = [
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'widget-customization', label: 'Widget Customization' },
];

export default function DevelopersPage() {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('quick-start');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );
    for (const link of SIDEBAR_LINKS) {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const embedCode = `<!-- POTAL Widget -->
<script src="https://www.potal.app/widget/potal-widget.js"></script>

<!-- Embed the widget with your API key -->
<div
  data-potal-widget
  data-api-key="YOUR_API_KEY"
  data-product-name="Your Product Name"
  data-price="99.99"
  data-shipping="15.00"
  data-origin="US"
  data-theme="light"
></div>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Hero Section */}
      <section style={{
        backgroundColor: '#02122c',
        color: 'white',
        padding: '80px 24px 60px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px',
            letterSpacing: '-0.5px'
          }}>
            Seller Integration Hub
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#d1d5db',
            marginBottom: '16px'
          }}>
            Empower your store with real-time global shipping and tax calculations
          </p>
          <p style={{
            fontSize: '16px',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Add POTAL to your store in 2 minutes. No backend integration required.
          </p>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', display: 'flex', gap: 40 }}>

        {/* Sticky Sidebar */}
        <nav style={{
          width: 200,
          flexShrink: 0,
          position: 'sticky',
          top: 80,
          alignSelf: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {SIDEBAR_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: activeSection === link.id ? 700 : 500,
                color: activeSection === link.id ? '#02122c' : '#6b7280',
                background: activeSection === link.id ? '#f3f4f6' : 'transparent',
                textDecoration: 'none',
                borderLeft: activeSection === link.id ? '3px solid #F59E0B' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Section A: Quick Start */}
        <section id="quick-start" style={{ marginBottom: '80px', scrollMarginTop: 80 }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#02122c',
              marginBottom: '12px'
            }}>
              Quick Start
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Copy and paste this code snippet into your product page HTML. Our widget will automatically calculate accurate shipping costs and taxes in real-time.
            </p>
            <a
              href="/developers/quickstart"
              style={{
                display: 'inline-block',
                marginTop: '12px',
                padding: '10px 20px',
                background: '#F59E0B',
                color: '#02122c',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              View Full Quick Start Guide &rarr;
            </a>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            overflow: 'auto'
          }}>
            <pre style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#02122c',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {embedCode}
            </pre>
          </div>

          <button
            onClick={handleCopy}
            style={{
              backgroundColor: copied ? '#10b981' : '#02122c',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s',
              marginRight: '12px'
            }}
            onMouseEnter={(e) => !copied && (e.currentTarget.style.backgroundColor = '#F59E0B')}
            onMouseLeave={(e) => !copied && (e.currentTarget.style.backgroundColor = '#02122c')}
          >
            {copied ? '✓ Copied' : 'Copy Code'}
          </button>

          <a
            href="/developers/docs"
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: '#2563eb',
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #2563eb',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#2563eb';
            }}
          >
            View Full Docs →
          </a>
        </section>

        {/* Section B: API Reference */}
        <section id="api-reference" style={{ marginBottom: '80px', scrollMarginTop: 80 }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#02122c',
              marginBottom: '12px'
            }}>
              API Reference
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Integrate directly with our REST API for custom implementations. All endpoints require authentication with your API key.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* API Card 1 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                backgroundColor: '#2563eb',
                color: 'white',
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                POST
              </div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}>
                /api/v1/calculate
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Calculate shipping cost, duties, and taxes for a single product.
              </p>
              <div style={{
                backgroundColor: '#f0f4f8',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Request:</p>
                <p style={{ margin: '0 0 8px 0', color: '#02122c' }}>price, shipping, origin, destination</p>
              </div>
              <div style={{
                backgroundColor: '#f0f4f8',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Response:</p>
                <p style={{ margin: '0', color: '#02122c' }}>total_cost, tax, duties</p>
              </div>
            </div>

            {/* API Card 2 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                backgroundColor: '#2563eb',
                color: 'white',
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                POST
              </div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}>
                /api/v1/calculate/batch
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Calculate for up to 100 products in a single request.
              </p>
              <div style={{
                backgroundColor: '#f0f4f8',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Request:</p>
                <p style={{ margin: '0 0 8px 0', color: '#02122c' }}>items: array of products</p>
              </div>
              <div style={{
                backgroundColor: '#f0f4f8',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Response:</p>
                <p style={{ margin: '0', color: '#02122c' }}>results: array</p>
              </div>
            </div>

            {/* API Card 3 */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                backgroundColor: '#10b981',
                color: 'white',
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                GET
              </div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '12px',
                fontFamily: 'monospace'
              }}>
                /api/v1/countries
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '16px',
                lineHeight: '1.6'
              }}>
                Get list of supported countries. Public endpoint, no auth required.
              </p>
              <div style={{
                backgroundColor: '#f0f4f8',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Request:</p>
                <p style={{ margin: '0 0 8px 0', color: '#02122c' }}>No parameters</p>
              </div>
              <div style={{
                backgroundColor: '#f0f4f8',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <p style={{ margin: '0 0 4px 0', color: '#6b7280' }}>Response:</p>
                <p style={{ margin: '0', color: '#02122c' }}>countries: array</p>
              </div>
            </div>
          </div>

          <p style={{
            marginTop: '24px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Need more details? <a href="/developers/docs" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>View Full API Documentation →</a>
          </p>
        </section>

        {/* Section C: Authentication */}
        <section id="authentication" style={{ marginBottom: '80px', scrollMarginTop: 80 }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>
              Authentication
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.6' }}>
              All API requests (except public endpoints) require authentication via the <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 14 }}>X-API-Key</code> header.
            </p>
          </div>

          {/* Key Format */}
          <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#02122c', marginBottom: 16 }}>API Key Format</h3>
            <div style={{ fontSize: 13, fontFamily: 'monospace', lineHeight: 2 }}>
              <div><span style={{ color: '#2563eb', fontWeight: 'bold' }}>pk_live_...</span> — Publishable key (widget embed, client-side)</div>
              <div><span style={{ color: '#dc2626', fontWeight: 'bold' }}>sk_live_...</span> — Secret key (server-side only, never expose in frontend)</div>
            </div>
          </div>

          {/* Error Codes */}
          <div style={{ backgroundColor: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#02122c', marginBottom: 16 }}>Error Codes</h3>
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>Meaning</th>
                  <th style={{ padding: '8px 12px', color: '#6b7280', fontWeight: 600 }}>Solution</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#dc2626' }}>401</td>
                  <td style={{ padding: '8px 12px' }}>Missing or invalid API key</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>Check X-API-Key header is set correctly</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#dc2626' }}>403</td>
                  <td style={{ padding: '8px 12px' }}>Plan limit exceeded or key disabled</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>Upgrade your plan or contact support</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#F59E0B' }}>429</td>
                  <td style={{ padding: '8px 12px' }}>Rate limit exceeded</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>Wait and retry, or upgrade for higher limits</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Code Examples */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* curl */}
            <div style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 12 }}>cURL</div>
              <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#e5e7eb', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{`curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: pk_live_YOUR_KEY" \\
  -d '{"price": 99.99, "origin": "CN", "destinationCountry": "US"}'`}</pre>
            </div>

            {/* JavaScript */}
            <div style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 12 }}>JavaScript</div>
              <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#e5e7eb', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{`const res = await fetch(
  "https://www.potal.app/api/v1/calculate",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": "pk_live_YOUR_KEY",
    },
    body: JSON.stringify({
      price: 99.99,
      origin: "CN",
      destinationCountry: "US",
    }),
  }
);
const data = await res.json();`}</pre>
            </div>

            {/* Python */}
            <div style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 12 }}>Python</div>
              <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#e5e7eb', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{`import requests

resp = requests.post(
    "https://www.potal.app/api/v1/calculate",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "pk_live_YOUR_KEY",
    },
    json={
        "price": 99.99,
        "origin": "CN",
        "destinationCountry": "US",
    },
)
data = resp.json()`}</pre>
            </div>
          </div>
        </section>

        {/* Section D: Widget Customization */}
        <section id="widget-customization" style={{ marginBottom: '60px', scrollMarginTop: 80 }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#02122c',
              marginBottom: '12px'
            }}>
              Widget Customization
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6'
            }}>
              Customize the widget behavior and appearance to match your store's design.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {/* Attributes Section */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '16px'
              }}>
                Data Attributes
              </h3>
              <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>data-api-key</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Your POTAL API key (required)</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>data-product-name</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Product name for tracking</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>data-price</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Product price in USD</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>data-shipping</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Base shipping cost in USD</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>data-origin</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Origin country code (e.g., US, CN)</p>
                </div>
                <div>
                  <span style={{ color: '#2563eb', fontWeight: 'bold' }}>data-theme</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>light or dark mode</p>
                </div>
              </div>
            </div>

            {/* Theme Options */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '16px'
              }}>
                Theme Options
              </h3>
              <div style={{ fontSize: '13px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 'bold', color: '#02122c', display: 'block', marginBottom: '8px' }}>Light Theme</span>
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>
                    data-theme="light"
                  </div>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#02122c', display: 'block', marginBottom: '8px' }}>Dark Theme</span>
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#d1d5db',
                    fontFamily: 'monospace'
                  }}>
                    data-theme="dark"
                  </div>
                </div>
              </div>
            </div>

            {/* Callback Events */}
            <div style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '16px'
              }}>
                Callback Events
              </h3>
              <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>onCalculated</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Fired when calculation completes</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>onError</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Fired when error occurs</p>
                </div>
                <div>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>onChange</span>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>Fired when user changes selection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          backgroundColor: '#02122c',
          color: 'white',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#d1d5db',
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px'
          }}>
            Integrate POTAL today and start offering real shipping calculations to your customers.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/developers/playground"
              style={{
                backgroundColor: '#F59E0B',
                color: '#02122c',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Try the Playground
            </a>
            <a
              href="/developers/docs"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textDecoration: 'none',
                border: '2px solid white',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#02122c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}
            >
              Full Documentation
            </a>
          </div>
        </section>

        </div>{/* end Content */}
      </div>
    </div>
  );
}
