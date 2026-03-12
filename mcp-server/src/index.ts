#!/usr/bin/env node

/**
 * POTAL MCP Server
 *
 * Provides Total Landed Cost calculation tools for Claude.
 * Calculates import duties, taxes (VAT/GST), customs fees, and shipping
 * for cross-border purchases across 240 countries and territories.
 *
 * Tools (7):
 *   - calculate_landed_cost: Calculate total cost for international purchases
 *   - classify_product: AI-powered HS code classification
 *   - check_restrictions: Import restriction & compliance check
 *   - screen_shipment: Comprehensive pre-shipment screening (cost + compliance)
 *   - screen_denied_party: Sanctions/denied-party screening (OFAC SDN + CSL, 21K entries)
 *   - lookup_fta: Free Trade Agreement lookup (63 FTAs)
 *   - list_supported_countries: Get all supported countries with tax info
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ──────────────────────────────────────────
const POTAL_API_BASE = "https://www.potal.app/api/v1";
const API_KEY = process.env.POTAL_API_KEY || "";
const USER_AGENT = "potal-mcp-server/1.2.0";

// ─── Server Instance ────────────────────────────────────────
const server = new McpServer({
  name: "potal",
  version: "1.2.0",
});

// ─── API Helper ─────────────────────────────────────────────

interface ApiResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

async function callPotalApi(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<ApiResponse> {
  const url = `${POTAL_API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  };

  try {
    const options: RequestInit = { method, headers };
    if (body && method === "POST") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API error (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return { success: true, data: data as Record<string, unknown> };
  } catch (err) {
    return {
      success: false,
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Format Helpers ─────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatBreakdown(data: Record<string, unknown>): string {
  const d = data.data ? (data.data as Record<string, unknown>) : data;

  const lines: string[] = [];

  lines.push("## Total Landed Cost Breakdown\n");

  if (d.productPrice !== undefined) {
    lines.push(`- **Product Price**: ${formatCurrency(Number(d.productPrice))}`);
  }
  if (d.shippingCost !== undefined && Number(d.shippingCost) > 0) {
    lines.push(`- **Shipping**: ${formatCurrency(Number(d.shippingCost))}`);
  }
  if (d.importDuty !== undefined && Number(d.importDuty) > 0) {
    lines.push(`- **Import Duty**: ${formatCurrency(Number(d.importDuty))}`);
  }
  if (d.vat !== undefined && Number(d.vat) > 0) {
    lines.push(`- **VAT/GST**: ${formatCurrency(Number(d.vat))}`);
  }
  if (d.mpf !== undefined && Number(d.mpf) > 0) {
    lines.push(`- **Merchandise Processing Fee**: ${formatCurrency(Number(d.mpf))}`);
  }
  if (d.salesTax !== undefined && Number(d.salesTax) > 0) {
    lines.push(`- **Sales Tax**: ${formatCurrency(Number(d.salesTax))}`);
  }

  lines.push("");
  if (d.totalLandedCost !== undefined) {
    lines.push(`### **Total: ${formatCurrency(Number(d.totalLandedCost))}**`);
  }

  if (d.isDutyFree) {
    lines.push("\n> ✅ This item qualifies for **duty-free** treatment.");
  }

  // Detailed breakdown array if available
  if (Array.isArray(d.breakdown) && d.breakdown.length > 0) {
    lines.push("\n### Detailed Breakdown\n");
    for (const item of d.breakdown) {
      const b = item as { label?: string; amount?: number; note?: string };
      let line = `- ${b.label || "Fee"}: ${formatCurrency(Number(b.amount || 0))}`;
      if (b.note) line += ` _(${b.note})_`;
      lines.push(line);
    }
  }

  return lines.join("\n");
}

// ─── Tool: calculate_landed_cost ────────────────────────────

server.tool(
  "calculate_landed_cost",
  "Calculate the total landed cost for a product being shipped internationally. " +
    "Returns a detailed breakdown of import duties, VAT/GST, customs fees, and " +
    "the final total price the buyer will pay. Supports 240 countries and territories. " +
    "Includes China CBEC tax, Mexico IEPS, Brazil cascading tax, India IGST, " +
    "and processing fees for 12 countries.",
  {
    price: z.number().describe("Product price in USD. Example: 49.99"),
    origin: z
      .string()
      .length(2)
      .describe(
        "Origin country as 2-letter ISO code. Examples: CN (China), DE (Germany), JP (Japan), IT (Italy), GB (United Kingdom)"
      ),
    destinationCountry: z
      .string()
      .length(2)
      .describe(
        "Destination country as 2-letter ISO code. Examples: US, GB, DE, CA, AU, JP, FR, KR"
      ),
    shippingPrice: z
      .number()
      .optional()
      .describe("Shipping cost in USD. Default: 0. Example: 8.50"),
    zipcode: z
      .string()
      .optional()
      .describe(
        "Destination ZIP/postal code. Recommended for US destinations to calculate state sales tax. Example: 10001 (New York), 90210 (Beverly Hills)"
      ),
    productName: z
      .string()
      .optional()
      .describe(
        "Name of the product for automatic HS Code classification. Examples: Cotton T-Shirt, Laptop, Running Shoes"
      ),
    productCategory: z
      .string()
      .optional()
      .describe(
        "Product category for classification. Examples: electronics, apparel, footwear, accessories, food"
      ),
    hsCode: z
      .string()
      .optional()
      .describe(
        "If known, the HS Code for precise duty calculation. Example: 6109.10 (cotton t-shirts)"
      ),
  },
  async (params) => {
    if (!API_KEY) {
      return {
        content: [
          {
            type: "text" as const,
            text: "❌ POTAL API key is not configured. Please set the POTAL_API_KEY environment variable.\n\nGet your API key at: https://www.potal.app",
          },
        ],
      };
    }

    const result = await callPotalApi("/calculate", "POST", {
      price: params.price,
      origin: params.origin,
      destinationCountry: params.destinationCountry,
      shippingPrice: params.shippingPrice,
      zipcode: params.zipcode,
      productName: params.productName,
      productCategory: params.productCategory,
      hsCode: params.hsCode,
    });

    if (!result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Calculation failed: ${result.error}`,
          },
        ],
        isError: true,
      };
    }

    const formatted = formatBreakdown(result.data!);

    return {
      content: [
        {
          type: "text" as const,
          text: formatted,
        },
      ],
    };
  }
);

// ─── Tool: classify_product ──────────────────────────────────

server.tool(
  "classify_product",
  "Classify a product into an HS (Harmonized System) code for customs. " +
    "Uses AI-powered classification with keyword matching fallback. " +
    "Returns HS code, description, chapter, and confidence level.",
  {
    productName: z.string().describe("Product name or description. Example: 'cotton t-shirt', 'laptop computer', 'running shoes'"),
    productCategory: z.string().optional().describe("Product category hint. Example: 'apparel', 'electronics', 'footwear'"),
    hsCode: z.string().optional().describe("Known HS code to override classification. Example: '6109.10'"),
  },
  async (params) => {
    if (!API_KEY) {
      return {
        content: [{ type: "text" as const, text: "❌ POTAL API key not configured." }],
      };
    }

    const result = await callPotalApi("/classify", "POST", {
      productName: params.productName,
      productCategory: params.productCategory,
      hsCode: params.hsCode,
    });

    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: `❌ Classification failed: ${result.error}` }],
        isError: true,
      };
    }

    const d = (result.data as any)?.data || result.data;
    const lines: string[] = [
      "## HS Code Classification\n",
      `- **Product**: ${params.productName}`,
      `- **HS Code**: ${d.hsCode || 'Unknown'}`,
      `- **Description**: ${d.description || d.hsDescription || 'N/A'}`,
      `- **Chapter**: ${d.chapter || (d.hsCode ? d.hsCode.substring(0, 2) : 'N/A')}`,
      `- **Classification Source**: ${d.classificationSource || d.source || 'N/A'}`,
    ];

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// ─── Tool: check_restrictions ───────────────────────────────

server.tool(
  "check_restrictions",
  "Check import restrictions for a product in a destination country. " +
    "Returns prohibited items, required permits, watched items, and carrier restrictions. " +
    "Essential for compliance screening before shipping.",
  {
    hsCode: z.string().describe("HS code to check restrictions for. Example: '9302' (firearms), '3004' (pharmaceuticals)"),
    destinationCountry: z.string().length(2).describe("Destination country ISO2 code. Example: 'US', 'DE', 'JP'"),
    productName: z.string().optional().describe("Product name for auto-classification if no HS code."),
  },
  async (params) => {
    if (!API_KEY) {
      return {
        content: [{ type: "text" as const, text: "❌ POTAL API key not configured." }],
      };
    }

    const result = await callPotalApi("/restrictions", "POST", {
      hsCode: params.hsCode,
      destinationCountry: params.destinationCountry,
      productName: params.productName,
    });

    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: `❌ Restriction check failed: ${result.error}` }],
        isError: true,
      };
    }

    const d = (result.data as any)?.data || result.data;
    const lines: string[] = [
      "## Import Restriction Check\n",
      `- **HS Code**: ${d.hsCode || params.hsCode}`,
      `- **Destination**: ${d.destinationCountry || params.destinationCountry}`,
      `- **Has Restrictions**: ${d.hasRestrictions ? '⚠️ Yes' : '✅ No'}`,
      `- **Prohibited**: ${d.isProhibited ? '🚫 YES' : 'No'}`,
    ];

    if (d.isWatched) {
      lines.push(`- **Watch List**: ⚠️ Item is on a watch list`);
    }

    if (Array.isArray(d.restrictedCarriers) && d.restrictedCarriers.length > 0) {
      lines.push(`- **Carrier Restrictions**: ${d.restrictedCarriers.join(', ')}`);
    }

    if (Array.isArray(d.restrictions) && d.restrictions.length > 0) {
      lines.push("\n### Restrictions Found\n");
      for (const r of d.restrictions) {
        lines.push(`- **[${(r.severity || '').toUpperCase()}]** ${r.category}: ${r.description}`);
        if (r.requiredDocuments?.length) {
          lines.push(`  - Required: ${r.requiredDocuments.join(', ')}`);
        }
      }
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// ─── Tool: screen_shipment ──────────────────────────────────

server.tool(
  "screen_shipment",
  "Comprehensive shipment screening: calculates landed cost, checks restrictions, " +
    "and identifies trade remedies — all in one call. Use this for a complete " +
    "pre-shipment compliance and cost analysis.",
  {
    price: z.number().describe("Product price in USD"),
    origin: z.string().length(2).describe("Origin country ISO2"),
    destinationCountry: z.string().length(2).describe("Destination country ISO2"),
    productName: z.string().describe("Product name for classification"),
    shippingPrice: z.number().optional().describe("Shipping cost in USD"),
    hsCode: z.string().optional().describe("Known HS code"),
  },
  async (params) => {
    if (!API_KEY) {
      return {
        content: [{ type: "text" as const, text: "❌ POTAL API key not configured." }],
      };
    }

    // Run calculate and restrictions in parallel
    const [calcResult, restrictResult] = await Promise.all([
      callPotalApi("/calculate", "POST", {
        price: params.price,
        origin: params.origin,
        destinationCountry: params.destinationCountry,
        productName: params.productName,
        shippingPrice: params.shippingPrice,
        hsCode: params.hsCode,
      }),
      callPotalApi("/restrictions", "POST", {
        hsCode: params.hsCode || "",
        destinationCountry: params.destinationCountry,
        productName: params.productName,
      }),
    ]);

    const lines: string[] = ["## Shipment Screening Report\n"];

    // Cost section
    if (calcResult.success && calcResult.data) {
      lines.push(formatBreakdown(calcResult.data));

      const d = (calcResult.data as any)?.data || calcResult.data;
      if (d.tradeRemedies?.hasRemedies) {
        lines.push("\n### ⚠️ Trade Remedies Apply");
        for (const m of d.tradeRemedies.measures || []) {
          lines.push(`- **${m.type}**: +${(m.dutyRate * 100).toFixed(1)}% — ${m.title}`);
        }
      }
      if (d.usAdditionalTariffs?.hasAdditionalTariffs) {
        lines.push("\n### ⚠️ US Additional Tariffs");
        if (d.usAdditionalTariffs.section301) lines.push(`- ${d.usAdditionalTariffs.section301.note}`);
        if (d.usAdditionalTariffs.section232) lines.push(`- ${d.usAdditionalTariffs.section232.note}`);
      }
      if (d.confidenceScore !== undefined) {
        lines.push(`\n**Confidence Score**: ${(d.confidenceScore * 100).toFixed(0)}%`);
      }
    } else {
      lines.push(`❌ Cost calculation failed: ${calcResult.error}`);
    }

    // Restrictions section
    lines.push("\n---\n### Compliance Check\n");
    if (restrictResult.success && restrictResult.data) {
      const r = (restrictResult.data as any)?.data || restrictResult.data;
      if (r.isProhibited) {
        lines.push("🚫 **PROHIBITED** — This item cannot be imported to the destination country.");
      } else if (r.hasRestrictions) {
        lines.push("⚠️ **Restrictions apply** — See details below:");
        for (const rest of r.restrictions || []) {
          lines.push(`- [${(rest.severity || '').toUpperCase()}] ${rest.category}: ${rest.description}`);
        }
      } else {
        lines.push("✅ No import restrictions found.");
      }
    } else {
      lines.push("⚠️ Restriction check unavailable.");
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// ─── Tool: screen_denied_party ───────────────────────────────

server.tool(
  "screen_denied_party",
  "Screen a person or entity against sanctions and denied-party lists. " +
    "Checks OFAC SDN, BIS Entity List, CSL, and other databases (21,301 entries " +
    "from 19 sources). Essential for trade compliance.",
  {
    name: z.string().describe("Person or entity name to screen. Example: 'Huawei Technologies'"),
    country: z.string().optional().describe("Country ISO2 code to narrow results. Example: 'CN'"),
    minScore: z.number().optional().describe("Minimum match score 0.5-1.0. Default: 0.8"),
  },
  async (params) => {
    if (!API_KEY) {
      return {
        content: [{ type: "text" as const, text: "❌ POTAL API key not configured." }],
      };
    }

    const result = await callPotalApi("/screening", "POST", {
      name: params.name,
      country: params.country,
      minScore: params.minScore,
    });

    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: `❌ Screening failed: ${result.error}` }],
        isError: true,
      };
    }

    const d = (result.data as any)?.data || result.data;
    const lines: string[] = [
      "## Denied Party Screening Result\n",
      `- **Name Screened**: ${params.name}`,
      `- **Has Matches**: ${d.hasMatches ? '⚠️ YES' : '✅ No matches'}`,
      `- **Status**: ${d.overallStatus || (d.hasMatches ? 'ALERT' : 'CLEAR')}`,
    ];

    if (d.hasMatches && Array.isArray(d.results)) {
      lines.push("\n### Matches Found\n");
      for (const m of d.results.slice(0, 10)) {
        lines.push(`- **${m.matchedName}** (Score: ${m.score}) — List: ${m.list}, Source: ${m.source || 'N/A'}`);
      }
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// ─── Tool: lookup_fta ────────────────────────────────────────

server.tool(
  "lookup_fta",
  "Look up Free Trade Agreements between two countries. " +
    "Covers 63 FTAs including USMCA, RCEP, CPTPP, KORUS, EU-UK TCA. " +
    "Returns preferential duty rates if an FTA applies.",
  {
    origin: z.string().length(2).describe("Origin country ISO2 code. Example: 'KR'"),
    destination: z.string().length(2).describe("Destination country ISO2 code. Example: 'US'"),
    hsCode: z.string().optional().describe("HS code for product-specific FTA rate. Example: '6109.10'"),
  },
  async (params) => {
    if (!API_KEY) {
      return {
        content: [{ type: "text" as const, text: "❌ POTAL API key not configured." }],
      };
    }

    const query = `?origin=${params.origin}&destination=${params.destination}${params.hsCode ? `&hsCode=${params.hsCode}` : ''}`;
    const result = await callPotalApi(`/fta${query}`, "GET");

    if (!result.success) {
      return {
        content: [{ type: "text" as const, text: `❌ FTA lookup failed: ${result.error}` }],
        isError: true,
      };
    }

    const d = (result.data as any)?.data || result.data;
    const lines: string[] = [
      "## FTA Lookup Result\n",
      `- **Route**: ${params.origin} → ${params.destination}`,
      `- **FTA Found**: ${d.hasFTA ? '✅ Yes' : '❌ No FTA'}`,
    ];

    if (d.hasFTA && d.agreements) {
      for (const fta of Array.isArray(d.agreements) ? d.agreements : [d.agreements]) {
        lines.push(`- **Agreement**: ${fta.name || fta.agreement || 'N/A'}`);
        if (fta.preferentialRate !== undefined) {
          lines.push(`- **Preferential Rate**: ${fta.preferentialRate}%`);
        }
      }
    }

    return {
      content: [{ type: "text" as const, text: lines.join("\n") }],
    };
  }
);

// ─── Tool: list_supported_countries ─────────────────────────

server.tool(
  "list_supported_countries",
  "Get a list of all 240 supported countries with their VAT/GST rates, " +
    "average duty rates, de minimis thresholds, and currency information. " +
    "Use this to check if a country is supported or to compare tax rates.",
  {},
  async () => {
    if (!API_KEY) {
      return {
        content: [
          {
            type: "text" as const,
            text: "❌ POTAL API key is not configured. Please set the POTAL_API_KEY environment variable.\n\nGet your API key at: https://www.potal.app",
          },
        ],
      };
    }

    const result = await callPotalApi("/countries", "GET");

    if (!result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Failed to fetch countries: ${result.error}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result.data, null, 2),
        },
      ],
    };
  }
);

// ─── Start Server ───────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("POTAL MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
