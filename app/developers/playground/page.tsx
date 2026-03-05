"use client";

import React, { useState, useEffect } from 'react';

const TEST_KEY = 'pk_live_ghTRbsEvgN7BgbuwI0d4vWOWzFIkLSqgF5BR';
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' }
];

export default function PlaygroundPage() {
  const [apiKey, setApiKey] = useState(TEST_KEY);
  const [productName, setProductName] = useState('Premium Headphones');
  const [price, setPrice] = useState('99.99');
  const [shipping, setShipping] = useState('15.00');
  const [origin, setOrigin] = useState('US');
  const [destination, setDestination] = useState('GB');
  const [theme, setTheme] = useState('light');
  const [widgetKey, setWidgetKey] = useState(0);

  const embedCode = `<!-- POTAL Widget -->
<script src="https://www.potal.app/widget/potal-widget.js"></script>

<!-- Embed the widget with your configuration -->
<div
  data-potal-widget
  data-api-key="${apiKey}"
  data-product-name="${productName}"
  data-price="${price}"
  data-shipping="${shipping}"
  data-origin="${origin}"
  data-theme="${theme}"
></div>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
  };

  // Force re-render of iframe when config changes
  useEffect(() => {
    setWidgetKey(prev => prev + 1);
  }, [apiKey, productName, price, shipping, origin, destination, theme]);

  const countries = COUNTRIES;
  const originCountries = COUNTRIES;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <section style={{
        backgroundColor: '#02122c',
        color: 'white',
        padding: '40px 24px 30px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            Widget Playground
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#d1d5db'
          }}>
            Configure and preview the POTAL widget in real-time
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px'
        }}>

          {/* Left: Controls Panel */}
          <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#02122c',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                Configuration
              </h2>

              {/* API Key */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#02122c',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    color: '#02122c'
                  }}
                  placeholder="Your API key"
                />
                <p style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  margin: '6px 0 0 0'
                }}>
                  Test: pk_live_ghTRbsEvgN7BgbuwI0d4vWOWzFIkLSqgF5BR
                </p>
              </div>

              {/* Product Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#02122c',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    color: '#02122c'
                  }}
                  placeholder="Product name"
                />
              </div>

              {/* Price and Shipping in Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#02122c',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      color: '#02122c'
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#02122c',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Shipping (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      color: '#02122c'
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Origin and Destination */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#02122c',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Origin
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      color: '#02122c',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {originCountries.map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#02122c',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Destination
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      color: '#02122c',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#02122c',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Theme
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setTheme('light')}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: theme === 'light' ? '2px solid #2563eb' : '1px solid #d1d5db',
                      backgroundColor: theme === 'light' ? '#f0f4f8' : 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: theme === 'light' ? '#2563eb' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                  >
                    ☀️ Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: theme === 'dark' ? '2px solid #2563eb' : '1px solid #d1d5db',
                      backgroundColor: theme === 'dark' ? '#f0f4f8' : 'white',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: theme === 'dark' ? '#2563eb' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>

              {/* Copy Code Button */}
              <button
                onClick={handleCopyCode}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#02122c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F59E0B')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#02122c')}
              >
                Copy Embed Code
              </button>
            </div>
          </div>

          {/* Right: Preview and Code */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Widget Preview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#02122c',
                  margin: '0'
                }}>
                  Live Preview
                </h3>
              </div>
              <div style={{
                padding: '24px',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  backgroundColor: theme === 'dark' ? '#374151' : '#f0f4f8',
                  borderRadius: '8px',
                  border: '2px dashed ' + (theme === 'dark' ? '#4b5563' : '#d1d5db')
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '12px'
                  }}>
                    📦
                  </div>
                  <p style={{
                    color: theme === 'dark' ? '#d1d5db' : '#6b7280',
                    margin: '0 0 8px 0',
                    fontWeight: 'bold'
                  }}>
                    {productName}
                  </p>
                  <p style={{
                    color: theme === 'dark' ? '#9ca3af' : '#9ca3af',
                    margin: '0 0 16px 0',
                    fontSize: '13px'
                  }}>
                    ${parseFloat(price || '0').toFixed(2)} + ${parseFloat(shipping || '0').toFixed(2)} shipping
                  </p>
                  <div style={{
                    backgroundColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#d1d5db' : '#02122c',
                    fontFamily: 'monospace'
                  }}>
                    <div>{origin} → {destination}</div>
                    <div style={{ fontSize: '11px', color: theme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>
                      {theme === 'light' ? '☀️ Light Theme' : '🌙 Dark Theme'}
                    </div>
                  </div>
                  <p style={{
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    margin: '16px 0 0 0',
                    fontSize: '12px'
                  }}>
                    Widget would load here with your actual widget script
                  </p>
                </div>
              </div>
            </div>

            {/* Embed Code */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#02122c',
                  margin: '0'
                }}>
                  Generated Embed Code
                </h3>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#f0f4f8',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                <pre style={{
                  margin: '0',
                  color: '#02122c',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {embedCode}
                </pre>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={handleCopyCode}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Help Section */}
        <div style={{
          marginTop: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#02122c',
            marginBottom: '16px'
          }}>
            How to Use
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            fontSize: '13px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#02122c', marginBottom: '8px' }}>1. Configure Settings</div>
              <p style={{ color: '#6b7280', margin: '0' }}>Update the API key, product details, and destination country to match your use case.</p>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#02122c', marginBottom: '8px' }}>2. Copy the Code</div>
              <p style={{ color: '#6b7280', margin: '0' }}>Click "Copy Embed Code" to copy the generated HTML snippet to your clipboard.</p>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#02122c', marginBottom: '8px' }}>3. Paste into Your Site</div>
              <p style={{ color: '#6b7280', margin: '0' }}>Paste the code into your product page HTML, and the widget will render automatically.</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a
            href="/developers"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '8px 16px',
              border: '1px solid #2563eb',
              borderRadius: '6px',
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
            ← Back to Integration Hub
          </a>
          <a
            href="/developers/docs"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '8px 16px',
              border: '1px solid #2563eb',
              borderRadius: '6px',
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
            View API Docs →
          </a>
        </div>
      </div>
    </div>
  );
}
