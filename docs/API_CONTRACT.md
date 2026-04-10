# POTAL Demo API Contract

**Endpoint**: `POST /api/demo/scenario`
**Last updated**: 2026-04-10 KST (CW32)

Non-public demo endpoint used by the homepage. Rate limited to 30 req/min per
public IP; localhost is unlimited for testing. Never break UI — any engine
failure falls back to the bundled mock for that scenario.

## Request

```json
{
  "scenarioId": "seller" | "d2c" | "importer" | "exporter" | "forwarder",
  "inputs": { ... }
}
```

Response always returns `{ success, data: { scenarioId, source, inputs, result, generatedAt } }` or a 4xx error object. `source` is `"live"` when the real cost engine was called, `"mock"` when it fell back.

## Scenario input schemas

### `seller`, `d2c`, `importer`, `exporter` (single shipment)

```ts
{
  product: string;           // e.g. "Handmade leather wallet"
  from: string;              // ISO 3166-1 alpha-2
  to: string;                // ISO 3166-1 alpha-2
  value: number;             // USD, per-unit for d2c, total shipment otherwise
  quantity?: number;         // d2c: units; others: ignored by engine except for specific duties
  container?: string;        // importer only: "20ft" | "40ft" | "40hc"
}
```

### `forwarder` (multi-destination batch)

```ts
{
  product: string;
  from: string;              // ISO 3166-1 alpha-2
  value: number;             // total shipment value per destination (USD)
  // CW32: accept all three shapes
  destinations?: string[];   // canonical: up to 5 ISO codes
  to?: string | string[];    // legacy: array or bare string; bare string is promoted to [to]
  quantity?: number;         // optional
}
```

At least one of `destinations` or `to` must be present. The engine fires
one call per destination in parallel with an 8s per-call timeout; the
response includes a top-level `result.comparisonRows` table with one row
per destination sorted by total.

## Response shape

```ts
{
  scenarioId: string;
  source: "live" | "mock";
  inputs: {...};
  result: {
    hsCode: string;
    hsDescription: string;
    restriction: { blocked: boolean; summary: string; license?: string };
    landedCost: {
      currency: "USD";
      productValue: number;
      duty: number;
      dutyRate: number;
      taxes: number;
      shipping: number;
      fees: number;
      total: number;
    };
    extras?: { ftaName?: string; quantity?: number; forwarderCheapest?: string; ... };
    notes: string[];
    comparisonRows?: Array<{
      destination: string;   // ISO code
      hsCode: string;
      duty: number;
      taxes: number;
      shipping: number;
      fees: number;
      total: number;
      ftaName: string | null;
    }>;
  };
  generatedAt: string;       // ISO 8601
}
```

## Headers

- `X-Response-Time`: server-side compute time in ms
- `X-Demo-Source`: `live` or `mock`
- `Cache-Control: no-store`

## Rate limiting

- 30 requests per minute per public IP (in-memory window)
- Localhost (`127.0.0.1`, `::1`) and unknown-IP requests bypass the limit
  for local testing and benchmarking.
- Exceeding the limit returns `429` with `Retry-After: 30`.

## Example — forwarder with `to` array (CW32)

```bash
curl -s -X POST https://www.potal.app/api/demo/scenario \
  -H 'content-type: application/json' \
  -d '{
    "scenarioId": "forwarder",
    "inputs": {
      "product": "Cotton T-shirt",
      "from": "KR",
      "to": ["US", "GB", "CA"],
      "value": 12000
    }
  }' | jq '.data.source, .data.result.comparisonRows[].destination'
```

Expected: `"live"` with three `comparisonRows` covering US (KORUS), GB
(United Kingdom-Korea FTA), and CA (Canada-Korea FTA), all at 0% duty.
