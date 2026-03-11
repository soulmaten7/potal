/**
 * POTAL Agent SDK — Tool Executor
 *
 * Executes tool calls from AI agents against POTAL API.
 * Maps function names to internal API calls.
 */

import { calculateGlobalLandedCostAsync, type GlobalCostInput } from '../cost-engine/GlobalCostEngine';
import { classifyProductAsync } from '../cost-engine/ai-classifier';
import { classifyWithVision } from '../cost-engine/ai-classifier';
import { checkRestrictions } from '../cost-engine/restrictions';
import { generateDocuments } from '../cost-engine/documents';
import { createAlert, listAlerts, deleteAlert } from '../cost-engine/alerts';
import type { GenerateDocumentInput } from '../cost-engine/documents';

export interface ToolCallInput {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute a POTAL tool call from an AI agent.
 */
export async function executeToolCall(
  call: ToolCallInput,
  sellerId: string
): Promise<ToolCallResult> {
  try {
    switch (call.name) {
      case 'potal_calculate_landed_cost':
        return await executeLandedCost(call.arguments);

      case 'potal_classify_product':
        return await executeClassify(call.arguments, sellerId);

      case 'potal_check_restrictions':
        return await executeRestrictions(call.arguments, sellerId);

      case 'potal_generate_documents':
        return await executeDocuments(call.arguments, sellerId);

      case 'potal_manage_alerts':
        return await executeAlerts(call.arguments, sellerId);

      case 'potal_screen_shipment':
        return await executeScreenShipment(call.arguments, sellerId);

      case 'potal_list_countries':
        return { success: true, data: { message: 'Use GET /api/v1/countries endpoint' } };

      default:
        return { success: false, error: `Unknown tool: ${call.name}` };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Tool execution failed.',
    };
  }
}

// ─── Individual Executors ───────────────────────────

async function executeLandedCost(args: Record<string, unknown>): Promise<ToolCallResult> {
  const input: GlobalCostInput = {
    price: Number(args.price) || 0,
    shippingPrice: Number(args.shippingPrice) || 0,
    origin: String(args.origin || 'CN'),
    destinationCountry: String(args.destinationCountry || 'US'),
    zipcode: args.zipcode ? String(args.zipcode) : undefined,
    hsCode: args.hsCode ? String(args.hsCode) : undefined,
    productName: args.productName ? String(args.productName) : undefined,
    productCategory: args.productCategory ? String(args.productCategory) : undefined,
  };

  const result = await calculateGlobalLandedCostAsync(input);
  return { success: true, data: result };
}

async function executeClassify(
  args: Record<string, unknown>,
  sellerId: string
): Promise<ToolCallResult> {
  const productName = String(args.productName || '');
  const imageUrl = args.imageUrl ? String(args.imageUrl) : undefined;

  if (imageUrl) {
    const visionResult = await classifyWithVision(imageUrl, productName || undefined);
    if (!visionResult) {
      return { success: false, error: 'Image classification failed.' };
    }
    return { success: true, data: visionResult.result };
  }

  if (!productName) {
    return { success: false, error: 'productName is required.' };
  }

  const category = args.category ? String(args.category) : undefined;
  const result = await classifyProductAsync(productName, category, sellerId);
  return { success: true, data: result };
}

async function executeRestrictions(
  args: Record<string, unknown>,
  sellerId: string
): Promise<ToolCallResult> {
  const dest = String(args.destinationCountry || '');
  if (!dest) return { success: false, error: 'destinationCountry is required.' };

  let hsCode = args.hsCode ? String(args.hsCode) : '';
  if (!hsCode && args.productName) {
    const classification = await classifyProductAsync(String(args.productName), undefined, sellerId);
    hsCode = classification.hsCode || '';
  }
  if (!hsCode) return { success: false, error: 'hsCode or productName is required.' };

  const result = checkRestrictions(hsCode, dest);
  return { success: true, data: result };
}

async function executeDocuments(
  args: Record<string, unknown>,
  sellerId: string
): Promise<ToolCallResult> {
  const input = args as unknown as GenerateDocumentInput;
  if (!input.type || !input.exporter || !input.importer || !input.items) {
    return { success: false, error: 'type, exporter, importer, and items are required.' };
  }
  const result = await generateDocuments(input, sellerId);
  return { success: true, data: result };
}

async function executeAlerts(
  args: Record<string, unknown>,
  sellerId: string
): Promise<ToolCallResult> {
  const action = String(args.action);

  if (action === 'list') {
    const alerts = await listAlerts(sellerId);
    return { success: true, data: { alerts, count: alerts.length } };
  }

  if (action === 'create') {
    const alert = await createAlert(sellerId, {
      hsCode: String(args.hsCode || ''),
      originCountry: String(args.originCountry || ''),
      destinationCountry: String(args.destinationCountry || ''),
      webhookUrl: args.webhookUrl ? String(args.webhookUrl) : undefined,
      notifyEmail: args.notifyEmail ? String(args.notifyEmail) : undefined,
    });
    return { success: true, data: alert };
  }

  if (action === 'delete') {
    const ok = await deleteAlert(String(args.alertId || ''), sellerId);
    return { success: true, data: { deleted: ok } };
  }

  return { success: false, error: `Unknown action: ${action}` };
}

async function executeScreenShipment(
  args: Record<string, unknown>,
  sellerId: string
): Promise<ToolCallResult> {
  const input: GlobalCostInput = {
    price: Number(args.price) || 0,
    shippingPrice: Number(args.shippingPrice) || 0,
    origin: String(args.origin || 'CN'),
    destinationCountry: String(args.destinationCountry || 'US'),
    hsCode: args.hsCode ? String(args.hsCode) : undefined,
    productName: args.productName ? String(args.productName) : undefined,
  };

  // Run cost calculation and restriction check in parallel
  const dest = String(args.destinationCountry || 'US');
  let hsCode = args.hsCode ? String(args.hsCode) : '';

  // Auto-classify if needed
  if (!hsCode && args.productName) {
    const classification = await classifyProductAsync(String(args.productName), undefined, sellerId);
    hsCode = classification.hsCode || '';
  }

  const [costResult, restrictionResult] = await Promise.all([
    calculateGlobalLandedCostAsync(input),
    hsCode ? Promise.resolve(checkRestrictions(hsCode, dest)) : Promise.resolve(null),
  ]);

  return {
    success: true,
    data: {
      landedCost: costResult,
      restrictions: restrictionResult,
      screening: {
        isProhibited: restrictionResult?.isProhibited || false,
        hasRestrictions: restrictionResult?.hasRestrictions || false,
        hasTradeRemedies: !!(costResult as any).tradeRemedies?.hasRemedies,
        hasAdditionalTariffs: !!(costResult as any).usAdditionalTariffs?.hasAdditionalTariffs,
        confidenceScore: (costResult as any).confidenceScore,
        accuracyLevel: (costResult as any).accuracyGuarantee?.level,
      },
    },
  };
}

/**
 * Get OpenAI Assistants v2 compatible tool definitions.
 * Use these when creating an OpenAI Assistant that calls POTAL tools.
 */
export function getOpenAIToolDefinitions() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'potal_calculate_landed_cost',
        description: 'Calculate the total landed cost for an international shipment including duties, taxes, and fees.',
        parameters: {
          type: 'object',
          properties: {
            price: { type: 'number', description: 'Product price in USD' },
            origin: { type: 'string', description: 'Origin country ISO2 code' },
            destinationCountry: { type: 'string', description: 'Destination country ISO2 code' },
            shippingPrice: { type: 'number', description: 'Shipping cost in USD' },
            productName: { type: 'string', description: 'Product name for HS classification' },
            hsCode: { type: 'string', description: 'Known HS code' },
            zipcode: { type: 'string', description: 'Destination ZIP code' },
          },
          required: ['price', 'origin', 'destinationCountry'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'potal_classify_product',
        description: 'Classify a product into an HS code for customs.',
        parameters: {
          type: 'object',
          properties: {
            productName: { type: 'string', description: 'Product name or description' },
            category: { type: 'string', description: 'Product category' },
            imageUrl: { type: 'string', description: 'Image URL for vision classification' },
          },
          required: ['productName'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'potal_check_restrictions',
        description: 'Check import restrictions and compliance for a product.',
        parameters: {
          type: 'object',
          properties: {
            hsCode: { type: 'string', description: 'HS code to check' },
            destinationCountry: { type: 'string', description: 'Destination country ISO2' },
            productName: { type: 'string', description: 'Product name for auto-classification' },
          },
          required: ['destinationCountry'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'potal_screen_shipment',
        description: 'Comprehensive shipment screening: cost + restrictions + trade remedies.',
        parameters: {
          type: 'object',
          properties: {
            price: { type: 'number', description: 'Product price in USD' },
            origin: { type: 'string', description: 'Origin country ISO2' },
            destinationCountry: { type: 'string', description: 'Destination country ISO2' },
            productName: { type: 'string', description: 'Product name' },
            shippingPrice: { type: 'number', description: 'Shipping cost' },
            hsCode: { type: 'string', description: 'Known HS code' },
          },
          required: ['price', 'origin', 'destinationCountry'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'potal_generate_documents',
        description: 'Generate customs documents (commercial invoice, packing list, etc.).',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Document type: commercial_invoice, packing_list, certificate_of_origin' },
            exporter: { type: 'object', description: 'Exporter details' },
            importer: { type: 'object', description: 'Importer details' },
            items: { type: 'array', description: 'Line items' },
          },
          required: ['type', 'exporter', 'importer', 'items'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'potal_manage_alerts',
        description: 'Manage tariff change alerts (create/list/delete).',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create', 'list', 'delete'], description: 'Action to perform' },
            hsCode: { type: 'string', description: 'HS code to watch (for create)' },
            originCountry: { type: 'string', description: 'Origin country (for create)' },
            destinationCountry: { type: 'string', description: 'Destination country (for create)' },
            alertId: { type: 'string', description: 'Alert ID (for delete)' },
          },
          required: ['action'],
        },
      },
    },
  ];
}
