"use client";

import React from 'react';
import { Icons } from '@/components/icons';

// [DATA] Platform Integrations
const PLATFORMS = [
  { name: "Shopify", status: "Live" },
  { name: "WooCommerce", status: "Coming Soon" },
  { name: "Magento", status: "Coming Soon" },
  { name: "BigCommerce", status: "Coming Soon" },
  { name: "Custom Stores", status: "REST API" },
];

// [DATA] Technology Partners
const TECH_PARTNERS = [
  { name: "Supabase", role: "Database & Auth" },
  { name: "Vercel", role: "Hosting & Edge" },
  { name: "Stripe", role: "Billing" },
  { name: "OpenAI", role: "HS Code AI" },
];

function PlatformBox({ name, status }: { name: string; status: string }) {
  const isLive = status === "Live" || status === "REST API";
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: '12px', marginBottom: '8px',
    }}>
      <span style={{ fontSize: '15px', fontWeight: 700, color: '#02122c' }}>{name}</span>
      <span style={{
        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        padding: '4px 10px', borderRadius: '6px',
        background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)',
        color: isLive ? '#10B981' : '#94a3b8',
      }}>
        {status}
      </span>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <div style={{ backgroundColor: '#ffffff' }} className="w-full min-h-screen pb-28">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6">

      {/* 1. Hero Section */}
      <div style={{ padding: '80px 0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>
          Integrations & Partners
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Platforms and technologies that power POTAL.
        </p>
      </div>

      {/* 2. Platform Integrations */}
      <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            E-Commerce Platforms
          </p>
          {PLATFORMS.map((platform) => (
            <PlatformBox key={platform.name} name={platform.name} status={platform.status} />
          ))}
        </div>

        {/* 3. Technology Partners */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Technology Partners
          </p>
          {TECH_PARTNERS.map((partner) => (
            <div key={partner.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '12px', marginBottom: '8px',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#02122c' }}>{partner.name}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{partner.role}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0',
          padding: '24px', textAlign: 'center', marginTop: '16px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>Want to integrate POTAL?</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Build a plugin, embed our widget, or use our REST API.</p>
          <a href="/developers" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 24px', background: '#F59E0B', color: '#ffffff',
            fontSize: '14px', fontWeight: 700, borderRadius: '10px', textDecoration: 'none',
          }}>
            View Developer Docs <Icons.ArrowRight style={{ width: '14px', height: '14px' }} />
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}
