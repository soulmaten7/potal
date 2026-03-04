"use client";

import React, { useState } from 'react';

const API_BASE = 'https://potal-x1vl.vercel.app';
const TEST_KEY = 'pk_live_ghTRbsEvgN7BgbuwI0d4vWOWzFIkLSqgF5BR';

export default function DocsPage() {
  const [apiKey, setApiKey] = useState(TEST_KEY);
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('single');

  const exampleRequest = {
    price: 100,
    shippingPrice: 15,
    origin: 'US',
    destinationCountry: 'GB',
    zipcode: 'SW1A 1AA',
    productName: 'Test Product',
    hsCode: '6204620000'
  };

  const exampleBatchRequest = {
    items: [
      { price: 100, shippingPrice: 15, origin: 'US', destinationCountry: 'GB' },
      { price: 50, shippingPrice: 10, origin: 'US', destinationCountry: 'DE' }
    ]
  };

  const handleTestApi = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestResponse(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(exampleRequest)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      setTestResponse(data);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <section style={{
        backgroundColor: '#02122c',
        color: 'white',
        padding: '60px 24px 40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            API Documentation
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#d1d5db'
          }}>
            Complete reference for POTAL API endpoints and integration
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Quick Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '60px'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '8px' }}>BASE URL</div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#02122c', fontWeight: 'bold' }}>{API_BASE}</div>
          </div>
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '8px' }}>AUTHENTICATION</div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#02122c', fontWeight: 'bold' }}>X-API-Key Header</div>
          </div>
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', marginBottom: '8px' }}>FORMAT</div>
            <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#02122c', fontWeight: 'bold' }}>JSON</div>
          </div>
        </div>

        {/* Authentication Section */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#02122c',
            marginBottom: '16px'
          }}>
            Authentication
          </h2>
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #dcfce7',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#15803d',
              margin: 0
            }}>
              All API requests must include your API key in the <code style={{ backgroundColor: '#f0f4f8', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>X-API-Key</code> header.
            </p>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px 0' }}>Example request header:</p>
            <div style={{
              backgroundColor: '#f0f4f8',
              padding: '12px',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#02122c'
            }}>
              X-API-Key: pk_live_ghTRbsEvgN7BgbuwI0d4vWOWzFIkLSqgF5BR
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>API Key Types</h3>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Prefix</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Usage</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#2563eb' }}>pk_live_*</td>
                  <td style={{ padding: '12px' }}>Public Key</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>Frontend/widget (safe to expose)</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#2563eb' }}>sk_live_*</td>
                  <td style={{ padding: '12px' }}>Secret Key</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>Backend only (keep private)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate Limits */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#02122c',
            marginBottom: '24px'
          }}>
            Rate Limits
          </h2>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Plan</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Requests/Minute</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#02122c' }}>Starter</td>
                <td style={{ padding: '12px' }}>60</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Up to 3,600 requests/hour</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#02122c' }}>Growth</td>
                <td style={{ padding: '12px' }}>120</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Up to 7,200 requests/hour</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontWeight: 'bold', color: '#02122c' }}>Enterprise</td>
                <td style={{ padding: '12px' }}>Unlimited</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Custom limits available</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Endpoints */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#02122c',
            marginBottom: '24px'
          }}>
            Endpoints
          </h2>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
            marginBottom: '32px',
            gap: '24px'
          }}>
            <button
              onClick={() => setActiveTab('single')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'single' ? 'bold' : '500',
                color: activeTab === 'single' ? '#02122c' : '#6b7280',
                borderBottom: activeTab === 'single' ? '3px solid #2563eb' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#02122c')}
              onMouseLeave={(e) => !activeTab.startsWith('single') && (e.currentTarget.style.color = '#6b7280')}
            >
              Single Calculate
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'batch' ? 'bold' : '500',
                color: activeTab === 'batch' ? '#02122c' : '#6b7280',
                borderBottom: activeTab === 'batch' ? '3px solid #2563eb' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#02122c')}
              onMouseLeave={(e) => !activeTab.startsWith('batch') && (e.currentTarget.style.color = '#6b7280')}
            >
              Batch Calculate
            </button>
            <button
              onClick={() => setActiveTab('countries')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: activeTab === 'countries' ? 'bold' : '500',
                color: activeTab === 'countries' ? '#02122c' : '#6b7280',
                borderBottom: activeTab === 'countries' ? '3px solid #2563eb' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#02122c')}
              onMouseLeave={(e) => !activeTab.startsWith('countries') && (e.currentTarget.style.color = '#6b7280')}
            >
              Countries List
            </button>
          </div>

          {/* Endpoint: Single Calculate */}
          {activeTab === 'single' && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      POST
                    </span>
                    <code style={{
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      color: '#02122c',
                      fontWeight: 'bold',
                      backgroundColor: '#f0f4f8',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      /api/v1/calculate
                    </code>
                  </div>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    Calculate shipping cost, duties, and taxes for a single product
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                {/* Request */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>Request Body</h4>
                  <div style={{
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: '0', color: '#02122c' }}>
{`{
  "price": 100,
  "shippingPrice": 15,
  "origin": "US",
  "destinationCountry": "GB",
  "zipcode": "SW1A 1AA",
  "productName": "Product",
  "hsCode": "6204620000"
}`}
                    </pre>
                  </div>
                  <table style={{
                    width: '100%',
                    marginTop: '12px',
                    fontSize: '12px',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 'bold', color: '#02122c' }}>Field</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 'bold', color: '#02122c' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 'bold', color: '#02122c' }}>Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0' }}>price</td>
                        <td style={{ padding: '8px 0' }}>number</td>
                        <td style={{ padding: '8px 0' }}>Yes</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0' }}>shippingPrice</td>
                        <td style={{ padding: '8px 0' }}>number</td>
                        <td style={{ padding: '8px 0' }}>No</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0' }}>origin</td>
                        <td style={{ padding: '8px 0' }}>string</td>
                        <td style={{ padding: '8px 0' }}>Yes</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0' }}>destinationCountry</td>
                        <td style={{ padding: '8px 0' }}>string</td>
                        <td style={{ padding: '8px 0' }}>Yes</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0' }}>zipcode</td>
                        <td style={{ padding: '8px 0' }}>string</td>
                        <td style={{ padding: '8px 0' }}>No</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 0' }}>productName</td>
                        <td style={{ padding: '8px 0' }}>string</td>
                        <td style={{ padding: '8px 0' }}>No</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0' }}>hsCode</td>
                        <td style={{ padding: '8px 0' }}>string</td>
                        <td style={{ padding: '8px 0' }}>No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Response */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>Response</h4>
                  <div style={{
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: '0', color: '#02122c' }}>
{`{
  "success": true,
  "data": {
    "totalCost": 147.50,
    "baseCost": 115.00,
    "tax": 19.75,
    "duties": 12.75,
    "currency": "GBP",
    "estimatedDelivery": "5-7 days"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Try It Section */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '16px' }}>Try It Out</h4>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#02122c',
                    marginBottom: '6px'
                  }}>
                    API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={handleTestApi}
                  disabled={testLoading}
                  style={{
                    backgroundColor: testLoading ? '#6b7280' : '#2563eb',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: testLoading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => !testLoading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                  onMouseLeave={(e) => !testLoading && (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                  {testLoading ? 'Testing...' : 'Test API Call'}
                </button>

                {testResponse && (
                  <div style={{
                    marginTop: '16px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}>
                    <pre style={{ margin: '0', color: '#15803d', overflow: 'auto' }}>
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {testError && (
                  <div style={{
                    marginTop: '16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#dc2626'
                  }}>
                    Error: {testError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endpoint: Batch Calculate */}
          {activeTab === 'batch' && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      POST
                    </span>
                    <code style={{
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      color: '#02122c',
                      fontWeight: 'bold',
                      backgroundColor: '#f0f4f8',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      /api/v1/calculate/batch
                    </code>
                  </div>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    Calculate for up to 100 products in a single request
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>Request Body</h4>
                  <div style={{
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: '0', color: '#02122c' }}>
{`{
  "items": [
    {
      "price": 100,
      "shippingPrice": 15,
      "origin": "US",
      "destinationCountry": "GB"
    },
    {
      "price": 50,
      "shippingPrice": 10,
      "origin": "US",
      "destinationCountry": "DE"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>Response</h4>
                  <div style={{
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: '0', color: '#02122c' }}>
{`{
  "success": true,
  "data": {
    "results": [
      {
        "totalCost": 147.50,
        "tax": 19.75,
        "duties": 12.75
      },
      {
        "totalCost": 73.25,
        "tax": 9.87,
        "duties": 6.38
      }
    ]
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Endpoint: Countries */}
          {activeTab === 'countries' && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      GET
                    </span>
                    <code style={{
                      fontFamily: 'monospace',
                      fontSize: '16px',
                      color: '#02122c',
                      fontWeight: 'bold',
                      backgroundColor: '#f0f4f8',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      /api/v1/countries
                    </code>
                  </div>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    Get list of supported countries. Public endpoint, no authentication required.
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
              }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>Request</h4>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>No parameters needed</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#02122c', marginBottom: '12px' }}>Response</h4>
                  <div style={{
                    backgroundColor: '#f0f4f8',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: '0', color: '#02122c' }}>
{`{
  "success": true,
  "data": {
    "countries": [
      {
        "code": "US",
        "name": "United States"
      },
      {
        "code": "GB",
        "name": "United Kingdom"
      },
      {
        "code": "DE",
        "name": "Germany"
      }
    ]
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Error Codes */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#02122c',
            marginBottom: '24px'
          }}>
            Error Codes
          </h2>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Code</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Message</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#02122c' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#dc2626' }}>400</td>
                <td style={{ padding: '12px' }}>Bad Request</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Invalid request parameters</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#dc2626' }}>401</td>
                <td style={{ padding: '12px' }}>Unauthorized</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Missing or invalid API key</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#dc2626' }}>403</td>
                <td style={{ padding: '12px' }}>Forbidden</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>API key doesn't have permission</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#dc2626' }}>429</td>
                <td style={{ padding: '12px' }}>Too Many Requests</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Rate limit exceeded</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: '#dc2626' }}>500</td>
                <td style={{ padding: '12px' }}>Server Error</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>Internal server error</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Support CTA */}
        <section style={{
          backgroundColor: '#f0f4f8',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#02122c',
            marginBottom: '12px'
          }}>
            Need Help?
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Check out the playground to test the API interactively or contact our support team.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/developers/playground"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              API Playground
            </a>
            <a
              href="/contact"
              style={{
                backgroundColor: 'transparent',
                color: '#2563eb',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                border: '1px solid #2563eb',
                cursor: 'pointer'
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
              Contact Support
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
