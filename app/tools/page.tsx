'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const accent = '#E8640A';

interface Tool {
  name: string;
  description: string;
  category: string;
  href: string;
}

const TOOLS: Tool[] = [
  // Compliance
  { name: 'Denied Party Screening', description: 'Screen against OFAC SDN, BIS Entity List, EU/UK/UN sanctions with fuzzy matching.', category: 'Compliance', href: '/tools/screening' },
  { name: 'Export Controls', description: 'EAR/ITAR classification and export license determination.', category: 'Compliance', href: '/tools/export-controls' },
  { name: 'ECCN Classification', description: 'Classify products under the EAR Commerce Control List with ECCN candidates.', category: 'Compliance', href: '/tools/classify-eccn' },
  { name: 'Dual-Use Goods Check', description: 'Check dual-use status under EAR, EU, and Wassenaar Arrangement.', category: 'Compliance', href: '/tools/dual-use' },
  { name: 'Trade Embargo Check', description: 'Check if trade is permitted between two countries.', category: 'Compliance', href: '/tools/embargo' },
  { name: 'Import Restrictions', description: 'Check product restrictions, licensing requirements, and prohibitions.', category: 'Compliance', href: '/tools/restrictions' },
  { name: 'Pre-Shipment Verification', description: 'All-in-one compliance check: sanctions, restrictions, documents, and duties.', category: 'Compliance', href: '/tools/pre-shipment' },
  { name: 'Compliance Report', description: 'Generate compliance audit report for a shipment.', category: 'Compliance', href: '/tools/compliance-report' },
  { name: 'Anti-Dumping Check', description: 'Check anti-dumping and countervailing duty orders.', category: 'Compliance', href: '/tools/anti-dumping' },

  // Customs
  { name: 'ICS2 Pre-arrival Filing', description: 'Validate ICS2 Entry Summary Declaration data for EU-bound shipments.', category: 'Customs', href: '/tools/ics2' },
  { name: 'Type 86 Entry', description: 'Section 321 de minimis eligibility and Type 86 informal entry check.', category: 'Customs', href: '/tools/type86' },
  { name: 'Customs Forms Generator', description: 'Generate customs declarations, invoices, and packing lists.', category: 'Customs', href: '/tools/customs-forms' },
  { name: 'Customs Documentation', description: 'Generate customs documents based on destination requirements.', category: 'Customs', href: '/tools/customs-docs' },
  { name: 'De Minimis Check', description: 'Check duty-free thresholds for any country.', category: 'Customs', href: '/tools/de-minimis' },

  // Classification
  { name: 'HS Code Lookup', description: 'Classify products into HS codes using 9-field input.', category: 'Classification', href: '/tools/hs-lookup' },
  { name: 'Image Classification', description: 'Classify products from uploaded images.', category: 'Classification', href: '/tools/image-classify' },
  { name: 'Batch Classification', description: 'Classify multiple products via CSV upload.', category: 'Classification', href: '/tools/batch' },

  // Trade
  { name: 'FTA Lookup', description: 'Find Free Trade Agreements between countries and calculate savings.', category: 'Trade', href: '/tools/fta' },
  { name: 'Multi-Country Comparison', description: 'Compare landed costs across multiple destination countries.', category: 'Trade', href: '/tools/compare' },
  { name: 'Currency Converter', description: 'Real-time exchange rates with ECB daily reference data.', category: 'Trade', href: '/tools/currency' },

  // Tax
  { name: 'Tax Calculator', description: 'US sales tax, VAT/GST, and digital services tax calculation.', category: 'Tax', href: '/tools/tax' },
  { name: 'VAT Registration Check', description: 'Verify VAT registration numbers across EU member states.', category: 'Tax', href: '/tools/vat-check' },
  { name: 'Tax Exemptions', description: 'Check available tax exemptions and reduced rates.', category: 'Tax', href: '/tools/tax-exemptions' },
  { name: 'Digital Services Tax', description: 'Calculate digital services tax for online transactions.', category: 'Tax', href: '/tools/digital-tax' },
  { name: 'IOSS Calculator', description: 'EU Import One-Stop Shop VAT calculation.', category: 'Tax', href: '/tools/ioss' },

  // Shipping
  { name: 'DDP vs DDU Calculator', description: 'Compare Delivered Duty Paid vs Delivered Duty Unpaid costs.', category: 'Shipping', href: '/tools/ddp-calculator' },
  { name: 'Shipping Rates', description: 'Estimate shipping costs with carrier rate comparison.', category: 'Shipping', href: '/tools/shipping' },
  { name: 'Returns Calculator', description: 'Calculate return shipping costs and duty drawback eligibility.', category: 'Shipping', href: '/tools/returns' },
  { name: 'Label Generation', description: 'Generate shipping labels with customs information.', category: 'Shipping', href: '/tools/label-generation' },

  // Documentation
  { name: 'PDF Trade Documents', description: 'Generate professional trade documents as downloadable PDFs.', category: 'Documentation', href: '/tools/pdf-reports' },
  { name: 'E-Invoice Generator', description: 'Generate EU-compliant electronic invoices.', category: 'Documentation', href: '/tools/e-invoice' },

  // Integration
  { name: 'Checkout Demo', description: 'Preview a real checkout with duties, taxes, and total landed cost.', category: 'Integration', href: '/tools/checkout' },

  // Export
  { name: 'CSV Batch Export', description: 'Upload CSV, calculate landed costs, and download results.', category: 'Export', href: '/tools/csv-export' },

  // Reference
  { name: 'Country Database', description: 'Browse 240 countries with duty rates, VAT, de minimis, and FTA data.', category: 'Reference', href: '/tools/countries' },
];

const CATEGORIES = ['All', ...Array.from(new Set(TOOLS.map(t => t.category)))];

const categoryColor: Record<string, string> = {
  Compliance: '#f87171', Customs: '#fb923c', Classification: '#a78bfa', Trade: '#60a5fa',
  Tax: '#facc15', Shipping: '#4ade80', Documentation: '#94a3b8', Integration: '#e879f9',
  Export: '#22d3ee', Reference: '#34d399',
};

export default function ToolsHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = TOOLS.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || t.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Trade Tools</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            {TOOLS.length} free tools for cross-border commerce. No sign-up required.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..." style={{
            padding: '10px 16px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', width: 250,
          }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: category === c ? accent : 'rgba(255,255,255,0.08)', color: category === c ? 'white' : 'rgba(255,255,255,0.5)',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textAlign: 'center' }}>
          {filtered.length} tool{filtered.length !== 1 ? 's' : ''}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(tool => (
            <Link key={tool.href} href={tool.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 20,
                border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{tool.name}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${categoryColor[tool.category] || '#94a3b8'}20`, color: categoryColor[tool.category] || '#94a3b8', fontWeight: 600 }}>
                    {tool.category}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  {tool.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
