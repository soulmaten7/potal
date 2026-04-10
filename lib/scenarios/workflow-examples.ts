/**
 * Workflow Examples — CW24 Sprint 2
 *
 * 결정 4 (HOMEPAGE_REDESIGN_SPEC.md 233~280): 시나리오별 DevPanel 코드 예제.
 *
 * 5개 시나리오 × 4개 언어 (curl / python / node / go).
 * `custom` 은 Sprint 3 에서 별도 처리하므로 여기서 제외.
 *
 * 코드는 사용자가 그대로 붙여넣고 실행 가능한 형태를 지향.
 * syntax highlighter 라이브러리는 도입 금지 — DevPanel 내부에서 수동 색상 처리.
 */

export type Language = 'curl' | 'python' | 'node' | 'go';

export interface WorkflowExample {
  scenarioId: string;
  title: string;
  description: string;
  steps: string[];
  apiChain: string[];
  code: Record<Language, string>;
  docsUrl: string;
}

// ─── 1. Online Seller ─────────────────────────────────────────

const SELLER_CURL = `# Step 1 — Classify HS Code
HS=$(curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"description":"Handmade leather wallet","material":"leather"}' \\
  | jq -r .hs_code)

# Step 2 — Check import restrictions
curl -s -X POST https://api.potal.app/v1/restrictions \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"hs\\":\\"$HS\\",\\"from\\":\\"KR\\",\\"to\\":\\"US\\"}"

# Step 3 — Calculate landed cost
curl -s -X POST https://api.potal.app/v1/landed-cost \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"hs\\":\\"$HS\\",\\"from\\":\\"KR\\",\\"to\\":\\"US\\",\\"value\\":45}"`;

const SELLER_PYTHON = `import os
from potal import Potal

potal = Potal(api_key=os.environ["POTAL_API_KEY"])

# Step 1 — Classify
hs = potal.classify(
    description="Handmade leather wallet",
    material="leather",
).hs_code

# Step 2 — Restrictions
restrictions = potal.check_restrictions(hs=hs, origin="KR", destination="US")
if restrictions.blocked:
    raise RuntimeError(restrictions.reason)

# Step 3 — Landed cost
cost = potal.landed_cost(hs=hs, origin="KR", destination="US", value=45)
print(f"Landed cost: \${cost.total_usd:.2f}")`;

const SELLER_NODE = `import { Potal } from '@potal/sdk';

const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });

// Step 1 — Classify
const { hs_code } = await potal.classify({
  description: 'Handmade leather wallet',
  material: 'leather',
});

// Step 2 — Restrictions
const restrictions = await potal.checkRestrictions({
  hs: hs_code, from: 'KR', to: 'US',
});
if (restrictions.blocked) throw new Error(restrictions.reason);

// Step 3 — Landed cost
const cost = await potal.landedCost({
  hs: hs_code, from: 'KR', to: 'US', value: 45,
});
console.log(\`Landed cost: $\${cost.total_usd.toFixed(2)}\`);`;

const SELLER_GO = `package main

import (
	"fmt"
	"log"
	"os"

	"github.com/potal/potal-go/potal"
)

func main() {
	client := potal.New(os.Getenv("POTAL_API_KEY"))

	// Step 1
	cls, err := client.Classify(&potal.ClassifyRequest{
		Description: "Handmade leather wallet",
		Material:    "leather",
	})
	if err != nil {
		log.Fatal(err)
	}

	// Step 2
	r, err := client.CheckRestrictions(&potal.RestrictionsRequest{
		HS: cls.HSCode, From: "KR", To: "US",
	})
	if err != nil || r.Blocked {
		log.Fatalf("blocked: %v", r.Reason)
	}

	// Step 3
	c, err := client.LandedCost(&potal.LandedCostRequest{
		HS: cls.HSCode, From: "KR", To: "US", Value: 45,
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Landed cost: $%.2f\\n", c.TotalUSD)
}`;

// ─── 2. D2C Brand ─────────────────────────────────────────────

const D2C_CURL = `# Step 1 — Classify
HS=$(curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -d '{"description":"Organic cotton T-shirt","material":"cotton"}' \\
  | jq -r .hs_code)

# Step 2 — Lookup FTA (Korea-EU → 0% duty)
curl -s "https://api.potal.app/v1/fta?from=KR&to=DE&hs=$HS" \\
  -H "Authorization: Bearer $POTAL_API_KEY"

# Step 3 — Landed cost with FTA applied
curl -s -X POST https://api.potal.app/v1/landed-cost \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"hs\\":\\"$HS\\",\\"from\\":\\"KR\\",\\"to\\":\\"DE\\",\\"value\\":28,\\"quantity\\":500,\\"applyFta\\":true}"

# Step 4 — Generate commercial invoice
curl -s -X POST https://api.potal.app/v1/documents/commercial-invoice \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"orderId":"D2C-0001","seller":"Acme Korea","buyer":"Berlin Shop"}'`;

const D2C_PYTHON = `from potal import Potal

potal = Potal(api_key=os.environ["POTAL_API_KEY"])

# 1 — Classify
hs = potal.classify(description="Organic cotton T-shirt", material="cotton").hs_code

# 2 — FTA lookup (Korea-EU)
fta = potal.lookup_fta(origin="KR", destination="DE", hs=hs)
print(f"FTA: {fta.name}  rate: {fta.preferential_rate}%")

# 3 — Landed cost with FTA applied
cost = potal.landed_cost(
    hs=hs, origin="KR", destination="DE",
    value=28, quantity=500, apply_fta=True,
)

# 4 — Commercial invoice (PDF URL returned)
invoice = potal.generate_document(
    kind="commercial_invoice",
    order_id="D2C-0001",
    seller="Acme Korea",
    buyer="Berlin Shop",
)
print(invoice.pdf_url)`;

const D2C_NODE = `import { Potal } from '@potal/sdk';

const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });

const { hs_code } = await potal.classify({
  description: 'Organic cotton T-shirt',
  material: 'cotton',
});

// Korea-EU FTA → 0% duty
const fta = await potal.lookupFta({ from: 'KR', to: 'DE', hs: hs_code });
console.log(\`FTA: \${fta.name} — rate \${fta.preferential_rate}%\`);

const cost = await potal.landedCost({
  hs: hs_code, from: 'KR', to: 'DE',
  value: 28, quantity: 500, applyFta: true,
});

const invoice = await potal.generateDocument({
  kind: 'commercial_invoice',
  orderId: 'D2C-0001',
  seller: 'Acme Korea',
  buyer: 'Berlin Shop',
});
console.log(invoice.pdf_url);`;

const D2C_GO = `package main

import (
	"fmt"
	"log"
	"os"
	"github.com/potal/potal-go/potal"
)

func main() {
	c := potal.New(os.Getenv("POTAL_API_KEY"))

	cls, _ := c.Classify(&potal.ClassifyRequest{
		Description: "Organic cotton T-shirt", Material: "cotton",
	})
	fta, _ := c.LookupFTA(&potal.FTARequest{From: "KR", To: "DE", HS: cls.HSCode})
	fmt.Printf("FTA: %s rate=%.1f%%\\n", fta.Name, fta.PreferentialRate)

	cost, err := c.LandedCost(&potal.LandedCostRequest{
		HS: cls.HSCode, From: "KR", To: "DE",
		Value: 28, Quantity: 500, ApplyFTA: true,
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Landed cost/unit: $%.2f\\n", cost.PerUnitUSD)
}`;

// ─── 3. Importer ──────────────────────────────────────────────

const IMPORTER_CURL = `# Step 1 — Classify industrial equipment
HS=$(curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -d '{"description":"Industrial centrifugal pumps","category":"machinery"}' \\
  | jq -r .hs_code)

# Step 2 — Landed cost for a 40ft container
curl -s -X POST https://api.potal.app/v1/landed-cost \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"hs\\":\\"$HS\\",\\"from\\":\\"DE\\",\\"to\\":\\"KR\\",\\"value\\":85000,\\"container\\":\\"40ft\\"}"

# Step 3 — Denied party screening on the German manufacturer
curl -s -X POST https://api.potal.app/v1/screen-denied-party \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Muenchen Pumps GmbH","country":"DE"}'`;

const IMPORTER_PYTHON = `from potal import Potal

p = Potal(api_key=os.environ["POTAL_API_KEY"])

hs = p.classify(
    description="Industrial centrifugal pumps",
    category="machinery",
).hs_code

cost = p.landed_cost(
    hs=hs, origin="DE", destination="KR",
    value=85000, container="40ft",
)

screen = p.screen_denied_party(name="Muenchen Pumps GmbH", country="DE")
if screen.matched:
    raise RuntimeError(f"Denied party match: {screen.list_name}")

print(f"Container landed cost: \${cost.total_usd:,.2f}")`;

const IMPORTER_NODE = `import { Potal } from '@potal/sdk';
const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });

const { hs_code } = await potal.classify({
  description: 'Industrial centrifugal pumps',
  category: 'machinery',
});

const cost = await potal.landedCost({
  hs: hs_code, from: 'DE', to: 'KR',
  value: 85000, container: '40ft',
});

const screen = await potal.screenDeniedParty({
  name: 'Muenchen Pumps GmbH',
  country: 'DE',
});
if (screen.matched) {
  throw new Error(\`Denied party match: \${screen.list_name}\`);
}
console.log(\`Container landed cost: $\${cost.total_usd.toLocaleString()}\`);`;

const IMPORTER_GO = `package main

import (
	"fmt"
	"log"
	"os"
	"github.com/potal/potal-go/potal"
)

func main() {
	c := potal.New(os.Getenv("POTAL_API_KEY"))

	cls, _ := c.Classify(&potal.ClassifyRequest{
		Description: "Industrial centrifugal pumps", Category: "machinery",
	})

	cost, err := c.LandedCost(&potal.LandedCostRequest{
		HS: cls.HSCode, From: "DE", To: "KR",
		Value: 85000, Container: "40ft",
	})
	if err != nil {
		log.Fatal(err)
	}

	s, _ := c.ScreenDeniedParty(&potal.ScreenRequest{
		Name: "Muenchen Pumps GmbH", Country: "DE",
	})
	if s.Matched {
		log.Fatalf("denied party: %s", s.ListName)
	}

	fmt.Printf("Container landed cost: $%.2f\\n", cost.TotalUSD)
}`;

// ─── 4. Exporter ──────────────────────────────────────────────

const EXPORTER_CURL = `# Step 1 — Classify (dangerous goods: lithium-ion batteries)
HS=$(curl -s -X POST https://api.potal.app/v1/classify \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -d '{"description":"Lithium-ion battery cells","un_code":"UN3480"}' \\
  | jq -r .hs_code)

# Step 2 — Export restrictions (ECCN / dual-use)
curl -s -X POST https://api.potal.app/v1/restrictions \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"hs\\":\\"$HS\\",\\"from\\":\\"KR\\",\\"to\\":\\"US\\",\\"checkDualUse\\":true}"

# Step 3 — Denied party screening
curl -s -X POST https://api.potal.app/v1/screen-denied-party \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Acme Electronics Inc","country":"US"}'

# Step 4 — Export declaration PDF
curl -s -X POST https://api.potal.app/v1/documents/export-declaration \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"hs\\":\\"$HS\\",\\"value\\":250000,\\"from\\":\\"KR\\",\\"to\\":\\"US\\"}"`;

const EXPORTER_PYTHON = `from potal import Potal

p = Potal(api_key=os.environ["POTAL_API_KEY"])

hs = p.classify(
    description="Lithium-ion battery cells",
    un_code="UN3480",
).hs_code

restrictions = p.check_restrictions(
    hs=hs, origin="KR", destination="US", check_dual_use=True,
)
if restrictions.eccn:
    print(f"Warning: ECCN {restrictions.eccn} — export license required")

screen = p.screen_denied_party(name="Acme Electronics Inc", country="US")
assert not screen.matched, "Denied party match"

doc = p.generate_document(
    kind="export_declaration",
    hs=hs, value=250000, origin="KR", destination="US",
)
print(f"Declaration ready: {doc.pdf_url}")`;

const EXPORTER_NODE = `import { Potal } from '@potal/sdk';
const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });

const { hs_code } = await potal.classify({
  description: 'Lithium-ion battery cells',
  un_code: 'UN3480',
});

const r = await potal.checkRestrictions({
  hs: hs_code, from: 'KR', to: 'US', checkDualUse: true,
});
if (r.eccn) console.warn(\`ECCN \${r.eccn} — export license required\`);

const s = await potal.screenDeniedParty({
  name: 'Acme Electronics Inc', country: 'US',
});
if (s.matched) throw new Error('Denied party match');

const doc = await potal.generateDocument({
  kind: 'export_declaration',
  hs: hs_code, value: 250000, from: 'KR', to: 'US',
});
console.log(doc.pdf_url);`;

const EXPORTER_GO = `package main

import (
	"fmt"
	"log"
	"os"
	"github.com/potal/potal-go/potal"
)

func main() {
	c := potal.New(os.Getenv("POTAL_API_KEY"))

	cls, _ := c.Classify(&potal.ClassifyRequest{
		Description: "Lithium-ion battery cells", UNCode: "UN3480",
	})

	r, _ := c.CheckRestrictions(&potal.RestrictionsRequest{
		HS: cls.HSCode, From: "KR", To: "US", CheckDualUse: true,
	})
	if r.ECCN != "" {
		fmt.Printf("ECCN %s — license required\\n", r.ECCN)
	}

	s, _ := c.ScreenDeniedParty(&potal.ScreenRequest{
		Name: "Acme Electronics Inc", Country: "US",
	})
	if s.Matched {
		log.Fatal("denied party match")
	}

	doc, _ := c.GenerateDocument(&potal.DocumentRequest{
		Kind: "export_declaration",
		HS:   cls.HSCode, Value: 250000, From: "KR", To: "US",
	})
	fmt.Println(doc.PDFURL)
}`;

// ─── 5. Forwarder / 3PL ───────────────────────────────────────

const FORWARDER_CURL = `# Batch screening across 3 shipments (bulk endpoint)
curl -s -X POST https://api.potal.app/v1/screen-shipment \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d @shipments.json

# Batch landed cost — one request, many destinations
curl -s -X POST https://api.potal.app/v1/landed-cost/batch \\
  -H "Authorization: Bearer $POTAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items":[
      {"hs":"610910","from":"KR","to":"US","value":12000},
      {"hs":"610910","from":"KR","to":"DE","value":12000},
      {"hs":"610910","from":"KR","to":"JP","value":12000}
    ]
  }'

# Compare destinations for the cheapest route
curl -s "https://api.potal.app/v1/compare-countries?hs=610910&from=KR&value=12000&candidates=US,DE,JP" \\
  -H "Authorization: Bearer $POTAL_API_KEY"`;

const FORWARDER_PYTHON = `from potal import Potal
import json

p = Potal(api_key=os.environ["POTAL_API_KEY"])

shipments = json.load(open("shipments.json"))
screened = p.screen_shipment_batch(shipments)
print(f"{len([s for s in screened if s.ok])}/{len(screened)} cleared")

items = [
    {"hs": "610910", "from": "KR", "to": dest, "value": 12000}
    for dest in ("US", "DE", "JP")
]
results = p.landed_cost_batch(items)

cheapest = min(results, key=lambda r: r.total_usd)
print(f"Cheapest: {cheapest.destination} at \${cheapest.total_usd:.2f}")`;

const FORWARDER_NODE = `import { Potal } from '@potal/sdk';
import shipments from './shipments.json' assert { type: 'json' };

const potal = new Potal({ apiKey: process.env.POTAL_API_KEY });

const screened = await potal.screenShipmentBatch(shipments);
const cleared = screened.filter(s => s.ok).length;
console.log(\`\${cleared}/\${screened.length} cleared\`);

const results = await potal.landedCostBatch({
  items: ['US', 'DE', 'JP'].map(to => ({
    hs: '610910', from: 'KR', to, value: 12000,
  })),
});

const cheapest = results.reduce((a, b) =>
  a.total_usd < b.total_usd ? a : b
);
console.log(\`Cheapest: \${cheapest.destination} at $\${cheapest.total_usd}\`);`;

const FORWARDER_GO = `package main

import (
	"fmt"
	"log"
	"os"
	"github.com/potal/potal-go/potal"
)

func main() {
	c := potal.New(os.Getenv("POTAL_API_KEY"))

	items := []*potal.LandedCostRequest{
		{HS: "610910", From: "KR", To: "US", Value: 12000},
		{HS: "610910", From: "KR", To: "DE", Value: 12000},
		{HS: "610910", From: "KR", To: "JP", Value: 12000},
	}
	results, err := c.LandedCostBatch(items)
	if err != nil {
		log.Fatal(err)
	}

	cheapest := results[0]
	for _, r := range results {
		if r.TotalUSD < cheapest.TotalUSD {
			cheapest = r
		}
	}
	fmt.Printf("Cheapest: %s at $%.2f\\n", cheapest.Destination, cheapest.TotalUSD)
}`;

// ─── Catalog ──────────────────────────────────────────────────

export const WORKFLOW_EXAMPLES: Record<string, WorkflowExample> = {
  seller: {
    scenarioId: 'seller',
    title: 'Online Seller Workflow',
    description:
      'Classify a product, check import restrictions, and calculate landed cost in 3 API calls.',
    steps: [
      '1. Classify HS code from description + material',
      '2. Check import restrictions (KR → US)',
      '3. Calculate total landed cost (duties + taxes + fees)',
    ],
    apiChain: ['/v1/classify', '/v1/restrictions', '/v1/landed-cost'],
    code: {
      curl: SELLER_CURL,
      python: SELLER_PYTHON,
      node: SELLER_NODE,
      go: SELLER_GO,
    },
    docsUrl: '/developers/docs#workflow-seller',
  },
  d2c: {
    scenarioId: 'd2c',
    title: 'D2C Brand Workflow',
    description:
      'Classify → apply Korea-EU FTA (0% duty) → batch landed cost for 500 units → generate commercial invoice.',
    steps: [
      '1. Classify HS code',
      '2. Lookup FTA (Korea-EU → 0% preferential duty)',
      '3. Calculate landed cost with FTA applied',
      '4. Generate commercial invoice PDF',
    ],
    apiChain: [
      '/v1/classify',
      '/v1/fta',
      '/v1/landed-cost',
      '/v1/documents/commercial-invoice',
    ],
    code: {
      curl: D2C_CURL,
      python: D2C_PYTHON,
      node: D2C_NODE,
      go: D2C_GO,
    },
    docsUrl: '/developers/docs#workflow-d2c',
  },
  importer: {
    scenarioId: 'importer',
    title: 'Importer Workflow',
    description:
      'Classify machinery, calculate 40ft container landed cost, and screen the foreign supplier.',
    steps: [
      '1. Classify industrial equipment (HS code)',
      '2. Calculate 40ft container landed cost (DE → KR)',
      '3. Denied-party screen on the manufacturer',
    ],
    apiChain: ['/v1/classify', '/v1/landed-cost', '/v1/screen-denied-party'],
    code: {
      curl: IMPORTER_CURL,
      python: IMPORTER_PYTHON,
      node: IMPORTER_NODE,
      go: IMPORTER_GO,
    },
    docsUrl: '/developers/docs#workflow-importer',
  },
  exporter: {
    scenarioId: 'exporter',
    title: 'Exporter Workflow',
    description:
      'Dangerous goods (lithium cells): classify, run dual-use + ECCN check, screen the buyer, and generate an export declaration.',
    steps: [
      '1. Classify lithium-ion cells (UN3480)',
      '2. Dual-use / ECCN export-control check',
      '3. Denied-party screen on the buyer',
      '4. Generate export declaration PDF',
    ],
    apiChain: [
      '/v1/classify',
      '/v1/restrictions',
      '/v1/screen-denied-party',
      '/v1/documents/export-declaration',
    ],
    code: {
      curl: EXPORTER_CURL,
      python: EXPORTER_PYTHON,
      node: EXPORTER_NODE,
      go: EXPORTER_GO,
    },
    docsUrl: '/developers/docs#workflow-exporter',
  },
  forwarder: {
    scenarioId: 'forwarder',
    title: 'Forwarder / 3PL Workflow',
    description:
      'Bulk screen multiple shipments, calculate landed cost in batch, and compare destinations for the cheapest route.',
    steps: [
      '1. Batch screen shipments (denied party + sanctions)',
      '2. Batch landed-cost calculation for many destinations',
      '3. Compare destinations to pick the cheapest route',
    ],
    apiChain: [
      '/v1/screen-shipment',
      '/v1/landed-cost/batch',
      '/v1/compare-countries',
    ],
    code: {
      curl: FORWARDER_CURL,
      python: FORWARDER_PYTHON,
      node: FORWARDER_NODE,
      go: FORWARDER_GO,
    },
    docsUrl: '/developers/docs#workflow-forwarder',
  },
};

export function getWorkflowExample(scenarioId: string): WorkflowExample | null {
  return WORKFLOW_EXAMPLES[scenarioId] || null;
}

/**
 * CW31 "Honest Reset": Hardcoded placeholder values the 5 scenario code
 * snippets use by default. When the user types real inputs in NonDevPanel,
 * the DevPanel replaces these with the live values so the example code
 * always matches the calculation they just ran.
 */
const SCENARIO_DEFAULTS: Record<
  string,
  {
    product: string;
    from: string;
    to: string;
    value: number | string;
    quantity?: number;
    /** CW31-HF1: forwarder multi-destination default list */
    destinations?: string[];
  }
> = {
  seller: { product: 'Handmade leather wallet', from: 'KR', to: 'US', value: 45 },
  d2c: {
    product: 'Organic cotton T-shirt',
    from: 'KR',
    to: 'DE',
    value: 28,
    quantity: 500,
  },
  importer: {
    product: 'Industrial centrifugal pumps',
    from: 'DE',
    to: 'KR',
    value: 85000,
  },
  exporter: {
    product: 'Lithium-ion battery cells',
    from: 'KR',
    to: 'US',
    value: 250000,
  },
  forwarder: {
    product: 'Cotton T-shirts (batch)',
    from: 'KR',
    to: 'US',
    value: 12000,
    destinations: ['US', 'DE', 'JP'],
  },
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Render a workflow example's code block with live inputs substituted.
 * Any input that's empty/0 falls back to the scenario's hardcoded default,
 * so the sample code is always runnable even before the user types anything.
 */
export function renderWorkflowCode(
  scenarioId: string,
  lang: Language,
  inputs: Record<string, string | number | string[] | undefined>
): string {
  const example = getWorkflowExample(scenarioId);
  if (!example) return '';
  const defaults = SCENARIO_DEFAULTS[scenarioId];
  if (!defaults) return example.code[lang];

  const product = (inputs.product as string) || defaults.product;
  const from = ((inputs.from as string) || defaults.from).toUpperCase();
  const to = ((inputs.to as string) || defaults.to).toUpperCase();
  const valueNum = Number(inputs.value);
  const value =
    Number.isFinite(valueNum) && valueNum > 0 ? valueNum : defaults.value;
  const qtyNum = Number(inputs.quantity);
  const quantity =
    Number.isFinite(qtyNum) && qtyNum > 0
      ? qtyNum
      : defaults.quantity ?? undefined;

  let code = example.code[lang];

  // 1. product description — quoted string replacements
  code = code.replace(
    new RegExp(`"${escapeRegExp(defaults.product)}"`, 'g'),
    `"${product}"`
  );
  code = code.replace(
    new RegExp(`'${escapeRegExp(defaults.product)}'`, 'g'),
    `'${product}'`
  );

  // 2. from / to ISO2 — match both quoted forms and KR→US style literals
  const fromPatterns = [
    new RegExp(`"${escapeRegExp(defaults.from)}"`, 'g'),
    new RegExp(`'${escapeRegExp(defaults.from)}'`, 'g'),
    new RegExp(`\\\\"${escapeRegExp(defaults.from)}\\\\"`, 'g'),
  ];
  const toPatterns = [
    new RegExp(`"${escapeRegExp(defaults.to)}"`, 'g'),
    new RegExp(`'${escapeRegExp(defaults.to)}'`, 'g'),
    new RegExp(`\\\\"${escapeRegExp(defaults.to)}\\\\"`, 'g'),
  ];
  // Only replace from/to codes when they differ — otherwise risk of
  // overlapping replacements (e.g. "KR" → user also picked KR).
  if (from !== defaults.from) {
    for (const p of fromPatterns) code = code.replace(p, `"${from}"`);
    code = code.replace(
      new RegExp(`From:\\s*"${escapeRegExp(defaults.from)}"`, 'g'),
      `From: "${from}"`
    );
  }
  if (to !== defaults.to) {
    for (const p of toPatterns) code = code.replace(p, `"${to}"`);
    code = code.replace(
      new RegExp(`To:\\s*"${escapeRegExp(defaults.to)}"`, 'g'),
      `To: "${to}"`
    );
  }

  // 3. value — numeric literal
  if (value !== defaults.value) {
    code = code.replace(
      new RegExp(`\\bvalue["\\s:=]+${defaults.value}\\b`, 'g'),
      match => match.replace(String(defaults.value), String(value))
    );
    code = code.replace(
      new RegExp(`Value:\\s*${defaults.value}\\b`, 'g'),
      `Value: ${value}`
    );
  }

  // 4. quantity — numeric literal (d2c only)
  if (quantity !== undefined && quantity !== defaults.quantity) {
    code = code.replace(
      new RegExp(`\\bquantity["\\s:=]+${defaults.quantity}\\b`, 'g'),
      match => match.replace(String(defaults.quantity), String(quantity))
    );
    code = code.replace(
      new RegExp(`Quantity:\\s*${defaults.quantity}\\b`, 'g'),
      `Quantity: ${quantity}`
    );
  }

  // 5. CW31-HF1: forwarder multi-destination array replacement
  if (scenarioId === 'forwarder' && defaults.destinations) {
    const raw = inputs.destinations;
    const destArray = Array.isArray(raw)
      ? (raw as string[]).filter(Boolean).map(d => String(d).toUpperCase())
      : [];
    const liveDests = destArray.length > 0 ? destArray : defaults.destinations;
    const fromIso = String(from).toUpperCase();
    const valueStr = String(value);

    // --- curl: items JSON array ---
    const curlItemsBlock = liveDests
      .map(
        d =>
          `      {"hs":"610910","from":"${fromIso}","to":"${d}","value":${valueStr}}`
      )
      .join(',\n');
    code = code.replace(
      /"items":\[\n[\s\S]*?\n\s*\]/,
      `"items":[\n${curlItemsBlock}\n    ]`
    );
    // candidates query param
    code = code.replace(
      /candidates=[A-Z,]+/,
      `candidates=${liveDests.join(',')}`
    );

    // --- python: tuple form ("US", "DE", "JP") ---
    const pyTuple = liveDests.map(d => `"${d}"`).join(', ');
    code = code.replace(
      /for dest in \([^)]*\)/,
      `for dest in (${pyTuple})`
    );

    // --- node: array form ['US', 'DE', 'JP'] ---
    const nodeArr = liveDests.map(d => `'${d}'`).join(', ');
    code = code.replace(
      /\[[^\]]*?\]\.map\(to =>/,
      `[${nodeArr}].map(to =>`
    );

    // --- go: items slice body ---
    const goItems = liveDests
      .map(
        d =>
          `\t\t{HS: "610910", From: "${fromIso}", To: "${d}", Value: ${valueStr}},`
      )
      .join('\n');
    code = code.replace(
      /(items := \[\]\*potal\.LandedCostRequest\{\n)[\s\S]*?(\n\t\})/,
      `$1${goItems}$2`
    );
  }

  return code;
}

/**
 * Real Next.js API routes the demo backend should call per scenario.
 *
 * NOTE: WorkflowExample.apiChain contains marketing-style short paths
 * ("/v1/classify") intended for code examples shown to users. This helper
 * returns the actual route paths the demo server will hit internally.
 *
 * CW29 Sprint 7: used by /api/demo/scenario to orchestrate live engine calls.
 */
export function getScenarioApiChain(scenarioId: string): string[] {
  const chains: Record<string, string[]> = {
    seller: ['/api/v1/classify', '/api/v1/calculate'],
    d2c: ['/api/v1/classify', '/api/v1/calculate'],
    importer: ['/api/v1/classify', '/api/v1/calculate'],
    exporter: ['/api/v1/classify', '/api/v1/calculate'],
    forwarder: ['/api/v1/calculate'],
  };
  return chains[scenarioId] || [];
}

export const LANGUAGE_TABS: Array<{ id: Language; label: string }> = [
  { id: 'curl', label: 'cURL' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
  { id: 'go', label: 'Go' },
];
