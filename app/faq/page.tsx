'use client';

import { useState, useMemo } from 'react';

interface FAQ {
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  // HS Code (10)
  { category: 'HS Code', question: 'What is an HS Code?', answer: 'The Harmonized System (HS) code is a standardized numerical method of classifying traded products. It is used by customs authorities around the world to identify products for tariff and statistical purposes. HS codes are maintained by the World Customs Organization (WCO) and consist of 6 digits at the international level, with countries adding additional digits for national specificity.' },
  { category: 'HS Code', question: 'How many digits does an HS code have?', answer: 'Internationally, HS codes are 6 digits. Countries add national digits: the US uses 10 digits (HTS), the EU uses 10 digits (TARIC), the UK uses 10 digits, and most other countries use 8-10 digits. POTAL supports both 6-digit international codes and country-specific 10-digit codes for 7 major markets.' },
  { category: 'HS Code', question: 'How does POTAL classify products to HS codes?', answer: 'POTAL uses a 10-field classification system following WCO General Rules of Interpretation (GRI). Provide product name, material, category, and up to 6 additional fields. The engine applies 592 codified rules, 1,233 Heading descriptions, and 5,621 Subheading conditions to determine the exact HS Code — with 0-2 AI calls (most products need zero). Results are cached for instant future lookups at $0 cost.' },
  { category: 'HS Code', question: 'How accurate is POTAL\'s HS code classification?', answer: 'POTAL achieves 100% HS Code accuracy when all 9 classification fields are provided. This was verified through Amazon 50-product benchmarks (100% across all levels) and 466-combination ablation tests. The critical fields are: product name, material (+45% accuracy impact), and category (+33%). All responses include field validation feedback showing which fields to add for higher accuracy.' },
  { category: 'HS Code', question: 'What is a tariff schedule?', answer: 'A tariff schedule is a country\'s official list of HS codes with corresponding duty rates. POTAL includes bulk-downloaded tariff schedules from 7 governments (US, EU, UK, KR, CA, AU, JP) covering 131,794 tariff lines with country-specific 10-digit codes.' },
  { category: 'HS Code', question: 'Can I validate an HS code?', answer: 'Yes. Use the POST /api/v1/validate endpoint with your HS code. POTAL checks format validity, existence in the HS 2022 database, and optionally country-specific tariff line existence from government schedules.' },
  { category: 'HS Code', question: 'What is HS 2022?', answer: 'HS 2022 is the latest edition of the Harmonized System, effective from January 1, 2022. It includes updates for new technologies, environmental monitoring, and public health priorities. POTAL uses the HS 2022 nomenclature with 5,371 subheadings.' },
  { category: 'HS Code', question: 'What happens if my HS code is wrong?', answer: 'An incorrect HS code can lead to wrong duty rates, customs delays, fines, or seizure. POTAL\'s validation endpoint checks your code against the WCO database and suggests corrections. For high-value shipments, we recommend verifying with a customs broker.' },
  { category: 'HS Code', question: 'Does POTAL support image-based classification?', answer: 'Yes. The POST /api/v1/classify/image endpoint accepts product images (JPEG/PNG) and uses Claude Vision AI to identify the product type, material, and intended use before mapping to an HS code.' },
  { category: 'HS Code', question: 'What are price break rules in HS classification?', answer: 'Some HS subheadings distinguish products by value (e.g., "valued over $5 per unit"). POTAL automatically applies these price break rules when you include the price field in your API request.' },
  // FTA (5)
  { category: 'FTA', question: 'What is a Free Trade Agreement (FTA)?', answer: 'An FTA is an agreement between two or more countries to reduce or eliminate tariffs on goods traded between them. POTAL tracks 63 active FTAs and automatically identifies available preferential rates when you specify origin and destination countries.' },
  { category: 'FTA', question: 'How does POTAL find FTA savings?', answer: 'When you provide origin and destination countries, POTAL checks all applicable FTAs and compares preferential (AGR) rates against MFN rates. The calculate endpoint returns fta_utilization showing available savings and alternative agreements.' },
  { category: 'FTA', question: 'What is Rules of Origin?', answer: 'Rules of Origin (RoO) determine whether a product qualifies for FTA preferential treatment. Common criteria include: Change in Classification (CC/CTH/CTSH), Regional Value Content (RVC), and specific processing rules. POTAL\'s /api/v1/roo/check endpoint provides PSR lookup.' },
  { category: 'FTA', question: 'What is a Certificate of Origin?', answer: 'A Certificate of Origin (CoO) is a document declaring the country where goods were manufactured. It\'s required to claim FTA preferential rates. POTAL can generate CoO JSON documents via the /api/v1/customs-docs/generate endpoint.' },
  { category: 'FTA', question: 'How many FTAs does POTAL cover?', answer: 'POTAL tracks 63 active FTAs and trade agreements, with preferential rate data from MacMap covering 53 reporter countries and 144M+ agreement-specific tariff lines.' },
  // VAT (5)
  { category: 'VAT', question: 'What is VAT/GST?', answer: 'Value Added Tax (VAT) or Goods and Services Tax (GST) is a consumption tax applied to goods and services. POTAL covers VAT/GST rates for all 240 countries and territories, including standard rates, reduced rates, and product-specific rates.' },
  { category: 'VAT', question: 'What is IOSS?', answer: 'The Import One-Stop Shop (IOSS) allows sellers to collect VAT at the point of sale for goods shipped to the EU valued at €150 or less. This eliminates import VAT charges for the buyer. POTAL\'s /api/v1/ioss/check endpoint determines eligibility.' },
  { category: 'VAT', question: 'What is de minimis?', answer: 'De minimis is the threshold below which imported goods are exempt from customs duties and/or taxes. Thresholds vary by country — e.g., US $800, EU €150 (customs), AU A$1,000. POTAL includes de minimis data for all 240 countries.' },
  { category: 'VAT', question: 'What is reverse charge VAT?', answer: 'Reverse charge shifts VAT collection from the seller to the buyer. It applies in B2B transactions within the EU when the buyer has a valid VAT number. POTAL automatically applies reverse charge when buyer_vat_number is provided.' },
  { category: 'VAT', question: 'Does POTAL handle product-specific VAT rates?', answer: 'Yes. Many countries have reduced VAT rates for specific product categories (food, books, medicine). POTAL checks product-specific rates from the vat_product_rates database covering 20+ countries and 98+ product categories.' },
  // API Usage (5)
  { category: 'API', question: 'How do I get an API key?', answer: 'Sign up at potal.app, go to Dashboard > API Keys, and click "Create Key". You\'ll get a publishable key (pk_live_) for client-side use and a secret key (sk_live_) for server-side use. The Forever Free plan includes 100,000 API calls per month (soft cap).' },
  { category: 'API', question: 'What endpoints does POTAL offer?', answer: 'POTAL offers ~148 endpoints covering: /calculate (landed cost), /classify (HS code), /validate (HS validation), /screening (sanctions), /export (CSV), /countries (profiles), /exchange-rate, /ioss, /customs-docs, /verify/pre-shipment, trade remedies, RoO, incoterms, and more.' },
  { category: 'API', question: 'Is there a batch API?', answer: 'Yes. The /api/v1/classify/batch and /api/v1/import endpoints support batch processing. Free plan supports up to 50 items per request. Enterprise customers can request higher limits.' },
  { category: 'API', question: 'Are there SDKs available?', answer: 'Yes. POTAL provides official SDKs for Python (pip install potal) and JavaScript/TypeScript (npm install @potal/sdk). Both include async support, retry logic, and TypeScript types.' },
  { category: 'API', question: 'What is the API rate limit?', answer: 'The Forever Free plan includes 30 req/min. Enterprise customers get custom rate limits. Rate limit headers (X-RateLimit-Remaining) are included in all responses.' },
  // Pricing (5)
  { category: 'Pricing', question: 'How much does POTAL cost?', answer: 'POTAL is Forever Free — $0/month with 100,000 API calls (soft cap) and access to all 140+ features. No credit card required. For enterprise-scale needs, contact us.' },
  { category: 'Pricing', question: 'Is there a free plan?', answer: 'POTAL is Forever Free — not just a free tier, but the entire platform at no cost. 100,000 API calls/month (soft cap), all 140+ features included: HS classification, duty calculation, FTA detection, sanctions screening, and more. No credit card required.' },
  { category: 'Pricing', question: 'What happens if I exceed the soft cap?', answer: 'The 100,000 monthly soft cap exists for DDoS protection. If you consistently need higher volume, contact us for Enterprise pricing.' },
  { category: 'Pricing', question: 'Is POTAL really free?', answer: 'Yes. POTAL is Forever Free — all 140+ features, 100,000 API calls/month (soft cap), no credit card required, no trial period, no hidden charges. Enterprise customers with higher volume needs can contact us for custom pricing.' },
  { category: 'Pricing', question: 'How do I get Enterprise access?', answer: 'Contact us at enterprise@potal.app or use the Contact Us button on the Pricing page. Enterprise includes custom API limits, dedicated support, and SLA guarantees.' },
  // Troubleshooting (5)
  { category: 'Troubleshooting', question: 'Why am I getting a 401 error?', answer: 'A 401 error means your API key is invalid or missing. Make sure to include the Authorization: Bearer <your_key> header. Check that your key starts with pk_live_ or sk_live_ and hasn\'t been revoked.' },
  { category: 'Troubleshooting', question: 'Why is my duty rate showing 0%?', answer: 'A 0% duty rate can mean: (1) the product is duty-free under MFN treatment, (2) an FTA preferential rate applies, (3) de minimis threshold applies, or (4) the HS code wasn\'t found in the tariff database. Check the duty_rate_source field in the response.' },
  { category: 'Troubleshooting', question: 'Why is classification returning low confidence?', answer: 'Low confidence means key classification fields are missing. POTAL uses 9 fields: product name, material, category, description, processing, composition, weight spec, price, and origin country. Material alone improves accuracy by 45%. The API response includes a fieldValidation object showing exactly which fields to add. For example, providing material="cotton" and category="apparel" with product name is enough for 98%+ accuracy.' },
  { category: 'Troubleshooting', question: 'How do I handle currency conversion?', answer: 'POTAL automatically converts currencies using daily-updated exchange rates. You can also use the /api/v1/exchange-rate/historical endpoint for specific date rates. All calculations default to USD.' },
  { category: 'Troubleshooting', question: 'What if my country isn\'t in the database?', answer: 'POTAL covers all 240 countries and territories recognized by ISO. If your country code isn\'t working, ensure you\'re using the ISO 3166-1 alpha-2 code (e.g., US, GB, DE). Contact support@potal.app if issues persist.' },
  // Compliance (5)
  { category: 'Compliance', question: 'What is sanctions screening?', answer: 'Sanctions screening checks if a trade party appears on restricted party lists (OFAC SDN, BIS Entity, EU, UN, UK). POTAL screens against 21,301 entries from 19 sources. Mandatory for all US exporters and recommended globally.' },
  { category: 'Compliance', question: 'What are AD/CVD duties?', answer: 'Anti-Dumping (AD) duties are imposed when foreign goods are sold below fair market value. Countervailing Duties (CVD) offset foreign government subsidies. POTAL tracks 119,706 trade remedy cases across 36+ countries.' },
  { category: 'Compliance', question: 'What is ICS2?', answer: 'Import Control System 2 (ICS2) is the EU\'s pre-arrival security filing system. Release 3 requires HS 6-digit codes and detailed item descriptions (300+ characters) for all imports. POTAL automatically flags ICS2 requirements for EU destinations.' },
  { category: 'Compliance', question: 'What is Type 86 entry?', answer: 'Type 86 is a US customs entry type for Section 321 de minimis shipments (≤$800). It allows duty-free entry with simplified filing. POTAL\'s /api/v1/type86/prepare endpoint generates ACE filing JSON for eligible shipments.' },
  { category: 'Compliance', question: 'Does POTAL check for dangerous goods?', answer: 'Yes. POTAL checks products against 30+ commonly shipped dangerous goods categories (lithium batteries, aerosols, flammable liquids, compressed gases, etc.) mapped to HS codes and UN numbers. The calculate endpoint automatically flags dangerous goods with UN number, hazard class, and transport mode restrictions (air/sea/road/rail) per IATA DGR, IMDG Code, and ADR regulations.' },
  // General (5)
  { category: 'General', question: 'What is Total Landed Cost?', answer: 'Total Landed Cost (TLC) is the complete cost of a product delivered to the buyer\'s door, including: product price, shipping, customs duties, VAT/GST, processing fees, insurance, and brokerage. POTAL calculates all 15 cost components.' },
  { category: 'General', question: 'How many countries does POTAL cover?', answer: 'POTAL covers all 240 countries and territories with VAT/GST rates, de minimis thresholds, and customs fees. MFN tariff data covers 186 countries (113M+ tariff records), with preferential rates for 53 countries (257M+ rows) and bulk-downloaded 10-digit schedules from 7 governments (131,794 lines).' },
  { category: 'General', question: 'How often is the data updated?', answer: 'Exchange rates: daily via Vercel Cron. Tariff rates: weekly checks against government APIs (7 countries). Sanctions lists: weekly sync from OFAC/BIS. MacMap data: quarterly refresh. Government tariff schedules: updated when WCO releases changes.' },
  { category: 'General', question: 'Can I use POTAL for my Shopify store?', answer: 'Yes. POTAL offers a Shopify Theme App Extension that adds a landed cost calculator widget to your product pages. Install from the Shopify App Store and configure via the POTAL dashboard.' },
  { category: 'General', question: 'Is POTAL GDPR compliant?', answer: 'Yes. POTAL is designed with privacy by default. We process minimal personal data, use Paddle (EU-based MoR) for payment processing, and comply with GDPR, CCPA, and international data protection standards.' },
];

const categories = [...new Set(faqs.map(f => f.category))];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      const matchesSearch = !search || f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || f.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
      <p className="text-gray-600 mb-8">Find answers to common questions about POTAL, HS codes, tariffs, and trade compliance.</p>

      <input
        type="text"
        placeholder="Search questions..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-lg px-4 py-3 mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${!activeCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All ({faqs.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {cat} ({faqs.filter(f => f.category === cat).length})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((faq, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900 pr-4">{faq.question}</span>
              <span className="text-gray-400 flex-shrink-0">{openIndex === i ? '−' : '+'}</span>
            </button>
            {openIndex === i && (
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">{faq.category}</span>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">No results found. Try a different search term.</div>
        )}
      </div>
    </div>
  );
}
