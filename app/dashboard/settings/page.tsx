'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

const inputStyle: React.CSSProperties = {
  padding: '11px 14px', background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, color: 'white',
  fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, width: '100%',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{title}</div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{description}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 3, flexShrink: 0,
        background: value ? accent : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', position: 'relative',
      }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'transform 0.2s', transform: value ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [name, setName] = useState('Eun-tae Jang');
  const [email, setEmail] = useState('contact@potal.app');
  const [timezone, setTimezone] = useState('Asia/Seoul');
  const [language, setLanguage] = useState('en');
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [retention, setRetention] = useState('90');
  const [emailNotif, setEmailNotif] = useState(true);
  const [webhookNotif, setWebhookNotif] = useState(false);
  const [telegramNotif, setTelegramNotif] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '60px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>SETTINGS</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>User Settings</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 14 }}>Manage your profile, security, and preferences.</p>

        {/* Profile */}
        <SectionCard title="Profile">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} style={selectStyle}>
                {['Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC'].map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={selectStyle}>
                <option value="en">English</option>
                <option value="ko">한국어</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security">
          <Toggle value={twoFA} onChange={setTwoFA} label="Two-Factor Authentication" description="Require TOTP code on every login" />
          <div style={{ paddingTop: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Session Timeout</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: '30', l: '30 min' }, { v: '60', l: '1 hour' }, { v: '240', l: '4 hours' }, { v: '480', l: '8 hours' }, { v: '0', l: 'Never' }].map(opt => (
                <button key={opt.v} onClick={() => setSessionTimeout(opt.v)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${sessionTimeout === opt.v ? 'rgba(232,100,10,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  background: sessionTimeout === opt.v ? 'rgba(232,100,10,0.15)' : 'rgba(0,0,0,0.2)',
                  color: sessionTimeout === opt.v ? accent : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>{opt.l}</button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Data Retention */}
        <SectionCard title="Data Retention Policy">
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 14 }}>How long to keep audit logs, classification history, and API call records.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ v: '30', l: '30 days' }, { v: '90', l: '90 days' }, { v: '180', l: '180 days' }, { v: '365', l: '1 year' }].map(opt => (
              <button key={opt.v} onClick={() => setRetention(opt.v)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10, border: `1px solid ${retention === opt.v ? 'rgba(232,100,10,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: retention === opt.v ? 'rgba(232,100,10,0.15)' : 'rgba(0,0,0,0.2)',
                color: retention === opt.v ? accent : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                <div>{opt.l}</div>
                {opt.v === '30' && <div style={{ fontSize: 10, marginTop: 2, color: 'rgba(255,255,255,0.3)' }}>Default</div>}
                {opt.v === '365' && <div style={{ fontSize: 10, marginTop: 2, color: 'rgba(255,255,255,0.3)' }}>Enterprise</div>}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notifications">
          <Toggle value={emailNotif} onChange={setEmailNotif} label="Email Notifications" description="Alerts for flagged screenings, API errors, usage limits" />
          <Toggle value={webhookNotif} onChange={setWebhookNotif} label="Webhook Notifications" description="POST events to your endpoint in real-time" />
          <Toggle value={telegramNotif} onChange={setTelegramNotif} label="Telegram Bot" description="Receive alerts via Telegram messenger" />
        </SectionCard>

        {/* Save */}
        <button onClick={handleSave} style={{
          width: '100%', padding: '14px', background: saved ? 'rgba(34,197,94,0.7)' : accent,
          color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'background 0.3s',
        }}>
          {saved ? '✓ Settings Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
