# POTAL MCP Server

Calculate the total landed cost of cross-border purchases directly in Claude. Get instant breakdowns of import duties, taxes (VAT/GST), customs fees, and shipping for 139 countries.

## Tools

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

### `list_supported_countries`
Get all 139 supported countries with VAT/GST rates, duty rates, and de minimis thresholds.

## Setup

### 1. Get your API Key
Sign up at [potal-x1vl.vercel.app](https://potal-x1vl.vercel.app) and get your API key.

### 2. Install

#### Option A: From npm (recommended)
```bash
npm install -g @potal/mcp-server
```

#### Option B: From source
```bash
git clone https://github.com/potal-dev/mcp-server.git
cd mcp-server
npm install
npm run build
```

### 3. Configure Claude Desktop

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "potal": {
      "command": "npx",
      "args": ["-y", "@potal/mcp-server"],
      "env": {
        "POTAL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or if installed from source:

```json
{
  "mcpServers": {
    "potal": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/build/index.js"],
      "env": {
        "POTAL_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

After saving the config, restart Claude Desktop. You should see the POTAL tools available.

## Usage Examples

Once connected, ask Claude:

- "How much will a $50 T-shirt from China cost me in the US including duties?"
- "I want to buy a €200 jacket from Italy — what's the total cost shipped to New York?"
- "Compare import costs: buying a laptop from Japan vs Germany, shipped to the US"
- "What duties will I pay importing shoes from the UK to Canada?"
- "Is a $400 watch from Switzerland duty-free in the US?"
- "日本にイタリアの革靴を送ると関税はいくらですか？"
- "Was kostet ein $100-Produkt aus China nach Deutschland mit Zoll?"
- "Combien coûte un sac à main de $300 importé d'Italie en France ?"
- "¿Cuánto cuesta importar un laptop de $500 de EE.UU. a México?"
- "이 가방을 중국에서 한국으로 보내면 관세 포함 총 얼마야?"
- "Quanto custa importar um tênis de $150 dos EUA para o Brasil?"
- "Quanto costa importare scarpe da $200 dalla Cina in Italia?"
- "从美国买一个$200的包寄到中国，总费用是多少？"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POTAL_API_KEY` | Yes | Your POTAL API key (pk_live_ or sk_live_) |

## About POTAL

POTAL is the infrastructure for global commerce — providing Total Landed Cost calculations for cross-border transactions. We support 139 countries and cover duties, taxes, and fees.

Website: [potal-x1vl.vercel.app](https://potal-x1vl.vercel.app)
