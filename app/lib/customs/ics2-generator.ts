/**
 * F050: ICS2 Entry Summary Declaration Generator
 *
 * C2: EU ICS2 Release 3 (2024+) — all postal/express consignments
 * Generates ENS (Entry Summary Declaration) data with required fields.
 */

// ─── Types ──────────────────────────────────────────

export interface ShipmentData {
  consignorName: string;
  consignorAddress: string;
  consignorCountry: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCountry: string;
  hsCode: string;
  goodsDescription: string;
  grossMassKg: number;
  packageCount: number;
  declaredValueEur: number;
  currency: string;
  transportDocumentNumber: string;
  transportMode: 'air' | 'sea' | 'road' | 'rail' | 'post';
  carrierName?: string;
  countryOfOrigin: string;
  countryOfRouting?: string[];
}

export interface ENSData {
  mrn: string;
  declarationType: 'ENS';
  phase: string;
  consignor: { name: string; address: string; country: string };
  consignee: { name: string; address: string; country: string };
  goods: {
    hsCode: string;
    description: string;
    grossMassKg: number;
    packageCount: number;
    declaredValueEur: number;
    currency: string;
    countryOfOrigin: string;
  };
  transport: {
    mode: string;
    documentNumber: string;
    carrierName: string;
  };
  routing: string[];
  timestamp: string;
}

export interface ENSValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── ICS2 Phases ────────────────────────────────────

export function getICS2Phase(date?: Date): { phase: string; description: string; mandatory: boolean } {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;

  if (y < 2023 || (y === 2023 && m < 3)) {
    return { phase: 'Release 1', description: 'Air cargo pre-loading', mandatory: true };
  }
  if (y < 2024 || (y === 2024 && m < 3)) {
    return { phase: 'Release 2', description: 'General cargo, air', mandatory: true };
  }
  return { phase: 'Release 3', description: 'All postal and express consignments', mandatory: true };
}

// ─── MRN Generator ──────────────────────────────────

function generateMRN(countryCode: string): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const country = countryCode.toUpperCase().slice(0, 2) || 'EU';
  const random = Array.from({ length: 13 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
  // MRN format: YYCCxxxxxxxxxxxxxxC (18 chars)
  return `${year}${country}${random}A`;
}

// ─── ENS Data Generation ────────────────────────────

export function generateENSData(shipment: ShipmentData): ENSData {
  const phase = getICS2Phase();

  return {
    mrn: generateMRN(shipment.consigneeCountry),
    declarationType: 'ENS',
    phase: phase.phase,
    consignor: {
      name: shipment.consignorName,
      address: shipment.consignorAddress,
      country: shipment.consignorCountry,
    },
    consignee: {
      name: shipment.consigneeName,
      address: shipment.consigneeAddress,
      country: shipment.consigneeCountry,
    },
    goods: {
      hsCode: shipment.hsCode.replace(/[^0-9]/g, '').substring(0, 6),
      description: shipment.goodsDescription.substring(0, 280),
      grossMassKg: Math.round(shipment.grossMassKg * 1000) / 1000,
      packageCount: shipment.packageCount,
      declaredValueEur: Math.round(shipment.declaredValueEur * 100) / 100,
      currency: shipment.currency.toUpperCase(),
      countryOfOrigin: shipment.countryOfOrigin.toUpperCase(),
    },
    transport: {
      mode: shipment.transportMode,
      documentNumber: shipment.transportDocumentNumber,
      carrierName: shipment.carrierName || '',
    },
    routing: shipment.countryOfRouting || [],
    timestamp: new Date().toISOString(),
  };
}

// ─── ENS Validation ─────────────────────────────────

export function validateENSFields(data: ENSData): ENSValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.consignor.name) errors.push('Consignor name is required');
  if (!data.consignor.address) errors.push('Consignor address is required');
  if (!data.consignor.country || data.consignor.country.length !== 2) errors.push('Consignor country must be 2-letter ISO');
  if (!data.consignee.name) errors.push('Consignee name is required');
  if (!data.consignee.address) errors.push('Consignee address is required');
  if (!data.consignee.country || data.consignee.country.length !== 2) errors.push('Consignee country must be 2-letter ISO');

  const hs = data.goods.hsCode.replace(/[^0-9]/g, '');
  if (hs.length < 6) errors.push('HS code must be at least 6 digits');
  if (!data.goods.description) errors.push('Goods description is required');
  if (data.goods.description.length > 280) warnings.push('Goods description truncated to 280 chars');
  if (data.goods.grossMassKg <= 0) errors.push('Gross mass must be positive');
  if (data.goods.packageCount <= 0) errors.push('Package count must be positive');
  if (data.goods.declaredValueEur <= 0) errors.push('Declared value must be positive');

  if (!data.transport.documentNumber) errors.push('Transport document number is required');
  if (!['air', 'sea', 'road', 'rail', 'post'].includes(data.transport.mode)) {
    errors.push('Transport mode must be: air, sea, road, rail, or post');
  }

  return { valid: errors.length === 0, errors, warnings };
}
