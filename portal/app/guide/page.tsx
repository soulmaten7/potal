"use client";

import React, { useState } from 'react';

// ─── Field Data ───

interface FieldSpec {
  id: string;
  title: string;
  required: boolean;
  legalBasis: string;
  accuracyImpact: string;
  accuracyPct: number;
  format: string;
  validation: { rule: string; type: 'error' | 'warning' }[];
  examples: string[];
  commonMistakes: { wrong: string; correct: string }[];
  description: string;
}

const FIELDS: FieldSpec[] = [
  {
    id: 'product_name',
    title: 'Product Name',
    required: true,
    legalBasis: 'Customs Declaration — every country requires a product description for import',
    accuracyImpact: '+18% accuracy',
    accuracyPct: 18,
    format: 'Product title as listed on your store (minimum 2 characters)',
    validation: [
      { rule: 'Empty or less than 2 characters → Error (classification impossible)', type: 'error' },
    ],
    examples: ["Men's Cotton T-Shirt", 'Wireless Bluetooth Earbuds', 'Stainless Steel Water Bottle'],
    commonMistakes: [
      { wrong: 'T-shirt', correct: "Men's Short-Sleeve Cotton T-Shirt (more specific = more accurate)" },
      { wrong: 'SKU-12345', correct: 'Use the actual product name, not internal codes' },
    ],
    description: 'The product name is the anchor for classification. It tells us WHAT the product is. More descriptive names lead to more accurate HS Code classification.',
  },
  {
    id: 'material',
    title: 'Material',
    required: true,
    legalBasis: 'WCO Harmonized System — 21 Sections organized by material (Sections I–XV are material-based)',
    accuracyImpact: '+45% accuracy (CRITICAL)',
    accuracyPct: 45,
    format: 'Primary material from WCO standard list (91 material groups covering all 21 Sections)',
    validation: [
      { rule: 'Empty → Error (required field)', type: 'error' },
      { rule: 'Not matching any of 91 WCO material groups → Error + closest match suggestion', type: 'error' },
    ],
    examples: ['cotton', 'polyester', 'steel', 'leather', 'plastic', 'wood', 'glass', 'ceramic', 'rubber', 'gold'],
    commonMistakes: [
      { wrong: 'Alloy', correct: 'steel or aluminum (specify base metal)' },
      { wrong: 'Mixed', correct: 'Specify primary material (>50% by weight)' },
      { wrong: 'N/A', correct: 'Every physical product has a material' },
      { wrong: 'Blend', correct: '85% cotton, 15% polyester (use composition field for blend details)' },
    ],
    description: 'Material is the single most important field for HS Code classification. The WCO Harmonized System organizes Sections I through XV by material — leather products go to Section VIII, textiles to Section XI, metals to Section XV. Without the correct material, the system cannot determine even the basic Section, causing a ~45% accuracy drop.',
  },
  {
    id: 'origin_country',
    title: 'Origin Country',
    required: true,
    legalBasis: 'ISO 3166-1 alpha-2 — international standard for country codes (240 countries/territories)',
    accuracyImpact: 'Required for 7-10 digit HS code + duty rates',
    accuracyPct: 0,
    format: 'ISO 3166-1 alpha-2 code (2 uppercase letters)',
    validation: [
      { rule: 'Empty → Error (required for duty rate lookup)', type: 'error' },
      { rule: 'Common names auto-corrected: "China" → CN, "USA" → US, "UK" → GB', type: 'error' },
      { rule: 'Not in ISO 3166-1 list → Error', type: 'error' },
    ],
    examples: ['US', 'CN', 'DE', 'JP', 'KR', 'VN', 'IN', 'MX', 'GB'],
    commonMistakes: [
      { wrong: 'China', correct: 'CN' },
      { wrong: 'USA', correct: 'US' },
      { wrong: 'UK', correct: 'GB' },
      { wrong: 'Korea', correct: 'KR' },
    ],
    description: 'The origin country determines which national tariff schedule applies. Different countries have different 7-10 digit extensions of the universal 6-digit HS code. It also determines applicable Free Trade Agreements (FTAs), anti-dumping duties, and de minimis thresholds.',
  },
  {
    id: 'category',
    title: 'Category',
    required: false,
    legalBasis: 'WCO 97 Chapters — the international legal classification structure (+ common platform terms)',
    accuracyImpact: '+33% accuracy',
    accuracyPct: 33,
    format: 'WCO Chapter description or common product category',
    validation: [
      { rule: 'Empty → Warning (accuracy +33% if provided)', type: 'warning' },
      { rule: 'Must contain at least one WCO Chapter keyword or common platform term', type: 'error' },
      { rule: 'Unrecognized category → Error + closest match suggestion (Levenshtein)', type: 'error' },
    ],
    examples: ['Clothing', 'Electronics', 'Furniture', 'Toys', 'Footwear', 'Jewelry', 'Pharmaceutical products'],
    commonMistakes: [
      { wrong: 'Random Stuff', correct: 'Use WCO Chapter terms: Clothing, Footwear, Furniture, etc.' },
      { wrong: 'Misc', correct: 'Specify the product type: Toys, Electronics, etc.' },
      { wrong: 'Accessories', correct: "Be specific: 'Jewelry', 'Bags', 'Watch accessories'" },
    ],
    description: 'Category tells the system the FUNCTION of the product. While material tells us WHAT it\'s made of (leather → Section VIII), category tells us WHAT IT IS (a watch strap → Section XVIII Instruments). This resolves the "material vs function" ambiguity — a leather watch strap is classified under watches, not leather goods. Categories are based on WCO\'s 97 Chapter descriptions, the international legal standard.',
  },
  {
    id: 'description',
    title: 'Description',
    required: false,
    legalBasis: 'Customs Declaration Standard — meaningful product description for import declaration',
    accuracyImpact: '+5% accuracy',
    accuracyPct: 5,
    format: 'Customs declaration style: meaningful product description (minimum 10 characters, at least 5 alphabetic characters)',
    validation: [
      { rule: 'Empty → OK (optional field)', type: 'warning' },
      { rule: 'Less than 10 characters → Warning (too short for customs)', type: 'warning' },
      { rule: 'Less than 5 alphabetic characters → Warning (not meaningful text)', type: 'warning' },
    ],
    examples: [
      'Short-sleeve crew-neck cotton t-shirt, screen printed graphic',
      'Wireless bluetooth earbuds with charging case, noise cancelling',
    ],
    commonMistakes: [
      { wrong: 'T-shirt XL Blue', correct: "Short-sleeve crew-neck cotton t-shirt, men's, screen printed" },
      { wrong: '12345-ABC', correct: 'Use product description, not codes or SKUs' },
    ],
    description: 'Description provides additional context that helps distinguish between similar HS headings. Write it like a customs declaration — describe the product\'s physical characteristics, use, and distinguishing features. This field adds ~5% accuracy at the Heading level.',
  },
  {
    id: 'processing',
    title: 'Processing',
    required: false,
    legalBasis: 'WCO HS Nomenclature — manufacturing method distinctions (e.g., Ch.61 knitted vs Ch.62 woven)',
    accuracyImpact: 'Heading distinction (knitted vs woven)',
    accuracyPct: 0,
    format: 'Manufacturing method keyword',
    validation: [
      { rule: 'Empty → OK (optional)', type: 'warning' },
      { rule: 'Not matching standard processing terms → Warning + valid examples', type: 'warning' },
    ],
    examples: ['knitted', 'woven', 'forged', 'cast', 'molded', 'frozen', 'dried'],
    commonMistakes: [
      { wrong: 'Made in factory', correct: 'knitted, woven, forged, cast (specific method)' },
      { wrong: 'Handmade', correct: 'hand-knitted, hand-woven (specify the actual process)' },
    ],
    description: 'Processing method determines the HS Heading within a Chapter. For textiles, "knitted" goes to Chapter 61 while "woven" goes to Chapter 62 — same material (cotton), different classification. For metals, "forged" vs "cast" can change the heading.',
  },
  {
    id: 'composition',
    title: 'Composition',
    required: false,
    legalBasis: 'WCO Subheading Notes — percentage-based material breakdown determines subheading',
    accuracyImpact: 'Subheading distinction (cotton vs blend)',
    accuracyPct: 0,
    format: 'Percentage breakdown (must sum to ≤100%)',
    validation: [
      { rule: 'Empty → OK (optional)', type: 'warning' },
      { rule: 'Percentages sum exceeds 100% → Warning', type: 'warning' },
    ],
    examples: ['100% cotton', '85% cotton, 15% polyester', 'leather upper, rubber outsole'],
    commonMistakes: [
      { wrong: 'Cotton blend', correct: '85% cotton, 15% polyester (specify percentages)' },
      { wrong: '60% cotton 50% polyester', correct: 'Percentages must sum to 100% or less' },
    ],
    description: 'Composition determines the HS Subheading (6th digit). "100% cotton" and "85% cotton, 15% polyester" may have the same Heading but different Subheadings, which means different duty rates. The WCO uses specific percentage thresholds (e.g., "containing 85% or more by weight of cotton").',
  },
  {
    id: 'weight_spec',
    title: 'Weight / Specification',
    required: false,
    legalBasis: 'SI Units (International System) + WCO trade units — standardized measurement for tariff splits',
    accuracyImpact: 'Weight-based tariff distinctions',
    accuracyPct: 0,
    format: 'Number + SI unit or trade unit (70+ recognized units)',
    validation: [
      { rule: 'Empty → OK (optional)', type: 'warning' },
      { rule: 'Must be "number + unit" format', type: 'warning' },
      { rule: 'Unrecognized unit → Warning + closest match suggestion', type: 'warning' },
    ],
    examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '2000mAh', '50W'],
    commonMistakes: [
      { wrong: 'heavy', correct: '5kg (use number + unit)' },
      { wrong: '200', correct: '200g or 200ml (always include the unit)' },
    ],
    description: 'Weight and specifications are used for tariff splits in the HS system. For example, paper is classified differently based on weight per square meter (g/m²), and textiles have different tariff rates based on thread count or weight. Always use recognized SI or trade units.',
  },
  {
    id: 'price',
    title: 'Price (USD)',
    required: false,
    legalBasis: 'WTO Customs Valuation Agreement — transaction value in USD for price-break tariff rules',
    accuracyImpact: 'Price-break tariff rules ("valued over/under $X")',
    accuracyPct: 0,
    format: 'Positive number in USD (the system converts to local currency automatically)',
    validation: [
      { rule: 'Empty → OK (optional)', type: 'warning' },
      { rule: 'Not a number or NaN → Error', type: 'error' },
      { rule: 'Zero or negative → Error', type: 'error' },
      { rule: 'Over $1,000,000 → Warning (verify unit price)', type: 'warning' },
    ],
    examples: ['9.99', '49.99', '199.00'],
    commonMistakes: [
      { wrong: '$49.99', correct: '49.99 (number only, no currency symbol)' },
      { wrong: '¥5000', correct: '35.00 (convert to USD)' },
      { wrong: '0', correct: 'Must be a positive value' },
    ],
    description: 'Price determines "price-break" tariff rules in the HS system. Many HS codes have different duty rates based on value — for example, "valued not over $5 per dozen" vs "valued over $5 per dozen." Always provide the unit price in USD; the system handles currency conversion for landed cost calculation.',
  },
];

// ─── Accepted Weight Units ───

const UNIT_GROUPS = [
  { label: 'Mass', units: 'kg, g, mg, t, lb, lbs, oz, ct, carat' },
  { label: 'Length', units: 'm, cm, mm, km, in, inch, inches, ft, feet, yd, yard, yards' },
  { label: 'Area', units: 'm², cm², mm², sqm, sqft, sqin' },
  { label: 'Volume', units: 'l, ml, cl, gal, gallon, qt, quart, pt, pint' },
  { label: 'Density', units: 'g/m², gsm, oz/yd², kg/m³' },
  { label: 'Textile', units: 'den, denier, dtex, tex' },
  { label: 'Electrical', units: 'V, W, kW, A, mAh, Wh, kWh' },
  { label: 'Count', units: 'pcs, pc, piece, pair, set, dozen, doz, gross, ream, bbl, barrel' },
];

// ─── WCO 21 Sections ───

const WCO_SECTIONS = [
  { num: 'I', name: 'Live Animals, Animal Products', materials: 'meat, dairy, seafood, egg, honey, animal, fur' },
  { num: 'II', name: 'Vegetable Products', materials: 'plant, grain, fruit, seed, tea, coffee, spice, tobacco' },
  { num: 'III', name: 'Fats, Oils, Waxes', materials: 'oil, fat, wax' },
  { num: 'IV', name: 'Prepared Foodstuffs', materials: 'sugar, chocolate, flour, beverage, alcohol' },
  { num: 'V', name: 'Mineral Products', materials: 'mineral, cement, salt, petroleum, coal, sand' },
  { num: 'VI', name: 'Chemical Products', materials: 'chemical, pharmaceutical, soap, cosmetic, fertilizer, explosive' },
  { num: 'VII', name: 'Plastics and Rubber', materials: 'plastic, rubber, foam, resin' },
  { num: 'VIII', name: 'Leather and Hides', materials: 'leather, hide, fur' },
  { num: 'IX', name: 'Wood and Cork', materials: 'wood, bamboo' },
  { num: 'X', name: 'Paper and Pulp', materials: 'paper, cardboard' },
  { num: 'XI', name: 'Textiles', materials: 'cotton, polyester, silk, wool, nylon, linen' },
  { num: 'XII', name: 'Footwear, Headgear', materials: 'footwear, headgear, umbrella' },
  { num: 'XIII', name: 'Stone, Ceramic, Glass', materials: 'stone, ceramic, glass' },
  { num: 'XIV', name: 'Precious Metals, Jewelry', materials: 'gold, silver, platinum, pearl, diamond, jewelry' },
  { num: 'XV', name: 'Base Metals', materials: 'steel, iron, aluminum, copper, zinc, tin, titanium' },
  { num: 'XVI', name: 'Machinery and Electrical', materials: 'machinery, electronic, battery' },
  { num: 'XVII', name: 'Vehicles', materials: 'vehicle, bicycle, aircraft, ship, tire' },
  { num: 'XVIII', name: 'Instruments', materials: 'optical, medical, watch, musical' },
  { num: 'XIX', name: 'Arms and Ammunition', materials: 'weapon' },
  { num: 'XX', name: 'Miscellaneous', materials: 'furniture, toy, sports, lamp, brush, candle' },
  { num: 'XXI', name: 'Works of Art', materials: 'art' },
];

// ─── Component ───

export default function GuidePage() {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showSections, setShowSections] = useState(false);
  const [showUnits, setShowUnits] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 24px' }}>
        <a href="/" style={{ color: '#F59E0B', textDecoration: 'none', fontSize: 14 }}>← Back to POTAL</a>

        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginTop: 24, marginBottom: 8 }}>
          Classification Guide
        </h1>
        <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 700 }}>
          9-field input standards for HS Code classification. Each field is validated against
          international legal standards (WCO, ISO, SI) to achieve <strong style={{ color: '#10b981' }}>100% classification accuracy</strong>.
        </p>

        {/* Accuracy formula */}
        <div style={{
          marginTop: 24, padding: 20, borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(245,158,11,0.1))',
          border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>ACCURACY FORMULA (466-combination Ablation test)</div>
          <div style={{ fontSize: 14, color: '#e5e7eb', lineHeight: 1.8 }}>
            <code style={{ color: '#F59E0B' }}>product_name</code> (+18%) + <code style={{ color: '#ef4444' }}>material</code> (+45%) + <code style={{ color: '#F59E0B' }}>category</code> (+33%) + <code style={{ color: '#6b7280' }}>description</code> (+4%) = <strong style={{ color: '#10b981' }}>100%</strong>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            The remaining 5 fields (processing, composition, weight_spec, price, origin_country) affect 7-10 digit national codes and duty rate lookup, not the base 6-digit HS code accuracy.
          </div>
        </div>

        {/* Required vs Optional legend */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ color: '#9ca3af' }}>Required (3 fields)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
            <span style={{ color: '#9ca3af' }}>Recommended (6 fields)</span>
          </div>
        </div>
      </div>

      {/* Field Cards */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        {FIELDS.map((field, idx) => {
          const isOpen = activeField === field.id;
          return (
            <div
              key={field.id}
              style={{
                marginTop: 16,
                borderRadius: 12,
                border: `1px solid ${isOpen ? (field.required ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)') : 'rgba(255,255,255,0.08)'}`,
                background: isOpen ? 'rgba(255,255,255,0.03)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {/* Header - always visible */}
              <button
                onClick={() => setActiveField(isOpen ? null : field.id)}
                style={{
                  width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: '#0a0a0a', padding: '2px 8px', borderRadius: 4,
                    background: field.required ? '#ef4444' : '#F59E0B',
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{field.title}</span>
                    <span style={{ fontSize: 12, color: field.required ? '#ef4444' : '#F59E0B', marginLeft: 8 }}>
                      {field.required ? 'Required' : 'Recommended'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {field.accuracyPct > 0 && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>{field.accuracyImpact}</span>
                  )}
                  <span style={{ color: '#6b7280', fontSize: 18 }}>{isOpen ? '−' : '+'}</span>
                </div>
              </button>

              {/* Detail - collapsible */}
              {isOpen && (
                <div style={{ padding: '0 20px 20px' }}>
                  <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 16 }}>
                    {field.description}
                  </p>

                  {/* Legal Basis */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Legal Basis</div>
                    <div style={{ fontSize: 13, color: '#d1d5db' }}>{field.legalBasis}</div>
                  </div>

                  {/* Format */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Format</div>
                    <code style={{ fontSize: 13, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                      {field.format}
                    </code>
                  </div>

                  {/* Validation Rules */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Validation Rules</div>
                    {field.validation.map((v, vi) => (
                      <div key={vi} style={{
                        fontSize: 13, color: v.type === 'error' ? '#fca5a5' : '#fde68a',
                        marginBottom: 4, paddingLeft: 12,
                        borderLeft: `2px solid ${v.type === 'error' ? '#ef4444' : '#F59E0B'}`,
                      }}>
                        {v.rule}
                      </div>
                    ))}
                  </div>

                  {/* Examples */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Valid Examples</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {field.examples.map((ex, ei) => (
                        <code key={ei} style={{
                          fontSize: 12, color: '#10b981', background: 'rgba(16,185,129,0.1)',
                          padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)',
                        }}>
                          {ex}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Common Mistakes */}
                  {field.commonMistakes.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Common Mistakes</div>
                      {field.commonMistakes.map((m, mi) => (
                        <div key={mi} style={{ fontSize: 13, marginBottom: 4, display: 'flex', gap: 8 }}>
                          <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{m.wrong}</span>
                          <span style={{ color: '#6b7280' }}>→</span>
                          <span style={{ color: '#10b981' }}>{m.correct}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* WCO 21 Sections Reference */}
        <div style={{ marginTop: 48 }}>
          <button
            onClick={() => setShowSections(!showSections)}
            style={{
              width: '100%', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>WCO 21 Sections — Material → Section Mapping</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                The Harmonized System organizes all products into 21 Sections, primarily by material.
                This is why the <code style={{ color: '#ef4444' }}>material</code> field is critical (+45% accuracy).
              </div>
            </div>
            <span style={{ color: '#6b7280', fontSize: 18 }}>{showSections ? '−' : '+'}</span>
          </button>

          {showSections && (
            <div style={{ marginTop: 8, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Section</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#9ca3af', fontWeight: 600 }}>Material Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {WCO_SECTIONS.map((s, si) => (
                    <tr key={si} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 16px', color: '#F59E0B', fontWeight: 700 }}>{s.num}</td>
                      <td style={{ padding: '8px 16px', color: '#e5e7eb' }}>{s.name}</td>
                      <td style={{ padding: '8px 16px', color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>{s.materials}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Accepted Weight/Spec Units */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowUnits(!showUnits)}
            style={{
              width: '100%', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 12, padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Accepted Weight / Specification Units (70+)</div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                SI units, trade units, and industry-specific units recognized by the validation system.
              </div>
            </div>
            <span style={{ color: '#6b7280', fontSize: 18 }}>{showUnits ? '−' : '+'}</span>
          </button>

          {showUnits && (
            <div style={{ marginTop: 8, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
              {UNIT_GROUPS.map((g, gi) => (
                <div key={gi} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>{g.label}</div>
                  <code style={{ fontSize: 12, color: '#9ca3af', lineHeight: 2 }}>{g.units}</code>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Link */}
        <div style={{
          marginTop: 48, padding: 24, borderRadius: 12,
          background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Ready to classify?
          </div>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>
            Use these 9 fields with the POTAL API to get accurate HS Codes and Total Landed Costs for 240 countries.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <a href="/developers/docs" style={{
              padding: '10px 24px', borderRadius: 8, background: '#F59E0B', color: '#0a0a0a',
              textDecoration: 'none', fontWeight: 700, fontSize: 14,
            }}>
              API Documentation →
            </a>
            <a href="/developers" style={{
              padding: '10px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff',
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}>
              Get API Key
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
