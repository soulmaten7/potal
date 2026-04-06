'use client';

import React, { useState } from 'react';

const bg = '#0a1e3d';
const accent = '#E8640A';

type PayoutStatus = 'paid' | 'pending' | 'processing';
type ReferralStatus = 'active' | 'trial' | 'churned';

interface Referral {
  company: string;
  signupDate: string;
  plan: string;
  status: ReferralStatus;
  commission: number;
}

interface Payout {
  period: string;
  amount: number;
  status: PayoutStatus;
  date: string;
}

const REFERRALS: Referral[] = [
  { company: 'Nexus Logistics GmbH', signupDate: '2026-03-12', plan: 'Pro', status: 'active', commission: 84 },
  { company: 'TradeFlow Inc.', signupDate: '2026-03-08', plan: 'Pro', status: 'active', commission: 84 },
  { company: 'ClearPath Customs', signupDate: '2026-02-24', plan: 'Pro', status: 'active', commission: 84 },
  { company: 'SwiftImport AU', signupDate: '2026-02-17', plan: 'Pro', status: 'active', commission: 84 },
  { company: 'Borderless Co.', signupDate: '2026-02-03', plan: 'Free', status: 'trial', commission: 0 },
  { company: 'PeakShip Korea', signupDate: '2026-01-28', plan: 'Pro', status: 'churned', commission: 0 },
];

const PAYOUTS: Payout[] = [
  { period: 'March 2026', amount: 336, status: 'processing', date: '2026-04-05' },
  { period: 'February 2026', amount: 252, status: 'paid', date: '2026-03-05' },
  { period: 'January 2026', amount: 168, status: 'paid', date: '2026-02-05' },
  { period: 'December 2025', amount: 84, status: 'paid', date: '2026-01-05' },
];

const REF_STATUS_CFG: Record<ReferralStatus, { bg: string; color: string; label: string }> = {
  active:  { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'Active' },
  trial:   { bg: 'rgba(234,179,8,0.15)', color: '#facc15', label: 'Trial' },
  churned: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: 'Churned' },
};

const PAY_STATUS_CFG: Record<PayoutStatus, { bg: string; color: string; label: string }> = {
  paid:       { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'Paid' },
  pending:    { bg: 'rgba(234,179,8,0.15)', color: '#facc15', label: 'Pending' },
  processing: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', label: 'Processing' },
};

export default function PartnerPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'POTAL-ET2026';
  const referralLink = `https://potal.app/?ref=${referralCode}`;

  const totalEarned = PAYOUTS.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = PAYOUTS.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);
  const activeReferrals = REFERRALS.filter(r => r.status === 'active').length;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${bg} 0%, #1a365d 100%)`, color: 'white', padding: '60px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(232,100,10,0.2)', color: accent, padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>PARTNER</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Partner Portal</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontSize: 14 }}>Track referrals, commissions, and payout history.</p>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Referrals', value: REFERRALS.length, color: 'white' },
            { label: 'Active Partners', value: activeReferrals, color: '#4ade80' },
            { label: 'Total Earned', value: `$${totalEarned}`, color: accent },
            { label: 'Pending Payout', value: `$${pendingAmount}`, color: '#a5b4fc' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 12, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Referral link card */}
        <div style={{ background: 'rgba(232,100,10,0.08)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(232,100,10,0.2)', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: accent }}>Your Referral Link</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280, background: 'rgba(0,0,0,0.3)', borderRadius: 9, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {referralLink}
            </div>
            <button onClick={copyLink} style={{
              padding: '10px 20px', background: copied ? 'rgba(34,197,94,0.2)' : accent,
              border: 'none', borderRadius: 9, color: copied ? '#4ade80' : 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '10px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              Code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: accent }}>{referralCode}</span>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            Earn $21/month per referred Pro subscriber. Paid monthly via bank transfer or PayPal.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18 }}>
          {/* Referrals table */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Referred Companies</div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 60px 70px', gap: 8, padding: '10px 16px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
                <span>Company</span><span>Signed Up</span><span>Plan</span><span style={{ textAlign: 'center' }}>Status</span><span style={{ textAlign: 'right' }}>Commission</span>
              </div>
              {REFERRALS.map((r, i) => {
                const sc = REF_STATUS_CFG[r.status];
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 90px 80px 60px 70px', gap: 8,
                    padding: '12px 16px', borderBottom: i < REFERRALS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.company}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.signupDate.slice(5)}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{r.plan}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: sc.bg, color: sc.color, textAlign: 'center' }}>{sc.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.commission > 0 ? '#4ade80' : 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
                      {r.commission > 0 ? `$${r.commission}/mo` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payout history */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Payout History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYOUTS.map((p, i) => {
                const pc = PAY_STATUS_CFG[p.status];
                return (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.period}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{p.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: p.status === 'paid' ? '#4ade80' : 'white' }}>${p.amount}</div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: pc.bg, color: pc.color }}>{pc.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
