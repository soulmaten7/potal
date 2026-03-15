"use client";

import React from 'react';

// [DATA] Platform Metrics
const STATS = [
  { value: "240", label: "Countries", description: "Global duty & tax coverage" },
  { value: "120ms", label: "Avg Response", description: "Real-time API calculations" },
  { value: "99.9%", label: "Uptime SLA", description: "Enterprise-grade reliability" },
  { value: "8,389+", label: "Product-HS Mappings", description: "AI-powered classification" },
];

// [DATA] Core Values
const VALUES = [
  {
    title: "Transparency First",
    description: "Hidden import fees kill conversion. We show buyers the exact duties, taxes, and fees before checkout — no surprises at the border.",
    icon: "🔍"
  },
  {
    title: "Global by Default",
    description: "Cross-border commerce shouldn't be complex. One API call returns landed costs for 240 countries, with FTA detection and de minimis rules built in.",
    icon: "🌐"
  },
  {
    title: "Built for Speed",
    description: "Every millisecond counts at checkout. Our engine calculates duties, taxes, and shipping in under 120ms — fast enough for real-time widget rendering.",
    icon: "⚡"
  }
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }} className="w-full min-h-screen pb-28">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6">

      {/* 1. Hero Section */}
      <div style={{ padding: '80px 0 32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '4px 12px', marginBottom: '16px',
          border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Our Mission</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#02122c', marginBottom: '12px', lineHeight: '1.2' }}>
          Make Cross-Border<br />Commerce Transparent.
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.7', maxWidth: '400px', margin: '0 auto' }}>
          POTAL is a Total Landed Cost API that helps e-commerce sellers show buyers the true cost of international orders — duties, taxes, and fees included.
        </p>
      </div>

      {/* 2. Metrics */}
      <div style={{ padding: '0 0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {STATS.map((stat, index) => (
          <div key={index} style={{
            background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0',
            padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#F59E0B', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#02122c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{stat.label}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{stat.description}</div>
          </div>
        ))}
      </div>

      {/* 3. Story */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0',
          padding: '20px', marginBottom: '12px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>Why we built this.</h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
            International shoppers abandon carts when unexpected fees show up at delivery. Sellers lose revenue and trust. We built POTAL so merchants can show the full landed cost upfront — turning cross-border friction into conversion.
          </p>
        </div>

        {/* Values */}
        <div className="space-y-3">
          {VALUES.map((item, index) => (
            <div key={index} style={{
              background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0',
              padding: '16px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#02122c', marginBottom: '6px' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0',
          padding: '24px', textAlign: 'center', marginTop: '16px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>Start showing true landed costs today.</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Free plan available. Paid plans include a 14-day free trial.</p>
          <a href="/developers" style={{
            display: 'inline-block', padding: '10px 24px', background: '#F59E0B', color: '#ffffff',
            fontSize: '14px', fontWeight: 700, borderRadius: '10px', textDecoration: 'none',
          }}>
            Get Started — Free
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
