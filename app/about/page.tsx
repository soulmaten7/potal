"use client";

import React from 'react';
import { Icons } from '@/components/icons';

// [DATA] Tech Metrics
const STATS = [
  { value: "7", label: "Retail Partners", description: "Amazon, Walmart, eBay, BestBuy, Target, AliExpress, Temu" },
  { value: "0.5s", label: "Query Latency", description: "Average search response time" },
  { value: "100%", label: "Data Neutrality", description: "Unbiased algorithm ranking" },
  { value: "24/7", label: "Price Monitoring", description: "Automated deal detection" },
];

// [DATA] Core Values
const VALUES = [
  {
    title: "Algorithmic Transparency",
    description: "We don't hide shipping costs or taxes. Our engine calculates the 'True Landed Cost' instantly, so you never click on fake deals.",
    icon: "🔍"
  },
  {
    title: "Data Sovereignty",
    description: "Commerce data shouldn't be fragmented. We aggregate Amazon, Walmart, eBay, BestBuy, Target, AliExpress, and Temu into a single, unified search layer.",
    icon: "🌐"
  },
  {
    title: "Speed is a Feature",
    description: "Time is money. We removed the clutter—no banners, no popups, no ads. Just the raw data you need to make a decision in seconds.",
    icon: "⚡"
  }
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#02122c' }} className="w-full min-h-screen pb-28">

      {/* 1. Hero Section */}
      <div style={{ padding: '80px 24px 32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', padding: '4px 12px', marginBottom: '16px',
          border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Our Mission</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '12px', lineHeight: '1.2' }}>
          Search Less,<br />Buy Better.
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', maxWidth: '360px', margin: '0 auto' }}>
          POTAL is not a store. It is a decision engine. We de-fragment the global marketplace.
        </p>
      </div>

      {/* 2. Metrics */}
      <div style={{ padding: '0 20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {STATS.map((stat, index) => (
          <div key={index} style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#F59E0B', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{stat.label}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{stat.description}</div>
          </div>
        ))}
      </div>

      {/* 3. Manifesto */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
          padding: '20px', marginBottom: '12px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Why we built this.</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' }}>
            The internet promised open commerce, but today it&apos;s walled gardens. Amazon hides Walmart, AliExpress hides shipping times. We built the bridge.
          </p>
        </div>

        {/* Values */}
        <div className="space-y-3">
          {VALUES.map((item, index) => (
            <div key={index} style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)',
              padding: '16px',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>{item.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px', textAlign: 'center', marginTop: '16px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Built for efficiency, not for ads.</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>We are indexing the world&apos;s products in real-time.</p>
          <a href="/help?topic=sell" style={{
            display: 'inline-block', padding: '10px 24px', background: '#F59E0B', color: '#ffffff',
            fontSize: '14px', fontWeight: 700, borderRadius: '10px', textDecoration: 'none',
          }}>
            Partner with POTAL
          </a>
        </div>
      </div>
    </div>
  );
}