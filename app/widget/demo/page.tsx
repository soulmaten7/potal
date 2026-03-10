'use client';

import Script from 'next/script';

export default function WidgetDemo() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: 1000,
      margin: '0 auto',
      padding: '40px 20px',
      background: '#f5f5f5',
      minHeight: '100vh',
      color: '#1a1a1a',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>POTAL Widget Demo</h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          This simulates a seller&apos;s product page with POTAL widget embedded
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 32,
        background: 'white',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        {/* Product Info */}
        <div>
          <div style={{
            width: '100%',
            height: 250,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 64,
            marginBottom: 20,
          }}>
            👕
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Premium Cotton T-Shirt</h2>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
            $49.99
          </div>
          <div style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            + $8.50 shipping (from China)
          </div>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7 }}>
            High-quality 100% organic cotton t-shirt. Manufactured in Guangzhou, China.
            Available in sizes S-XXL. Ships worldwide via DHL Express.
          </p>
        </div>

        {/* Widget Column */}
        <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: 32 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase' as const,
            letterSpacing: 0.5,
            marginBottom: 12,
          }}>
            Import Cost Calculator
          </div>

          {/* === POTAL WIDGET — Just one div + one script === */}
          <div id="potal-widget"></div>
          <Script
            src="/widget/potal-widget.js"
            data-api-key="pk_live_ghTRbsEvgN7BgbuwI0d4vWOWzFIkLSqgF5BR"
            data-origin="CN"
            data-product-name="Cotton T-Shirt"
            data-price="49.99"
            data-shipping="8.50"
            data-theme="light"
            strategy="afterInteractive"
          />
        </div>
      </div>

      {/* Embed Code Section */}
      <div style={{
        marginTop: 40,
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        color: '#e2e8f0',
      }}>
        <h3 style={{ color: '#93c5fd', marginBottom: 12, fontSize: 14 }}>
          Embed Code (copy &amp; paste into your store)
        </h3>
        <pre style={{
          background: '#0f172a',
          borderRadius: 8,
          padding: 16,
          overflowX: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          <code>{`<div id="potal-widget"></div>
<script src="https://www.potal.app/widget/potal-widget.js"
  data-api-key="YOUR_PUBLISHABLE_KEY"
  data-origin="CN"
  data-product-name="Your Product Name"
  data-price="49.99"
  data-shipping="8.50"
  data-theme="light"></script>`}</code>
        </pre>
      </div>

      {/* Programmatic Usage */}
      <div style={{
        marginTop: 20,
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        color: '#e2e8f0',
      }}>
        <h3 style={{ color: '#93c5fd', marginBottom: 12, fontSize: 14 }}>
          Programmatic Usage (JavaScript API)
        </h3>
        <pre style={{
          background: '#0f172a',
          borderRadius: 8,
          padding: 16,
          overflowX: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          <code>{`<script src="https://www.potal.app/widget/potal-widget.js"></script>
<script>
  PotalWidget.init({ apiKey: 'pk_live_...' });

  // Show widget in a container
  PotalWidget.show('#my-container', {
    productName: 'Cotton T-Shirt',
    price: 49.99,
    shippingPrice: 8.50,
    origin: 'CN'
  });

  // Or just get raw data (headless mode)
  PotalWidget.calculate({
    price: 49.99,
    shippingPrice: 8.50,
    origin: 'CN',
    destination: 'JP'
  }).then(data => console.log(data));
</script>`}</code>
        </pre>
      </div>
    </div>
  );
}
