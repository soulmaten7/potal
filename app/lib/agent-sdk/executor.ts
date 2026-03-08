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
