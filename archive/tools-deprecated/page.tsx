'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/app/i18n';

const accent = '#E8640A';

interface Tool {
  nameKey: string;
  descKey: string;
  catKey: string;
  category: string;
  href: string;
}

const TOOLS: Tool[] = [
  { nameKey: 'tools.screening', descKey: 'tools.screening.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/screening' },
  { nameKey: 'tools.exportControls', descKey: 'tools.exportControls.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/export-controls' },
  { nameKey: 'tools.eccn', descKey: 'tools.eccn.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/classify-eccn' },
  { nameKey: 'tools.dualUse', descKey: 'tools.dualUse.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/dual-use' },
  { nameKey: 'tools.embargo', descKey: 'tools.embargo.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/embargo' },
  { nameKey: 'tools.restrictions', descKey: 'tools.restrictions.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/restrictions' },
  { nameKey: 'tools.preShipment', descKey: 'tools.preShipment.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/pre-shipment' },
  { nameKey: 'tools.complianceReport', descKey: 'tools.complianceReport.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/compliance-report' },
  { nameKey: 'tools.antiDumping', descKey: 'tools.antiDumping.desc', catKey: 'tools.cat.compliance', category: 'Compliance', href: '/tools/anti-dumping' },
  { nameKey: 'tools.ics2', descKey: 'tools.ics2.desc', catKey: 'tools.cat.customs', category: 'Customs', href: '/tools/ics2' },
  { nameKey: 'tools.type86', descKey: 'tools.type86.desc', catKey: 'tools.cat.customs', category: 'Customs', href: '/tools/type86' },
  { nameKey: 'tools.customsForms', descKey: 'tools.customsForms.desc', catKey: 'tools.cat.customs', category: 'Customs', href: '/tools/customs-forms' },
  { nameKey: 'tools.customsDocs', descKey: 'tools.customsDocs.desc', catKey: 'tools.cat.customs', category: 'Customs', href: '/tools/customs-docs' },
  { nameKey: 'tools.deMinimis', descKey: 'tools.deMinimis.desc', catKey: 'tools.cat.customs', category: 'Customs', href: '/tools/de-minimis' },
  { nameKey: 'tools.hsLookup', descKey: 'tools.hsLookup.desc', catKey: 'tools.cat.classification', category: 'Classification', href: '/tools/hs-lookup' },
  { nameKey: 'tools.imageClassify', descKey: 'tools.imageClassify.desc', catKey: 'tools.cat.classification', category: 'Classification', href: '/tools/image-classify' },
  { nameKey: 'tools.batchClassify', descKey: 'tools.batchClassify.desc', catKey: 'tools.cat.classification', category: 'Classification', href: '/tools/batch' },
  { nameKey: 'tools.fta', descKey: 'tools.fta.desc', catKey: 'tools.cat.trade', category: 'Trade', href: '/tools/fta' },
  { nameKey: 'tools.compare', descKey: 'tools.compare.desc', catKey: 'tools.cat.trade', category: 'Trade', href: '/tools/compare' },
  { nameKey: 'tools.currency', descKey: 'tools.currency.desc', catKey: 'tools.cat.trade', category: 'Trade', href: '/tools/currency' },
  { nameKey: 'tools.tax', descKey: 'tools.tax.desc', catKey: 'tools.cat.tax', category: 'Tax', href: '/tools/tax' },
  { nameKey: 'tools.vatCheck', descKey: 'tools.vatCheck.desc', catKey: 'tools.cat.tax', category: 'Tax', href: '/tools/vat-check' },
  { nameKey: 'tools.taxExemptions', descKey: 'tools.taxExemptions.desc', catKey: 'tools.cat.tax', category: 'Tax', href: '/tools/tax-exemptions' },
  { nameKey: 'tools.digitalTax', descKey: 'tools.digitalTax.desc', catKey: 'tools.cat.tax', category: 'Tax', href: '/tools/digital-tax' },
  { nameKey: 'tools.ioss', descKey: 'tools.ioss.desc', catKey: 'tools.cat.tax', category: 'Tax', href: '/tools/ioss' },
  { nameKey: 'tools.ddp', descKey: 'tools.ddp.desc', catKey: 'tools.cat.shipping', category: 'Shipping', href: '/tools/ddp-calculator' },
  { nameKey: 'tools.shipping', descKey: 'tools.shipping.desc', catKey: 'tools.cat.shipping', category: 'Shipping', href: '/tools/shipping' },
  { nameKey: 'tools.returns', descKey: 'tools.returns.desc', catKey: 'tools.cat.shipping', category: 'Shipping', href: '/tools/returns' },
  { nameKey: 'tools.labelGen', descKey: 'tools.labelGen.desc', catKey: 'tools.cat.shipping', category: 'Shipping', href: '/tools/label-generation' },
  { nameKey: 'tools.pdfReports', descKey: 'tools.pdfReports.desc', catKey: 'tools.cat.documentation', category: 'Documentation', href: '/tools/pdf-reports' },
  { nameKey: 'tools.eInvoice', descKey: 'tools.eInvoice.desc', catKey: 'tools.cat.documentation', category: 'Documentation', href: '/tools/e-invoice' },
  { nameKey: 'tools.checkout', descKey: 'tools.checkout.desc', catKey: 'tools.cat.integration', category: 'Integration', href: '/tools/checkout' },
  { nameKey: 'tools.csvExport', descKey: 'tools.csvExport.desc', catKey: 'tools.cat.export', category: 'Export', href: '/tools/csv-export' },
  { nameKey: 'tools.countryDb', descKey: 'tools.countryDb.desc', catKey: 'tools.cat.reference', category: 'Reference', href: '/tools/countries' },
];

const CATEGORY_KEYS: { id: string; key: string }[] = [
  { id: 'All', key: 'tools.cat.all' },
  ...Array.from(new Set(TOOLS.map(t => t.category))).map(c => ({
    id: c,
    key: `tools.cat.${c.toLowerCase()}`,
  })),
];

const categoryColor: Record<string, string> = {
  Compliance: '#f87171', Customs: '#fb923c', Classification: '#a78bfa', Trade: '#60a5fa',
  Tax: '#facc15', Shipping: '#4ade80', Documentation: '#94a3b8', Integration: '#e879f9',
  Export: '#22d3ee', Reference: '#34d399',
};

export default function ToolsHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { t } = useI18n();

  const filtered = TOOLS.filter(tool => {
    const name = t(tool.nameKey as any);
    const desc = t(tool.descKey as any);
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || tool.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1e3d 0%, #1a365d 100%)', color: 'white', padding: '80px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{t('tools.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            {t('tools.subtitle').replace('{count}', String(TOOLS.length))}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('tools.searchPlaceholder')} style={{
            padding: '10px 16px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10, color: 'white', fontSize: 14, outline: 'none', width: 250,
          }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORY_KEYS.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: category === c.id ? accent : 'rgba(255,255,255,0.08)', color: category === c.id ? 'white' : 'rgba(255,255,255,0.5)',
              }}>{t(c.key as any)}</button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textAlign: 'center' }}>
          {(filtered.length === 1 ? t('tools.toolCountSingle') : t('tools.toolCount')).replace('{count}', String(filtered.length))}
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
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{t(tool.nameKey as any)}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${categoryColor[tool.category] || '#94a3b8'}20`, color: categoryColor[tool.category] || '#94a3b8', fontWeight: 600 }}>
                    {t(tool.catKey as any)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  {t(tool.descKey as any)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
