"use client";

import React from 'react';
import { Icons } from '@/components/icons';

// [DATA]
const PARTNERS_DOMESTIC = [
  { name: "Amazon" }, { name: "Walmart" }, { name: "Target" }, { name: "Best Buy" }, { name: "Costco" },
  { name: "eBay" }, { name: "Home Depot" }, { name: "Lowe's" }, { name: "Macy's" }, { name: "Apple" },
  { name: "Nike" }, { name: "Kohl's" }, { name: "Sephora" }, { name: "Chewy" }, { name: "Kroger" },
  { name: "Wayfair" },
];

const PARTNERS_GLOBAL = [
  { name: "AliExpress" }, { name: "Temu" }, { name: "iHerb" }, { name: "DHgate" },
  { name: "YesStyle" }, { name: "Farfetch" }, { name: "ASOS" }, { name: "Uniqlo" }, { name: "Etsy" },
  { name: "MyTheresa" }, { name: "Olive Young" }, { name: "Mercari" },
];

// [COMPONENT] Partner Box — Dark Theme
function PartnerBox({ name }: { name: string }) {
  return (
    <div style={{ width: '50%', padding: '4px', boxSizing: 'border-box' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '44px', background: '#f1f5f9', border: '1px solid #e2e8f0',
        borderRadius: '10px', cursor: 'default',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#02122c' }}>{name}</span>
      </div>
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
          Partners & Affiliate
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Direct integration for accurate pricing & shipping.
        </p>
      </div>

      {/* 2. Partner Lists */}
      <div style={{ padding: '0' }}>

        {/* Domestic */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Domestic</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {PARTNERS_DOMESTIC.map((partner) => (
              <PartnerBox key={partner.name} name={partner.name} />
            ))}
          </div>
        </div>

        {/* Global */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Global</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {PARTNERS_GLOBAL.map((partner) => (
              <PartnerBox key={partner.name} name={partner.name} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0',
          padding: '24px', textAlign: 'center', marginTop: '16px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#02122c', marginBottom: '8px' }}>Are you a retailer?</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>Join our network to reach global shoppers.</p>
          <a href="/help?topic=sell" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 24px', background: '#F59E0B', color: '#ffffff',
            fontSize: '14px', fontWeight: 700, borderRadius: '10px', textDecoration: 'none',
          }}>
            Become a Partner <Icons.ArrowRight style={{ width: '14px', height: '14px' }} />
          </a>
        </div>

        {/* Disclosure */}
        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', lineHeight: '1.6' }}>
          * POTAL may earn an affiliate commission from qualifying purchases. This does not affect our ranking algorithm or the price you pay.
        </p>
      </div>
      </div>
    </div>
  );
}