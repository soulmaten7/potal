#!/usr/bin/env node

/**
 * POTAL MCP Server
 *
 * Provides Total Landed Cost calculation tools for Claude.
 * Calculates import duties, taxes (VAT/GST), customs fees, and shipping
 * for cross-border purchases across 181 countries.
 *
 * Tools:
 *   - calculate_landed_cost: Calculate total cost for international purchases
 *   - list_supported_countries: Get all supported countries with tax info
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ──────────────────────────────────────────
const POTAL_API_BASE = "https://potal-x1vl.vercel.app/api/v1";
const API_KEY = process.env.POTAL_API_KEY || "";
const USER_AGENT = "potal-mcp-server/1.0.0";

// ─── Server Instance ────────────────────────────────────────
const server = new McpServer({
  name: "potal",
  version: "1.0.0",
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
    "the final total price the buyer will pay. Supports 181 countries.",
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
            text: "❌ POTAL API key is not configured. Please set the POTAL_API_KEY environment variable.\n\nGet your API key at: https://potal-x1vl.vercel.app",
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

// ─── Tool: list_supported_countries ─────────────────────────

server.tool(
  "list_supported_countries",
  "Get a list of all 181 supported countries with their VAT/GST rates, " +
    "average duty rates, de minimis thresholds, and currency information. " +
    "Use this to check if a country is supported or to compare tax rates.",
  {},
  async () => {
    if (!API_KEY) {
      return {
        content: [
          {
            type: "text" as const,
            text: "❌ POTAL API key is not configured. Please set the POTAL_API_KEY environment variable.\n\nGet your API key at: https://potal-x1vl.vercel.app",
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
