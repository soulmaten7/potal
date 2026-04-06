'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' };
const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.1)' };

export default function BrandingPage() {
  const [companyName, setCompanyName] = useState('My Store');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#02122c');
  const [accentColor, setAccentColor] = useState('#E8640A');
  const [customDomain, setCustomDomain] = useState('');

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CUSTOMIZATION</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>White-label & Branding</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 28 }}>Customize the widget and portal appearance to match your brand.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Brand Settings</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} style={inputStyle} /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Logo URL</label><input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div><label style={labelStyle}>Primary Color</label><div style={{ display: 'flex', gap: 8 }}><input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} /><input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} /></div></div>
              <div><label style={labelStyle}>Accent Color</label><div style={{ display: 'flex', gap: 8 }}><input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }} /><input value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} /></div></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Custom Domain</label><input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="duties.mystore.com" style={inputStyle} /></div>
            <button style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Branding</button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Live Preview</h3>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ background: primaryColor, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                {logoUrl ? <img src={logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 28, height: 28, borderRadius: 6, background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{companyName[0]}</div>}
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{companyName}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Duty Calculator Widget</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Import Duty</span><span style={{ fontSize: 14, fontWeight: 700 }}>$12.50</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Tax (VAT)</span><span style={{ fontSize: 14, fontWeight: 700 }}>$8.30</span></div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 700 }}>Total Landed Cost</span><span style={{ fontSize: 18, fontWeight: 800, color: accentColor }}>$120.80</span></div>
                <button style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 8, border: 'none', background: accentColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Calculate</button>
              </div>
              <div style={{ padding: '8px 20px', fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Powered by {companyName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
