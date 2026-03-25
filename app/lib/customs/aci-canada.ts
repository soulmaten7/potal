/**
 * F050: Canada ACI/eManifest Data Generator
 *
 * C5: CBSA Advance Commercial Information for pre-arrival clearance.
 */

// ─── Types ──────────────────────────────────────────

export interface ACIShipment {
  cargoControlNumber: string;
  houseBillNumber: string;
  shipperName: string;
  shipperAddress: string;
  shipperCountry: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeCity: string;
  consigneeProvince: string;
  consigneePostalCode: string;
  hsCode: string;
  goodsDescription: string;
  countryOfOrigin: string;
  declaredValueCad: number;
  grossWeightKg: number;
  packageCount: number;
  transportMode: 'air' | 'sea' | 'highway' | 'rail';
  portOfEntry?: string;
}

export interface ACIData {
  cargoControlNumber: string;
  houseBillNumber: string;
  shipper: { name: string; address: string; country: string };
  consignee: { name: string; address: string; city: string; province: string; postalCode: string };
  goods: {
    hsCode: string;
    description: string;
    origin: string;
    valueCad: number;
    weightKg: number;
    packages: number;
  };
  transport: { mode: string; portOfEntry: string };
  submissionType: 'eManifest';
  timestamp: string;
}

export interface ACIValidation {
  valid: boolean;
  errors: string[];
}

// ─── Constants ──────────────────────────────────────

const VALID_PROVINCES = new Set([
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
]);

const MAJOR_PORTS: Record<string, string> = {
  air: 'CAYYZ', // Toronto Pearson
  sea: 'CAVAN', // Vancouver
  highway: 'CAWIN', // Windsor
  rail: 'CAMON', // Montreal
};

// ─── Functions ──────────────────────────────────────

export function generateACIData(shipment: ACIShipment): ACIData {
  return {
    cargoControlNumber: shipment.cargoControlNumber,
    houseBillNumber: shipment.houseBillNumber,
    shipper: {
      name: shipment.shipperName,
      address: shipment.shipperAddress,
      country: shipment.shipperCountry.toUpperCase(),
    },
    consignee: {
      name: shipment.consigneeName,
      address: shipment.consigneeAddress,
      city: shipment.consigneeCity,
      province: shipment.consigneeProvince.toUpperCase(),
      postalCode: shipment.consigneePostalCode.toUpperCase().replace(/\s/g, ''),
    },
    goods: {
      hsCode: shipment.hsCode.replace(/[^0-9]/g, '').substring(0, 10),
      description: shipment.goodsDescription.substring(0, 500),
      origin: shipment.countryOfOrigin.toUpperCase(),
      valueCad: Math.round(shipment.declaredValueCad * 100) / 100,
      weightKg: Math.round(shipment.grossWeightKg * 1000) / 1000,
      packages: shipment.packageCount,
    },
    transport: {
      mode: shipment.transportMode,
      portOfEntry: shipment.portOfEntry || MAJOR_PORTS[shipment.transportMode] || 'CAYYZ',
    },
    submissionType: 'eManifest',
    timestamp: new Date().toISOString(),
  };
}

export function validateACIFields(data: ACIData): ACIValidation {
  const errors: string[] = [];

  if (!data.cargoControlNumber) errors.push('Cargo control number is required');
  if (!data.houseBillNumber) errors.push('House bill number is required');
  if (!data.shipper.name) errors.push('Shipper name is required');
  if (!data.shipper.country || data.shipper.country.length !== 2) errors.push('Shipper country must be 2-letter ISO');
  if (!data.consignee.name) errors.push('Consignee name is required');
  if (!data.consignee.province || !VALID_PROVINCES.has(data.consignee.province)) {
    errors.push(`Consignee province must be valid Canadian province code. Got: "${data.consignee.province}"`);
  }
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(data.consignee.postalCode)) {
    errors.push('Consignee postal code must be Canadian format (A1A1A1)');
  }
  if (data.goods.hsCode.length < 6) errors.push('HS code must be at least 6 digits');
  if (!data.goods.description) errors.push('Goods description is required');
  if (data.goods.valueCad <= 0) errors.push('Declared value must be positive');
  if (data.goods.weightKg <= 0) errors.push('Gross weight must be positive');

  return { valid: errors.length === 0, errors };
}
