/**
 * POTAL Customs Documents — Generator
 *
 * Generates Commercial Invoice and Packing List from shipment data.
 * Auto-classifies HS codes for items that don't have one.
 */

import { classifyProductAsync } from '../ai-classifier';
import type {
  GenerateDocumentInput,
  GenerateDocumentResult,
  CommercialInvoice,
  PackingList,
  ShipmentItem,
  PackingListItem,
} from './types';

// ─── Invoice Number Generator ───────────────────────

function generateInvoiceNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

// ─── Auto-classify HS Codes ─────────────────────────

async function enrichItemsWithHsCodes(
  items: GenerateDocumentInput['items'],
  sellerId?: string
): Promise<ShipmentItem[]> {
  const enriched: ShipmentItem[] = [];

  for (const item of items) {
    let hsCode = item.hsCode;

    // Auto-classify if no HS code provided
    if (!hsCode && item.description) {
      try {
        const classification = await classifyProductAsync(
          item.description,
          item.category,
          sellerId
        );
        if (classification.hsCode && classification.confidence >= 0.5) {
          hsCode = classification.hsCode;
        }
      } catch {
        // Classification failed — leave hsCode undefined
      }
    }

    enriched.push({
      description: item.description,
      hsCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: Math.round(item.quantity * item.unitPrice * 100) / 100,
      countryOfOrigin: item.countryOfOrigin,
      weightKg: item.weightKg,
      category: item.category,
    });
  }

  return enriched;
}

// ─── Commercial Invoice Generator ───────────────────

function buildCommercialInvoice(
  input: GenerateDocumentInput,
  items: ShipmentItem[],
  invoiceNumber: string
): CommercialInvoice {
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const shipping = input.shippingCost || 0;
  const insurance = input.insuranceCost || 0;
  const grandTotal = Math.round((subtotal + shipping + insurance) * 100) / 100;

  // Determine origin from items or exporter
  const originCountry =
    items.find(i => i.countryOfOrigin)?.countryOfOrigin ||
    input.exporter.country;

  return {
    invoiceNumber,
    invoiceDate: new Date().toISOString().split('T')[0],
    exporter: input.exporter,
    importer: input.importer,
    items,
    currency: input.currency || 'USD',
    subtotal: Math.round(subtotal * 100) / 100,
    shippingCost: shipping,
    insuranceCost: insurance,
    grandTotal,
    incoterm: input.incoterm || 'FOB',
    paymentTerms: input.paymentTerms,
    shippingMethod: input.shippingMethod,
    notes: input.notes,
    destinationCountry: input.importer.country,
    originCountry,
  };
}

// ─── Packing List Generator ─────────────────────────

function buildPackingList(
  input: GenerateDocumentInput,
  items: ShipmentItem[],
  invoiceNumber: string
): PackingList {
  const packingItems: PackingListItem[] = items.map((item, idx) => {
    const inputItem = input.items[idx];
    return {
      ...item,
      packageNumber: `${idx + 1} of ${items.length}`,
      dimensionsCm: inputItem?.dimensionsCm,
    };
  });

  const totalWeightKg = items.reduce((sum, i) => {
    return sum + (i.weightKg ? i.weightKg * i.quantity : 0);
  }, 0);

  return {
    invoiceNumber,
    date: new Date().toISOString().split('T')[0],
    exporter: input.exporter,
    importer: input.importer,
    items: packingItems,
    totalPackages: items.length,
    totalWeightKg: Math.round(totalWeightKg * 1000) / 1000,
    shippingMethod: input.shippingMethod,
    notes: input.notes,
  };
}

// ─── Main Generator ─────────────────────────────────

/**
 * Generate customs documents (Commercial Invoice, Packing List, or both).
 *
 * - Auto-classifies HS codes for items without them
 * - Calculates totals, subtotals
 * - Generates unique invoice numbers
 */
export async function generateDocuments(
  input: GenerateDocumentInput,
  sellerId?: string
): Promise<GenerateDocumentResult> {
  // Validate minimum input
  if (!input.items || input.items.length === 0) {
    throw new Error('At least one item is required.');
  }
  if (!input.exporter?.name || !input.exporter?.country) {
    throw new Error('Exporter name and country are required.');
  }
  if (!input.importer?.name || !input.importer?.country) {
    throw new Error('Importer name and country are required.');
  }

  // Enrich items with HS codes
  const enrichedItems = await enrichItemsWithHsCodes(input.items, sellerId);
  const invoiceNumber = generateInvoiceNumber();

  const result: GenerateDocumentResult = {};

  if (input.type === 'commercial_invoice' || input.type === 'both') {
    result.commercialInvoice = buildCommercialInvoice(input, enrichedItems, invoiceNumber);
  }

  if (input.type === 'packing_list' || input.type === 'both') {
    result.packingList = buildPackingList(input, enrichedItems, invoiceNumber);
  }

  return result;
}
