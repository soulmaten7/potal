import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'cURL Reference | POTAL API',
  description: 'Complete cURL examples for every POTAL API endpoint. Copy-paste ready commands for testing and integration.',
};

interface CurlEndpoint {
  id: string;
  category: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  summary: string;
  curl: string;
}

const ENDPOINTS: CurlEndpoint[] = [
  // ─── Calculation ─────────────────────────────────
  { id: 'calc-single', category: 'Calculation', method: 'POST', path: '/api/v1/calculate', summary: 'Calculate Total Landed Cost (single item)',
    curl: `curl -X POST https://www.potal.app/api/v1/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"price":49.99,"shippingPrice":8.50,"origin":"CN","destinationCountry":"GB","productName":"Cotton T-Shirt"}'` },

  { id: 'calc-batch', category: 'Calculation', method: 'POST', path: '/api/v1/batch', summary: 'Batch calculation (up to 500 items)',
    curl: `curl -X POST https://www.potal.app/api/v1/batch \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"items":[{"price":49.99,"destinationCountry":"GB","productName":"Cotton T-Shirt"},{"price":99.00,"destinationCountry":"DE","productName":"Running Shoes"}]}'` },

  // ─── Classification ──────────────────────────────
  { id: 'classify', category: 'Classification', method: 'POST', path: '/api/v1/classify', summary: 'HS Code classification',
    curl: `curl -X POST https://www.potal.app/api/v1/classify \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"productName":"Cotton T-Shirt","origin":"CN","productCategory":"apparel"}'` },

  // ─── Shipping ────────────────────────────────────
  { id: 'shipping-rates', category: 'Shipping', method: 'POST', path: '/api/v1/shipping/rates', summary: 'Multi-carrier rate comparison',
    curl: `curl -X POST https://www.potal.app/api/v1/shipping/rates \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"originCountry":"US","destinationCountry":"GB","weightKg":2.5,"declaredValue":100}'` },

  { id: 'shipping-tracking', category: 'Shipping', method: 'POST', path: '/api/v1/shipping/tracking', summary: 'Track shipment with customs events',
    curl: `curl -X POST https://www.potal.app/api/v1/shipping/tracking \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"trackingNumber":"1Z999AA10123456784","carrier":"ups"}'` },

  { id: 'shipping-dim-weight', category: 'Shipping', method: 'POST', path: '/api/v1/shipping/dim-weight', summary: 'Dimensional weight calculator',
    curl: `curl -X POST https://www.potal.app/api/v1/shipping/dim-weight \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"lengthCm":40,"widthCm":30,"heightCm":20,"weightKg":3.5,"carrier":"dhl"}'` },

  { id: 'shipping-insurance', category: 'Shipping', method: 'POST', path: '/api/v1/shipping/insurance', summary: 'Shipping insurance premium calculator',
    curl: `curl -X POST https://www.potal.app/api/v1/shipping/insurance \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"declaredValue":500,"shippingCost":25,"coverageType":"full","destinationCountry":"BR","productCategory":"electronics"}'` },

  { id: 'shipping-multi-package', category: 'Shipping', method: 'POST', path: '/api/v1/shipping/multi-package', summary: 'Multi-package shipping estimate',
    curl: `curl -X POST https://www.potal.app/api/v1/shipping/multi-package \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"originCountry":"US","destinationCountry":"DE","packages":[{"weightKg":2,"lengthCm":30,"widthCm":20,"heightCm":15,"declaredValue":100},{"weightKg":5,"lengthCm":50,"widthCm":40,"heightCm":30,"declaredValue":250}]}'` },

  // ─── Customs Documents ───────────────────────────
  { id: 'customs-docs', category: 'Customs', method: 'POST', path: '/api/v1/customs-docs/generate', summary: 'Generate customs documents',
    curl: `curl -X POST https://www.potal.app/api/v1/customs-docs/generate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"doc_type":"commercial_invoice","shipment":{"shipper":{"name":"ACME Corp","country":"US"},"consignee":{"name":"UK Imports Ltd","country":"GB"},"destination":"GB","items":[{"hs_code":"6109.10","description":"Cotton T-Shirt","value":25,"quantity":100,"weight":0.2,"origin":"CN"}]}}'` },

  // ─── Fulfillment ─────────────────────────────────
  { id: '3pl-list', category: 'Fulfillment', method: 'POST', path: '/api/v1/fulfillment/3pl', summary: 'List 3PL providers',
    curl: `curl -X POST https://www.potal.app/api/v1/fulfillment/3pl \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"action":"list"}'` },

  // ─── Inventory ───────────────────────────────────
  { id: 'inventory-hubs', category: 'Inventory', method: 'GET', path: '/api/v1/inventory/hubs', summary: 'List fulfillment hubs',
    curl: `curl https://www.potal.app/api/v1/inventory/hubs \\
  -H "X-API-Key: YOUR_API_KEY"` },

  { id: 'inventory-optimize', category: 'Inventory', method: 'POST', path: '/api/v1/inventory/hubs', summary: 'Optimal hub selection',
    curl: `curl -X POST https://www.potal.app/api/v1/inventory/hubs \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"action":"optimize","destinationCountry":"DE","hs6":"610910","value":100,"weightKg":2}'` },

  // ─── Reports ─────────────────────────────────────
  { id: 'report-custom', category: 'Reports', method: 'POST', path: '/api/v1/reports/custom', summary: 'Custom report builder',
    curl: `curl -X POST https://www.potal.app/api/v1/reports/custom \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"dataSource":"classifications","startDate":"2026-01-01","endDate":"2026-03-31","format":"json","limit":100}'` },

  { id: 'report-export', category: 'Reports', method: 'POST', path: '/api/v1/reports/export', summary: 'Export report as CSV/PDF',
    curl: `curl -X POST https://www.potal.app/api/v1/reports/export \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"reportType":"classification_audit","format":"csv","limit":500}' -o report.csv` },

  // ─── Partners ────────────────────────────────────
  { id: 'partner-apply', category: 'Partners', method: 'POST', path: '/api/v1/partners/apply', summary: 'Apply as partner',
    curl: `curl -X POST https://www.potal.app/api/v1/partners/apply \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"companyName":"TechCorp","contactEmail":"partner@techcorp.com","partnerType":"technology","website":"https://techcorp.com"}'` },

  { id: 'partner-referral', category: 'Partners', method: 'POST', path: '/api/v1/partners/referral', summary: 'Generate referral code',
    curl: `curl -X POST https://www.potal.app/api/v1/partners/referral \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"action":"generate"}'` },

  // ─── Compliance ──────────────────────────────────
  { id: 'duty-rates', category: 'Compliance', method: 'POST', path: '/api/v1/duty-rates', summary: 'Lookup duty rates by HS code and country',
    curl: `curl -X POST https://www.potal.app/api/v1/duty-rates \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"hsCode":"6109.10","destinationCountry":"US"}'` },

  { id: 'sanctions', category: 'Compliance', method: 'POST', path: '/api/v1/sanctions/screen', summary: 'Sanctions screening',
    curl: `curl -X POST https://www.potal.app/api/v1/sanctions/screen \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"entityName":"ACME Trading Co","entityCountry":"CN"}'` },

  // ─── Support & Analytics ─────────────────────────
  { id: 'sentiment', category: 'Support', method: 'POST', path: '/api/v1/support/sentiment', summary: 'Customer feedback sentiment analysis',
    curl: `curl -X POST https://www.potal.app/api/v1/support/sentiment \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"text":"The landed cost calculator is amazing and saves us hours every week!","source":"support_ticket"}'` },

  { id: 'experiments', category: 'Analytics', method: 'POST', path: '/api/v1/experiments', summary: 'A/B testing — create experiment',
    curl: `curl -X POST https://www.potal.app/api/v1/experiments \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"action":"create","name":"widget_position_test","variants":[{"id":"control","weight":50},{"id":"after_price","weight":50}]}'` },
];

export default function CurlReferencePage() {
  const categories = [...new Set(ENDPOINTS.map(e => e.category))];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">cURL Reference</h1>
      <p className="text-gray-600 mb-8">Copy-paste ready cURL commands for every POTAL API endpoint. Replace <code className="bg-gray-100 px-1 rounded">YOUR_API_KEY</code> with your actual API key from the dashboard.</p>

      {/* Table of Contents */}
      <nav className="mb-10 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-gray-900 mb-3">Endpoints</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories.map(cat => (
            <a key={cat} href={`#${cat.toLowerCase()}`} className="text-sm text-blue-600 hover:underline">{cat} ({ENDPOINTS.filter(e => e.category === cat).length})</a>
          ))}
        </div>
      </nav>

      {categories.map(category => (
        <section key={category} id={category.toLowerCase()} className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b pb-2">{category}</h2>
          {ENDPOINTS.filter(e => e.category === category).map(ep => (
            <div key={ep.id} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded ${ep.method === 'GET' ? 'bg-green-100 text-green-800' : ep.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{ep.method}</span>
                <code className="text-sm font-mono text-gray-800">{ep.path}</code>
              </div>
              <p className="text-sm text-gray-600 mb-2">{ep.summary}</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                {ep.curl}
              </pre>
            </div>
          ))}
        </section>
      ))}

      <div className="mt-12 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Authentication</h3>
        <p className="text-sm text-blue-800">All endpoints require authentication via the <code className="bg-blue-100 px-1 rounded">X-API-Key</code> header. Get your API key from your <a href="/dashboard" className="underline">dashboard</a>.</p>
      </div>
    </div>
  );
}
