/**
 * POTAL Agent SDK — Tool Definitions
 *
 * OpenAI-compatible function/tool schemas for AI agents
 * to interact with POTAL API via function calling.
 *
 * Supports: OpenAI GPT, Anthropic Claude, Google Gemini, Cohere, etc.
 */

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

/**
 * All POTAL tools available for AI agents.
 * Compatible with OpenAI function calling format.
 */
export const POTAL_TOOLS: ToolDefinition[] = [
  // ─── Calculate Landed Cost ──────────────────────
  {
    type: 'function',
    function: {
      name: 'potal_calculate_landed_cost',
      description: 'Calculate the total landed cost (import duties, VAT/GST, customs fees) for shipping a product internationally. Returns a detailed breakdown of all costs the buyer will pay.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'Name of the product (e.g. "Cotton T-Shirt", "Laptop", "Running Shoes"). Used for automatic HS code classification.',
          },
          price: {
            type: 'number',
            description: 'Product price in USD (e.g. 49.99)',
          },
          shippingPrice: {
            type: 'number',
            description: 'Shipping cost in USD (default: 0)',
          },
          origin: {
            type: 'string',
            description: 'Origin/source country as ISO 2-letter code (e.g. "CN" for China, "US" for USA). Or platform name like "AliExpress".',
          },
          destinationCountry: {
            type: 'string',
            description: 'Destination country as ISO 2-letter code (e.g. "US", "DE", "JP", "KR")',
          },
          zipcode: {
            type: 'string',
            description: 'Destination ZIP/postal code. Required for US state tax calculation.',
          },
          hsCode: {
            type: 'string',
            description: 'Optional HS code for precise duty rate (e.g. "6109.10"). If omitted, auto-classified from productName.',
          },
          productCategory: {
            type: 'string',
            description: 'Product category for better classification (e.g. "electronics", "apparel", "food")',
          },
        },
        required: ['productName', 'price', 'destinationCountry'],
      },
    },
  },

  // ─── Classify HS Code ───────────────────────────
  {
    type: 'function',
    function: {
      name: 'potal_classify_product',
      description: 'Classify a product into an HS (Harmonized System) code. Returns the 6-digit HS code, description, confidence score, and detected country of origin.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'Product name or description to classify (supports 50+ languages)',
          },
          category: {
            type: 'string',
            description: 'Optional product category hint',
          },
          imageUrl: {
            type: 'string',
            description: 'Optional image URL for vision-based classification',
          },
        },
        required: ['productName'],
      },
    },
  },

  // ─── Check Restrictions ─────────────────────────
  {
    type: 'function',
    function: {
      name: 'potal_check_restrictions',
      description: 'Check if a product has import restrictions, prohibitions, or requires special permits for a destination country. Returns severity level and required documents.',
      parameters: {
        type: 'object',
        properties: {
          productName: {
            type: 'string',
            description: 'Product name (auto-classifies HS code if hsCode not provided)',
          },
          hsCode: {
            type: 'string',
            description: 'HS code to check restrictions for',
          },
          destinationCountry: {
            type: 'string',
            description: 'Destination country ISO 2-letter code',
          },
        },
        required: ['destinationCountry'],
      },
    },
  },

  // ─── Generate Documents ─────────────────────────
  {
    type: 'function',
    function: {
      name: 'potal_generate_documents',
      description: 'Generate customs documents (Commercial Invoice, Packing List) for international shipments. Auto-classifies HS codes for items.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['commercial_invoice', 'packing_list', 'both'],
            description: 'Document type to generate',
          },
          exporter: {
            type: 'object',
            description: 'Seller/exporter info',
            properties: {
              name: { type: 'string', description: 'Company or person name' },
              country: { type: 'string', description: 'Country ISO 2-letter code' },
              address: { type: 'string' },
              city: { type: 'string' },
              email: { type: 'string' },
              taxId: { type: 'string', description: 'Tax ID / VAT number / EORI' },
            },
            required: ['name', 'country'],
          },
          importer: {
            type: 'object',
            description: 'Buyer/importer info',
            properties: {
              name: { type: 'string' },
              country: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
              email: { type: 'string' },
              taxId: { type: 'string' },
            },
            required: ['name', 'country'],
          },
          items: {
            type: 'array',
            description: 'Items in the shipment',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' },
                hsCode: { type: 'string' },
                countryOfOrigin: { type: 'string' },
                weightKg: { type: 'number' },
              },
              required: ['description', 'quantity', 'unitPrice'],
            },
          },
          shippingCost: { type: 'number' },
          incoterm: {
            type: 'string',
            enum: ['EXW', 'FCA', 'FOB', 'CIF', 'DDP', 'DAP'],
            description: 'Incoterm (default: FOB)',
          },
        },
        required: ['type', 'exporter', 'importer', 'items'],
      },
    },
  },

  // ─── Manage Tariff Alerts ───────────────────────
  {
    type: 'function',
    function: {
      name: 'potal_manage_alerts',
      description: 'Create, list, or delete tariff change alerts. Get notified when import duty rates change for specific products and trade routes.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['create', 'list', 'delete'],
            description: 'Action to perform',
          },
          hsCode: {
            type: 'string',
            description: 'HS code to monitor (for create)',
          },
          originCountry: {
            type: 'string',
            description: 'Origin country ISO code (for create)',
          },
          destinationCountry: {
            type: 'string',
            description: 'Destination country ISO code (for create)',
          },
          webhookUrl: {
            type: 'string',
            description: 'HTTPS webhook URL for notifications (for create)',
          },
          notifyEmail: {
            type: 'string',
            description: 'Email for notifications (for create)',
          },
          alertId: {
            type: 'string',
            description: 'Alert ID (for delete)',
          },
        },
        required: ['action'],
      },
    },
  },

  // ─── List Countries ─────────────────────────────
  {
    type: 'function',
    function: {
      name: 'potal_list_countries',
      description: 'Get a list of all 240 supported countries with VAT/GST rates, de minimis thresholds, and currency information.',
      parameters: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Optional: filter by specific country ISO code to get details for one country',
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Get tool definitions in OpenAI function calling format.
 */
export function getOpenAiTools(): ToolDefinition[] {
  return POTAL_TOOLS;
}

/**
 * Get tool definitions in Anthropic Claude format.
 */
export function getAnthropicTools(): Array<{
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required: string[] };
}> {
  return POTAL_TOOLS.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));
}
