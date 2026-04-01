import React from 'react';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateISO: string;
  readingTime: number;
  author: string;
  category: string;
  keywords: string[];
  image?: string;
  content: React.ComponentType<any>;
  excerpt: string;
}

// ─── Code block helper ───
const Code = ({ children }: { children: string }) => (
  <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '20px', borderRadius: '12px', overflow: 'auto', fontSize: '13px', lineHeight: '1.6' }}>
    <code>{children}</code>
  </pre>
);

// ═══════════════════════════════════════════════════════════════
// Post 1: Total Landed Cost API (B2B rewrite)
// ═══════════════════════════════════════════════════════════════
const TotalLandedCostContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      Cross-border commerce adds hidden costs that break checkout flows. Import duties, VAT/GST,
      customs processing fees, and trade remedies can add 15-40% to the product price. If your
      platform doesn&apos;t surface these costs at checkout, buyers abandon orders or dispute charges at delivery.
    </p>
    <p>
      POTAL&apos;s Total Landed Cost API calculates all cost components in a single request, returning
      results in under 50ms for pre-computed routes. This guide covers what Total Landed Cost is,
      how the API works, and how to integrate it.
    </p>

    <h2>What is Total Landed Cost?</h2>
    <p>
      Total Landed Cost (TLC) is the complete price to deliver a product across borders. POTAL
      calculates up to 15 cost components:
    </p>
    <ul>
      <li><strong>Product Price:</strong> Base cost of the item (your input)</li>
      <li><strong>Shipping:</strong> International freight and last-mile delivery</li>
      <li><strong>Import Duty:</strong> MFN tariff rate based on HS Code + origin country (from 113M+ tariff records)</li>
      <li><strong>VAT / GST:</strong> Destination country consumption tax (240 countries covered)</li>
      <li><strong>Customs Processing Fee:</strong> Government administrative charges</li>
      <li><strong>De Minimis:</strong> Automatic threshold detection &mdash; duties waived below country-specific limits</li>
      <li><strong>FTA Savings:</strong> Preferential rates from 63 Free Trade Agreements auto-detected</li>
      <li><strong>AD/CVD:</strong> Anti-dumping and countervailing duties from 119,706 trade remedy cases</li>
      <li><strong>Special Taxes:</strong> Excise, IEPS, IPI, and sub-national taxes for 12 countries</li>
      <li><strong>Insurance &amp; Brokerage:</strong> Estimated based on Incoterms and shipment value</li>
    </ul>

    <h2>API Quick Start</h2>
    <p>
      A single POST request to <code>/api/v1/calculate</code> returns the full cost breakdown:
    </p>
    <Code>{`curl -X POST https://potal.app/api/v1/calculate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_name": "Cotton T-Shirt",
    "hs_code": "6109.10",
    "origin_country": "CN",
    "destination_country": "US",
    "value": 25.00,
    "currency": "USD",
    "shipping_cost": 5.00,
    "weight": 0.3
  }'`}</Code>

    <h3>Response</h3>
    <Code>{`{
  "total_landed_cost": 32.45,
  "breakdown": {
    "product_value": 25.00,
    "shipping": 5.00,
    "import_duty": 1.88,
    "vat_gst": 0.00,
    "customs_fee": 0.57,
    "insurance": 0.00
  },
  "duty_rate": 7.5,
  "duty_rate_source": "macmap_ntlc",
  "de_minimis_applied": true,
  "fta_available": false,
  "hs_code": "6109.10",
  "currency": "USD"
}`}</Code>

    <h2>SDK Integration</h2>
    <h3>JavaScript / TypeScript</h3>
    <Code>{`import { PotalClient } from '@potal/sdk';

const potal = new PotalClient('YOUR_API_KEY');

const result = await potal.calculate({
  product_name: 'Cotton T-Shirt',
  hs_code: '6109.10',
  origin_country: 'CN',
  destination_country: 'US',
  value: 25.00,
});

console.log(result.total_landed_cost); // 32.45`}</Code>

    <h3>Python</h3>
    <Code>{`from potal import PotalClient

client = PotalClient("YOUR_API_KEY")

result = client.calculate(
    product_name="Cotton T-Shirt",
    hs_code="6109.10",
    origin_country="CN",
    destination_country="US",
    value=25.00,
)

print(result.total_landed_cost)  # 32.45`}</Code>

    <h2>Data Coverage</h2>
    <ul>
      <li><strong>240 countries</strong> &mdash; VAT/GST, de minimis, customs fees for every territory</li>
      <li><strong>131,794 tariff lines</strong> &mdash; Government schedules from US, EU, UK, KR, JP, AU, CA with 10-digit codes</li>
      <li><strong>113M+ tariff records</strong> &mdash; MFN rates for 186 countries</li>
      <li><strong>63 FTAs</strong> &mdash; Preferential rates auto-detected</li>
      <li><strong>119,706 trade remedy cases</strong> &mdash; AD/CVD duties across 36+ countries</li>
      <li><strong>~155+ API endpoints</strong> &mdash; Calculate, classify, validate, screen, export, and more</li>
    </ul>

    <h2>Performance</h2>
    <p>
      Pre-computed routes (490 HS6 codes x 240 countries = 117,600 combinations) return in under 50ms.
      Non-cached routes typically respond within 120ms. Unlike manual lookup tools, POTAL returns
      real-time results from government-sourced tariff data &mdash; not estimates.
    </p>

    <h2>Pricing</h2>
    <p>
      POTAL is Forever Free &mdash; 100,000 API calls/month (soft cap) with access to all 140+ features.
      No credit card required. Enterprise customers can contact us for custom volume.
    </p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Post 2: HS Code Classification API (B2B rewrite)
// ═══════════════════════════════════════════════════════════════
const HsCodeGuideContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      HS Codes (Harmonized System codes) are the backbone of international trade. Every product
      crossing a border must be classified with an HS Code, which determines the duty rate
      applied by customs. Incorrect classification leads to overpaid duties, customs delays, or penalties.
    </p>
    <p>
      POTAL&apos;s classification API uses codified WCO rules &mdash; not AI guessing &mdash; to achieve
      100% accuracy when all 9 classification fields are provided. This guide covers the system
      architecture, the 9-field input, and how to integrate.
    </p>

    <h2>HS Code Structure</h2>
    <ul>
      <li><strong>Chapter (2 digits):</strong> Broad category (e.g., 61 = Knitted apparel)</li>
      <li><strong>Heading (4 digits):</strong> More specific group (e.g., 6109 = T-shirts)</li>
      <li><strong>Subheading (6 digits):</strong> Product type (e.g., 6109.10 = Cotton T-shirts)</li>
      <li><strong>National lines (8-10 digits):</strong> Country-specific extensions for 7 markets (US, EU, UK, KR, JP, AU, CA)</li>
    </ul>

    <h2>The 9-Field Classification System</h2>
    <p>
      POTAL follows the WCO General Rules of Interpretation (GRI) &mdash; the same process
      licensed customs brokers use. Instead of asking an LLM to &quot;guess&quot; the HS Code from a
      product name, POTAL applies 592 codified rules, 1,233 Heading descriptions, and 5,621
      Subheading conditions deterministically.
    </p>

    <h3>Fields and Accuracy Impact</h3>
    <p>Based on 466-combination ablation testing (23,300 pipeline runs):</p>
    <ul>
      <li><strong>product_name</strong> (required) &mdash; +18% accuracy. The anchor for classification</li>
      <li><strong>material</strong> (required) &mdash; +45% accuracy. CRITICAL. Determines the WCO Section (I-XXI)</li>
      <li><strong>origin_country</strong> (required) &mdash; Needed for 7-10 digit codes and duty rates</li>
      <li><strong>category</strong> &mdash; +33% accuracy. Resolves material-vs-function ambiguity</li>
      <li><strong>description</strong> &mdash; +4% accuracy at Heading level</li>
      <li><strong>processing</strong> &mdash; Heading distinction (knitted vs woven)</li>
      <li><strong>composition</strong> &mdash; Subheading distinction (100% cotton vs blend)</li>
      <li><strong>weight_spec</strong> &mdash; Weight-based tariff splits</li>
      <li><strong>price</strong> &mdash; Price-break rules (&quot;valued over/under $X&quot;)</li>
    </ul>
    <p>
      The top 3 fields (product_name + material + category) achieve 98%+ accuracy.
      All 9 fields achieve 100%.
    </p>

    <h2>API Request Example</h2>
    <Code>{`curl -X POST https://potal.app/api/v1/classify \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_name": "Men'\\'s Cotton T-Shirt",
    "material": "cotton",
    "category": "clothing",
    "origin_country": "CN",
    "processing": "knitted",
    "composition": "100% cotton",
    "weight_spec": "180g/m2",
    "price": 15.00
  }'`}</Code>

    <h3>Response</h3>
    <Code>{`{
  "hs_code": "6109.10.0012",
  "hs6": "6109.10",
  "confidence": 1.0,
  "section": "XI - Textiles",
  "chapter": "61 - Knitted or crocheted apparel",
  "heading": "6109 - T-shirts, singlets, tank tops",
  "subheading": "6109.10 - Of cotton",
  "national_code": "6109.10.0012",
  "rules_applied": ["GRI-1", "Section-XI-Note-1", "Chapter-61-Note-4"],
  "ai_calls": 0,
  "fieldValidation": {
    "provided": 8,
    "total": 9,
    "missing": ["description"],
    "accuracy_estimate": "100%"
  }
}`}</Code>

    <h2>How It Differs from AI-Only Approaches</h2>
    <p>
      Most competitors send the product name to an LLM and hope for the best. This approach
      typically achieves 24-46% accuracy at the 6-digit level because LLMs hallucinate HS codes,
      produce inconsistent results, and lack access to country-specific rules.
    </p>
    <p>
      POTAL&apos;s GRI pipeline applies rules in order: Section Notes &rarr; Chapter Notes &rarr;
      Heading matching &rarr; Subheading conditions &rarr; Country-specific 10-digit routing. AI is
      used only as a fallback for ambiguous cases (0-2 calls per classification). Results are
      cached, so repeat products cost $0 and return in under 10ms.
    </p>

    <h2>Batch Classification</h2>
    <p>
      Classify entire catalogs using <code>POST /api/v1/classify/batch</code>. Up to 50 items
      per request on the Forever Free plan. Enterprise customers can request higher batch limits.
    </p>

    <h2>Data Behind the Engine</h2>
    <ul>
      <li>592 codified WCO Section/Chapter Notes (99.3% code-only, 0.7% AI fallback)</li>
      <li>1,233 Heading descriptions with keyword extraction</li>
      <li>5,621 Subheading conditions with material/composition/weight rules</li>
      <li>131,794 government tariff lines (7 countries, 10-digit)</li>
      <li>13,849 keyword-to-heading mappings</li>
    </ul>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Post 3: De Minimis API (B2B rewrite)
// ═══════════════════════════════════════════════════════════════
const DeMinimisContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      De minimis thresholds determine whether imported goods are exempt from customs duties
      and taxes. POTAL&apos;s API automatically detects and applies de minimis rules for all 240
      countries &mdash; no manual lookup required.
    </p>

    <h2>What is De Minimis?</h2>
    <p>
      De minimis (Latin for &quot;about minimal things&quot;) is the threshold value below which goods
      can be imported without incurring customs duties or taxes. Each country sets its own
      thresholds, and they change frequently. POTAL&apos;s <code>de_minimis_thresholds</code> database
      covers all 240 countries and territories, updated via automated monitoring.
    </p>

    <h2>Key Thresholds (2026)</h2>
    <ul>
      <li><strong>United States:</strong> $800 for most origins. <strong>$0 for China/Hong Kong</strong> (effective 2025 &mdash; Section 321 reform eliminated de minimis for CN/HK origins)</li>
      <li><strong>European Union:</strong> &euro;150 for customs duty. VAT applies from &euro;0 (IOSS system since July 2021)</li>
      <li><strong>United Kingdom:</strong> &pound;135 VAT collection shift to seller</li>
      <li><strong>Canada:</strong> CAD $20 for tax, CAD $150 for duty</li>
      <li><strong>Australia:</strong> AUD $1,000 (one of the highest globally)</li>
      <li><strong>Japan:</strong> &yen;10,000 (~$67 USD)</li>
      <li><strong>South Korea:</strong> $150 USD</li>
      <li><strong>India:</strong> No de minimis &mdash; duties apply from &dollar;0</li>
      <li><strong>Brazil:</strong> $50 USD (Remessa Conforme program)</li>
      <li><strong>Mexico:</strong> $50 USD</li>
    </ul>
    <p>
      These are just 10 examples. POTAL covers all 240 countries with current thresholds.
    </p>

    <h2>Automatic Detection in the API</h2>
    <p>
      When you call <code>/api/v1/calculate</code>, de minimis is applied automatically based on
      the shipment value, origin, and destination:
    </p>
    <Code>{`curl -X POST https://potal.app/api/v1/calculate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_name": "Phone Case",
    "origin_country": "VN",
    "destination_country": "US",
    "value": 12.00
  }'`}</Code>

    <h3>Response (de minimis applied)</h3>
    <Code>{`{
  "total_landed_cost": 12.00,
  "breakdown": {
    "product_value": 12.00,
    "import_duty": 0.00,
    "vat_gst": 0.00,
    "customs_fee": 0.00
  },
  "de_minimis_applied": true,
  "de_minimis_threshold": 800,
  "de_minimis_currency": "USD",
  "duty_rate": 3.2,
  "duty_rate_note": "Duty waived - below de minimis threshold"
}`}</Code>

    <h2>US De Minimis: Origin Matters</h2>
    <p>
      The US eliminated de minimis for goods originating from China and Hong Kong. The same
      $12 phone case from CN would incur full duties:
    </p>
    <Code>{`// Same request but origin_country: "CN"
{
  "de_minimis_applied": false,
  "de_minimis_threshold": 0,
  "de_minimis_note": "CN/HK origin - Section 321 de minimis not available",
  "import_duty": 0.38
}`}</Code>

    <h2>IOSS and EU De Minimis</h2>
    <p>
      The EU eliminated VAT de minimis in 2021 via the Import One-Stop Shop (IOSS) system.
      While customs duties are still waived below &euro;150, VAT applies from &euro;0. Use
      POTAL&apos;s <code>/api/v1/ioss/check</code> endpoint to determine IOSS eligibility and
      calculate the correct VAT collection.
    </p>

    <h2>Type 86 Entry (US)</h2>
    <p>
      For US-bound shipments under $800 (non-CN/HK), Type 86 entry provides simplified customs
      filing. POTAL&apos;s <code>/api/v1/type86/prepare</code> endpoint generates ACE filing JSON for
      eligible shipments.
    </p>

    <h2>Querying Thresholds Directly</h2>
    <p>
      Use the <code>/api/v1/countries</code> endpoint to retrieve de minimis thresholds for
      any country without performing a full calculation:
    </p>
    <Code>{`GET /api/v1/countries?code=AU

{
  "country_code": "AU",
  "name": "Australia",
  "de_minimis_duty": 1000,
  "de_minimis_tax": 1000,
  "currency": "AUD",
  "vat_rate": 10.0
}`}</Code>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Post 4: API Quick Start Guide (NEW)
// ═══════════════════════════════════════════════════════════════
const ApiQuickstartContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      Get up and running with the POTAL Landed Cost API in under 5 minutes. This guide covers
      API key setup, your first API call, SDK installation, and production best practices.
    </p>

    <h2>Step 1: Get Your API Key</h2>
    <ol>
      <li>Sign up at <a href="https://potal.app">potal.app</a> (no credit card required)</li>
      <li>Go to Dashboard &rarr; API Keys</li>
      <li>Click &quot;Create Key&quot; to generate your keys:
        <ul>
          <li><code>pk_live_...</code> &mdash; Publishable key (client-side, rate-limited)</li>
          <li><code>sk_live_...</code> &mdash; Secret key (server-side, full access)</li>
        </ul>
      </li>
    </ol>
    <p>The Forever Free plan includes 100,000 API calls/month (soft cap) with access to all features.</p>

    <h2>Step 2: Your First API Call</h2>
    <h3>cURL</h3>
    <Code>{`curl -X POST https://potal.app/api/v1/calculate \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_name": "Wireless Bluetooth Earbuds",
    "hs_code": "8518.30",
    "origin_country": "CN",
    "destination_country": "DE",
    "value": 49.99,
    "currency": "USD"
  }'`}</Code>

    <h3>JavaScript / TypeScript</h3>
    <Code>{`import { PotalClient } from '@potal/sdk';

const potal = new PotalClient('sk_live_YOUR_KEY');

const result = await potal.calculate({
  product_name: 'Wireless Bluetooth Earbuds',
  hs_code: '8518.30',
  origin_country: 'CN',
  destination_country: 'DE',
  value: 49.99,
});

console.log(result.total_landed_cost);
console.log(result.breakdown);`}</Code>

    <h3>Python</h3>
    <Code>{`from potal import PotalClient

client = PotalClient("sk_live_YOUR_KEY")

result = client.calculate(
    product_name="Wireless Bluetooth Earbuds",
    hs_code="8518.30",
    origin_country="CN",
    destination_country="DE",
    value=49.99,
)

print(result.total_landed_cost)
print(result.breakdown)`}</Code>

    <h2>Step 3: Understanding the Response</h2>
    <Code>{`{
  "total_landed_cost": 72.34,
  "breakdown": {
    "product_value": 49.99,
    "shipping": 0.00,
    "import_duty": 0.00,
    "vat_gst": 9.50,
    "customs_fee": 0.00,
    "insurance": 0.00
  },
  "duty_rate": 0.0,
  "vat_rate": 19.0,
  "de_minimis_applied": true,
  "fta_available": false,
  "hs_code": "8518.30",
  "currency": "USD",
  "destination_country": "DE"
}`}</Code>
    <ul>
      <li><strong>total_landed_cost</strong> &mdash; The complete cost including all duties, taxes, and fees</li>
      <li><strong>breakdown</strong> &mdash; Itemized cost components</li>
      <li><strong>de_minimis_applied</strong> &mdash; Whether the shipment falls below the duty-free threshold</li>
      <li><strong>fta_available</strong> &mdash; Whether a Free Trade Agreement preferential rate exists</li>
      <li><strong>duty_rate / vat_rate</strong> &mdash; Applied rates as percentages</li>
    </ul>

    <h2>Step 4: HS Code Classification</h2>
    <p>
      Don&apos;t know the HS Code? Use the classification endpoint:
    </p>
    <Code>{`curl -X POST https://potal.app/api/v1/classify \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product_name": "Wireless Bluetooth Earbuds",
    "material": "plastic",
    "category": "electronics"
  }'`}</Code>

    <h2>Step 5: MCP Server for AI Agents</h2>
    <p>
      If you&apos;re building AI agents, POTAL is available as an MCP server:
    </p>
    <Code>{`npx potal-mcp-server`}</Code>
    <p>
      Add to your Claude Desktop config (<code>claude_desktop_config.json</code>):
    </p>
    <Code>{`{
  "mcpServers": {
    "potal": {
      "command": "npx",
      "args": ["potal-mcp-server"],
      "env": {
        "POTAL_API_KEY": "sk_live_YOUR_KEY"
      }
    }
  }
}`}</Code>

    <h2>Step 6: Error Handling</h2>
    <p>Common error codes and how to handle them:</p>
    <ul>
      <li><strong>401 Unauthorized</strong> &mdash; Invalid or missing API key. Check your <code>Authorization</code> header</li>
      <li><strong>429 Too Many Requests</strong> &mdash; Rate limit exceeded. Check <code>X-RateLimit-Remaining</code> header. Forever Free: 30 req/min. Contact us for higher limits</li>
      <li><strong>400 Bad Request</strong> &mdash; Missing required fields. The response body includes which fields are missing</li>
      <li><strong>402 Payment Required</strong> &mdash; Monthly quota exceeded. Wait for reset or contact us for Enterprise limits</li>
    </ul>

    <h2>Production Checklist</h2>
    <ul>
      <li>Use <code>sk_live_</code> keys on the server, <code>pk_live_</code> on the client</li>
      <li>Implement retry logic with exponential backoff for 5xx errors</li>
      <li>Cache results by HS code + origin + destination to minimize API calls</li>
      <li>Monitor usage via the Dashboard &rarr; Analytics page</li>
      <li>Set up webhook notifications for quota alerts</li>
    </ul>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Post 5: POTAL vs Avalara vs Zonos (NEW)
// ═══════════════════════════════════════════════════════════════
const ComparisonContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      Choosing a customs duty API for cross-border commerce? This comparison covers
      POTAL, Avalara, and Zonos &mdash; their approaches, data coverage, pricing,
      and developer experience. All data comes from publicly available documentation
      and pricing pages.
    </p>

    <h2>Overview</h2>
    <ul>
      <li><strong>POTAL</strong> &mdash; API-first landed cost infrastructure. Designed for developers
        integrating duty/tax calculation into platforms, checkout flows, and AI agents.
        Free tier available. MCP server for AI ecosystems.</li>
      <li><strong>Avalara</strong> &mdash; Enterprise tax compliance platform (AvaTax). Primarily focused
        on US sales tax with international capabilities. Targets mid-to-large enterprises
        with compliance needs.</li>
      <li><strong>Zonos</strong> &mdash; Cross-border checkout solution. Provides a JavaScript widget
        for e-commerce storefronts with landed cost display. Per-transaction pricing model.</li>
    </ul>

    <h2>Feature Comparison</h2>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Feature</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>POTAL</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Avalara</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Zonos</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>Country coverage</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>240</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>190+</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>200+</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>Tariff records</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>113M+</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Not disclosed</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Not disclosed</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>HS Code classification</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>9-field GRI rules</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>AI-based</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>AI-based</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>10-digit HS codes</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>7 countries</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Yes</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Limited</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>FTA detection</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>63 FTAs</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Yes</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Yes</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>Sanctions screening</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>21K entries</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Via partner</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>MCP Server</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Yes (npm)</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>No</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>Free tier</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>200 calls/mo</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>No</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '10px' }}>Starting price</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>$0 (Forever Free)</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Custom quote</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Per transaction</td>
          </tr>
          <tr>
            <td style={{ padding: '10px' }}>SDKs</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>JS, Python, cURL</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>Multiple</td>
            <td style={{ padding: '10px', textAlign: 'center' }}>JS widget</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Classification Approach</h2>
    <p>
      The key technical differentiator is how HS classification works:
    </p>
    <ul>
      <li><strong>POTAL</strong>: Codified GRI rules (592 rules, 1,233 headings, 5,621 subheadings). The engine
        applies WCO rules deterministically with 0-2 AI calls. 100% accuracy with complete 9-field input.</li>
      <li><strong>Avalara</strong>: AI-powered classification with human review options. Strong accuracy
        for their covered categories. Enterprise-focused with professional services available.</li>
      <li><strong>Zonos</strong>: AI classification integrated into their checkout widget. Designed for
        e-commerce storefronts rather than API-first integration.</li>
    </ul>

    <h2>When to Choose Each</h2>
    <ul>
      <li><strong>Choose POTAL</strong> if you need API-first integration, transparent pricing, MCP/AI agent
        support, or you want to start free and scale. Best for: platforms, SaaS products,
        developers building cross-border tools.</li>
      <li><strong>Choose Avalara</strong> if you need comprehensive US sales tax compliance alongside
        international duties, and you have an enterprise budget. Best for: mid-to-large retailers
        with US nexus obligations.</li>
      <li><strong>Choose Zonos</strong> if you want a drop-in checkout widget without backend integration.
        Best for: e-commerce stores wanting quick landed cost display at checkout.</li>
    </ul>

    <h2>Try POTAL Free</h2>
    <p>
      Forever Free &mdash; 100,000 API calls/month (soft cap). No credit card required. All 140+ features included.
    </p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Post 6: 9 Fields vs AI Guessing (NEW)
// ═══════════════════════════════════════════════════════════════
const NineFieldScienceContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      Most HS Code classification tools send a product name to an LLM and return whatever the
      model generates. This approach typically achieves 24-46% accuracy at the 6-digit level.
      POTAL takes a fundamentally different approach: codified WCO rules that achieve 100%
      accuracy with structured input. Here&apos;s the science behind it.
    </p>

    <h2>The Problem with AI-Only Classification</h2>
    <ul>
      <li><strong>Hallucination:</strong> LLMs generate plausible-looking HS codes that don&apos;t exist or are wrong.
        There are only 5,371 valid 6-digit codes, but models frequently produce invalid combinations.</li>
      <li><strong>Inconsistency:</strong> The same product classified twice can return different codes.
        Temperature, context window, and prompt variations cause drift.</li>
      <li><strong>Missing context:</strong> A product name alone is insufficient. &quot;Leather strap&quot; could be
        a watch strap (Section XVIII), a belt (Section VIII), or a machine part (Section XVI).
        Only the material + category combination resolves this.</li>
      <li><strong>Cost:</strong> Every classification requires a full LLM call at $0.01-0.03.
        At 10,000 products, that&apos;s $100-300 per classification run.</li>
    </ul>

    <h2>POTAL&apos;s GRI Pipeline</h2>
    <p>
      The WCO&apos;s General Rules of Interpretation (GRI) define how every customs broker in the
      world classifies products. POTAL codified this entire process:
    </p>
    <ol>
      <li><strong>Step 0 &mdash; Input Validation:</strong> Normalize 9 fields, extract keywords, validate materials against 91 WCO groups</li>
      <li><strong>Step 1 &mdash; Cache Lookup:</strong> Check if this product was classified before. If yes, return cached result ($0, &lt;10ms)</li>
      <li><strong>Step 2-1 &mdash; Section Selection:</strong> Material + category determine the WCO Section (21 possible)</li>
      <li><strong>Step 2-2 &mdash; Section Notes:</strong> Apply 592 codified rules (inclusion/exclusion/numeric thresholds)</li>
      <li><strong>Step 2-3 &mdash; Chapter Selection:</strong> Material detail + processing narrow to specific Chapter</li>
      <li><strong>Step 2-4 &mdash; Chapter Notes:</strong> Apply chapter-specific rules for boundary cases</li>
      <li><strong>Step 3-1 &mdash; Heading Selection:</strong> Product keywords match against 1,233 Heading descriptions</li>
      <li><strong>Step 3-2 &mdash; Subheading Selection:</strong> Composition + weight + price determine the 6th digit from 5,621 conditions</li>
      <li><strong>Step 4-6 &mdash; Country Router:</strong> Origin country routes to 7-10 digit national code using 131,794 government tariff lines</li>
    </ol>

    <h2>Ablation Study: Which Fields Matter Most</h2>
    <p>
      We ran 466 field combinations &times; 50 products = 23,300 pipeline executions to measure
      the impact of each field on classification accuracy:
    </p>
    <ul>
      <li><strong>material:</strong> +45.1% accuracy impact (CRITICAL). Without it, the system can&apos;t determine
        even the basic WCO Section. A cotton product and a steel product go to completely different
        parts of the HS system.</li>
      <li><strong>category:</strong> +32.8%. Resolves the &quot;material vs function&quot; conflict. A leather watch strap
        goes to watches (Section XVIII), not leather goods (Section VIII).</li>
      <li><strong>product_name:</strong> +18.0%. Provides the base keyword matching for Heading selection.</li>
      <li><strong>description:</strong> +4.8%. Adds context at the Chapter/Heading boundary.</li>
      <li><strong>processing, composition, weight_spec, price:</strong> 0% at Section/Chapter level, but
        critical for Subheading (6-digit) and national code (7-10 digit) accuracy.</li>
    </ul>

    <h2>Results</h2>
    <p>
      With all 9 fields provided:
    </p>
    <ul>
      <li>Section accuracy: 100%</li>
      <li>Chapter accuracy: 100%</li>
      <li>Heading accuracy: 100%</li>
      <li>HS6 accuracy: 100%</li>
      <li>AI calls: 0 (for standard products)</li>
      <li>Cost per classification: $0 (cached after first run)</li>
      <li>Response time: &lt;10ms (cached), &lt;50ms (computed)</li>
    </ul>
    <p>
      Verified across Amazon 50-product benchmarks (100% all levels) and 7-country
      10-digit verification (1,183 test cases, 100% duty rate accuracy).
    </p>

    <h2>Cost Comparison</h2>
    <ul>
      <li><strong>GPT-4 per classification:</strong> ~$0.03 (input + output tokens)</li>
      <li><strong>GPT-4o-mini:</strong> ~$0.001</li>
      <li><strong>POTAL (cached):</strong> $0.00 (database lookup only)</li>
      <li><strong>POTAL (first classification):</strong> $0.00-$0.001 (0-2 AI calls for edge cases)</li>
    </ul>
    <p>
      At 10,000 products/month, POTAL costs effectively $0 vs $100-300 for AI-only approaches.
      The first classification is computed and cached; all subsequent lookups are free.
    </p>

    <h2>Why This Matters for Developers</h2>
    <p>
      If you&apos;re building a platform that needs HS classification, you need deterministic,
      reproducible results. The same product should always get the same code. POTAL&apos;s rule-based
      pipeline guarantees this &mdash; the code path is deterministic, auditable, and backed by
      the same legal framework customs brokers use worldwide.
    </p>
    <p>
      AI is not the enemy &mdash; POTAL uses it as a fallback for genuinely ambiguous cases
      (about 0.7% of products). But AI should refine answers, not guess them.
    </p>
  </div>
);

// ─── Helper functions ───
export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getAllBlogPostSlugs(): string[] {
  return blogPosts.map(post => post.slug);
}

// ─── Blog Posts Array ───
export const blogPosts: BlogPost[] = [
  // ── New posts (newest first) ──
  {
    slug: '9-field-hs-classification-science',
    title: 'Why 9 Fields Beat AI Guessing: The Science Behind HS Code Classification',
    description: 'How POTAL achieves 100% HS Code accuracy using codified WCO rules instead of LLM guessing. Ablation study results from 23,300 pipeline runs.',
    date: 'March 25, 2026',
    dateISO: '2026-03-25',
    readingTime: 8,
    author: 'POTAL Team',
    category: 'Technical Deep Dive',
    keywords: ['HS classification accuracy', 'GRI rules API', 'automated customs classification', 'HS code AI vs rules', 'WCO classification'],
    content: NineFieldScienceContent,
    excerpt: 'Most HS classification tools achieve 24-46% accuracy with AI guessing. POTAL uses codified WCO rules for 100% accuracy with structured 9-field input.',
  },
  {
    slug: 'potal-vs-avalara-vs-zonos-comparison',
    title: 'POTAL vs Avalara vs Zonos: Customs Duty API Comparison (2026)',
    description: 'Feature-by-feature comparison of customs duty APIs: country coverage, HS classification approach, pricing, and developer experience.',
    date: 'March 24, 2026',
    dateISO: '2026-03-24',
    readingTime: 7,
    author: 'POTAL Team',
    category: 'Industry Analysis',
    keywords: ['customs duty API comparison', 'Avalara alternative', 'Zonos alternative', 'landed cost API comparison', 'cross-border API'],
    content: ComparisonContent,
    excerpt: 'Comparing POTAL, Avalara, and Zonos for cross-border commerce. Feature comparison, pricing, classification approach, and developer experience.',
  },
  {
    slug: 'potal-api-quickstart-guide',
    title: 'How to Integrate POTAL Landed Cost API: Quick Start for Developers',
    description: 'Get up and running with the POTAL API in 5 minutes. API key setup, first calculation, SDK installation, MCP server config, and production checklist.',
    date: 'March 23, 2026',
    dateISO: '2026-03-23',
    readingTime: 6,
    author: 'POTAL Team',
    category: 'Developer Guide',
    keywords: ['landed cost API integration', 'customs duty API tutorial', 'POTAL API quickstart', 'cross-border API setup', 'MCP server customs'],
    content: ApiQuickstartContent,
    excerpt: 'Step-by-step guide to integrating the POTAL Landed Cost API. Covers cURL, JavaScript SDK, Python SDK, MCP server setup, and error handling.',
  },
  // ── Updated existing posts ──
  {
    slug: 'understanding-total-landed-cost',
    title: 'Total Landed Cost API: How to Calculate Duties, Taxes & Fees for 240 Countries',
    description: 'Calculate total landed cost via API for 240 countries. Covers duty rates, VAT/GST, customs fees, FTA savings, and de minimis — with code examples.',
    date: 'March 1, 2026',
    dateISO: '2026-03-01',
    readingTime: 8,
    author: 'POTAL Team',
    category: 'API Guide',
    keywords: ['landed cost API', 'customs duty calculator API', 'total landed cost calculation', 'cross-border commerce API', 'duty tax fee API'],
    content: TotalLandedCostContent,
    excerpt: 'A single API call returns duties, taxes, fees, FTA savings, and de minimis detection for 240 countries. Under 50ms for pre-computed routes.',
  },
  {
    slug: 'hs-code-classification-guide',
    title: 'HS Code Classification API: 9-Field System That Achieves 100% Accuracy',
    description: 'How POTAL classifies products using 592 codified WCO rules, 9 input fields, and 0-2 AI calls. 100% accuracy verified across 23,300 ablation tests.',
    date: 'February 20, 2026',
    dateISO: '2026-02-20',
    readingTime: 9,
    author: 'POTAL Team',
    category: 'Technical',
    keywords: ['HS code API', 'product classification API', 'automated HS classification', 'GRI classification', 'HS code lookup API'],
    content: HsCodeGuideContent,
    excerpt: 'POTAL applies 592 codified WCO rules with 0-2 AI calls to achieve 100% HS Code accuracy. 9-field input system with material (+45%) as the critical field.',
  },
  {
    slug: 'de-minimis-thresholds-2026',
    title: 'De Minimis Thresholds API: Auto-Detect Duty-Free Shipments for 240 Countries',
    description: 'POTAL automatically applies de minimis rules for 240 countries. Covers US CN/HK $0 change, EU IOSS, Type 86, and API integration examples.',
    date: 'February 10, 2026',
    dateISO: '2026-02-10',
    readingTime: 7,
    author: 'POTAL Team',
    category: 'API Guide',
    keywords: ['de minimis API', 'customs threshold API', 'duty-free shipping API', 'IOSS API', 'Type 86 API'],
    content: DeMinimisContent,
    excerpt: 'De minimis thresholds for 240 countries with automatic detection in the POTAL API. Includes US origin-based rules, EU IOSS, and Type 86 entry.',
  },
];
