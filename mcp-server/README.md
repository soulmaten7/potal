# POTAL MCP Server

Calculate the total landed cost of cross-border commerce directly in Claude, Cursor, and any MCP-compatible AI. Get instant breakdowns of import duties, taxes (VAT/GST), customs fees, and shipping for 240 countries.

**113M+ tariff records | 240 countries | 63 FTAs | AI HS classification | Sanctions screening**

## Quick Start

```bash
npx potal-mcp-server
```

## Tools (9)

### `calculate_landed_cost`
Calculate the total cost for a product being shipped internationally.

**Parameters:**
- `price` (required) — Product price in USD
- `origin` (required) — Origin country ISO code (e.g., `CN`, `US`, `DE`)
- `destinationCountry` (required) — Destination country ISO code
- `shippingPrice` — Shipping cost in USD (default: 0)
- `zipcode` — Required for US destinations (state sales tax)
- `productName` — Product name for HS Code classification
- `productCategory` — Category: electronics, apparel, footwear, etc.
- `hsCode` — Harmonized System code if known

### `classify_product`
AI-powered HS code classification. Provide a product name and get the harmonized system code.

**Parameters:**
- `productName` (required) — Product name or description
- `category` — Product category for improved accuracy

### `check_restrictions`
Check import restrictions and compliance requirements for a product in a destination country.

**Parameters:**
- `hsCode` (required) — HS code of the product
- `destinationCountry` (required) — Destination country ISO code
- `originCountry` — Origin country ISO code

### `screen_shipment`
Comprehensive pre-shipment screening — combines cost calculation with compliance checks (restrictions, sanctions, denied parties).

**Parameters:**
- `price` (required) — Product price in USD
- `origin` (required) — Origin country ISO code
- `destinationCountry` (required) — Destination country ISO code
- `productName` — Product name
- `consigneeName` — Consignee name for denied-party screening
- `shippingPrice` — Shipping cost in USD

### `screen_denied_party`
Screen a name against sanctions and denied-party lists (OFAC SDN + CSL, 21K+ entries).

**Parameters:**
- `name` (required) — Entity or individual name to screen
- `country` — Country for narrowing results

### `lookup_fta`
Look up Free Trade Agreement benefits between two countries (63 FTAs covered).

**Parameters:**
- `originCountry` (required) — Origin country ISO code
- `destinationCountry` (required) — Destination country ISO code
- `hsCode` — HS code to check specific preferential rates

### `list_supported_countries`
Get all 240 supported countries with VAT/GST rates, duty rates, and de minimis thresholds.

### `generate_document`
Generate trade documents: Commercial Invoice (CI), Packing List (PL), Certificate of Origin (C/O).

**Parameters:**
- `documentType` (required) — `commercial_invoice`, `packing_list`, or `certificate_of_origin`
- `shipmentData` (required) — Shipment details (origin, destination, items, etc.)

### `compare_countries`
Compare total landed costs across multiple destination countries for the same product.

**Parameters:**
- `price` (required) — Product price in USD
- `origin` (required) — Origin country ISO code
- `destinations` (required) — Array of destination country ISO codes
- `productName` — Product name
- `shippingPrice` — Shipping cost in USD

## Setup

### 1. Get your API Key
Sign up at [potal.app](https://potal.app) and get your API key.

### 2. Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "potal": {
      "command": "npx",
      "args": ["-y", "potal-mcp-server"],
      "env": {
        "POTAL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After saving the config, restart Claude Desktop. You should see 9 POTAL tools available.

## Usage Examples

Once connected, ask Claude:

- "How much will a $50 T-shirt from China cost me in the US including duties?"
- "Classify 'wireless bluetooth earbuds' and give me the HS code"
- "Check if there are any import restrictions for HS 8471 going to Brazil"
- "Screen a shipment: $200 leather bag from Italy to New York"
- "Screen 'Acme Corp' against sanctions lists"
- "Are there any FTA benefits between Korea and the US for HS 610510?"
- "Compare import costs for a $500 laptop from China to US, UK, Germany, and Japan"
- "Generate a commercial invoice for my shipment"
- "What countries are supported and their VAT rates?"

**Multilingual:**
- "日本にイタリアの革靴を送ると関税はいくらですか？"
- "Was kostet ein $100-Produkt aus China nach Deutschland mit Zoll?"
- "이 가방을 중국에서 한국으로 보내면 관세 포함 총 얼마야?"
- "从美国买一个$200的包寄到中国，总费用是多少？"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POTAL_API_KEY` | Yes | Your POTAL API key (pk_live_ or sk_live_) |

## About POTAL

POTAL is the infrastructure for global commerce — providing Total Landed Cost calculations for cross-border transactions. 240 countries, 113M+ tariff records, 63 FTAs, sanctions screening, and AI-powered HS classification.

Website: [potal.app](https://potal.app)
