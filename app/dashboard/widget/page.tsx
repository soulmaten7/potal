'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' };
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' };

const WIDGET_TYPES = ['Duty Calculator', 'HS Code Lookup', 'Landed Cost Estimator'];
const SIZES = ['Small (300px)', 'Medium (400px)', 'Large (500px)', 'Full Width'];

export default function WidgetConfigPage() {
  const [widgetType, setWidgetType] = useState('Duty Calculator');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [size, setSize] = useState('Medium (400px)');
  const [apiKey, setApiKey] = useState('pk_live_demo_xxx');
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://www.potal.app/widget/potal-widget.js"></script>\n<div\n  data-potal-widget\n  data-api-key="${apiKey}"\n  data-type="${widgetType.toLowerCase().replace(/\s+/g, '-')}"\n  data-theme="${theme}"\n  data-width="${size.match(/\d+/)?.[0] || 'auto'}"\n></div>`;

  function copyCode() { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>INTEGRATION</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Widget Configurator</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Configure and embed the POTAL widget on your website.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Settings</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Widget Type</label><select value={widgetType} onChange={e => setWidgetType(e.target.value)} style={inputStyle}>{WIDGET_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Theme</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTheme('light')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: theme === 'light' ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.15)', background: theme === 'light' ? 'rgba(232,100,10,0.1)' : 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>☀ Light</button>
                <button onClick={() => setTheme('dark')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: theme === 'dark' ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.15)', background: theme === 'dark' ? 'rgba(232,100,10,0.1)' : 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🌙 Dark</button>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Size</label><select value={size} onChange={e => setSize(e.target.value)} style={inputStyle}>{SIZES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label style={labelStyle}>API Key</label><input value={apiKey} onChange={e => setApiKey(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} /></div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Preview</h3>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: theme === 'light' ? '#fff' : '#0d1117' }}>
              <div style={{ padding: '12px 16px', borderBottom: `2px solid ${accent}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: theme === 'light' ? '#02122c' : '#fff' }}>P</span><span style={{ fontSize: 14, fontWeight: 800, color: accent }}>O</span><span style={{ fontSize: 14, fontWeight: 800, color: theme === 'light' ? '#02122c' : '#fff' }}>TAL</span>
                <span style={{ fontSize: 11, color: theme === 'light' ? '#6b7280' : 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{widgetType}</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 8 }}><div style={{ height: 36, borderRadius: 6, background: theme === 'light' ? '#f3f4f6' : 'rgba(255,255,255,0.08)', border: `1px solid ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}` }} /></div>
                <div style={{ marginBottom: 8 }}><div style={{ height: 36, borderRadius: 6, background: theme === 'light' ? '#f3f4f6' : 'rgba(255,255,255,0.08)', border: `1px solid ${theme === 'light' ? '#e5e7eb' : 'rgba(255,255,255,0.1)'}` }} /></div>
                <div style={{ height: 36, borderRadius: 6, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>Calculate</div>
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Embed Code</h3>
            <button onClick={copyCode} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: copied ? 'rgba(74,222,128,0.2)' : accent, color: copied ? '#4ade80' : '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy Code'}</button>
          </div>
          <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 16, fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{embedCode}</pre>
        </div>
      </div>
    </div>
  );
}
